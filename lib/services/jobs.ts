import { createServerClient } from '@/lib/supabase/client';
import { WORLD_CONSTANTS } from '@/lib/constants';
import { generateReport } from './reports';
import { checkBuildingUpgrades } from '@/lib/services/building.service';

export interface JobResult {
  job: string;
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

const isDev =
  process.env.NODE_ENV === 'development' ||
  process.env.VERCEL_ENV === 'preview' ||
  process.env.CIVITAS_ENV === 'dev' ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'dev';

const customIntervalMinutes = process.env.CYCLE_INTERVAL_MINUTES
  ? parseInt(process.env.CYCLE_INTERVAL_MINUTES, 10)
  : null;

const CYCLE_INTERVAL_MS = customIntervalMinutes
  ? customIntervalMinutes * 60 * 1000
  : isDev
    ? 5 * 60 * 1000
    : 24 * 60 * 60 * 1000;

interface FocusModifiers {
  materials: number;
  energy: number;
  knowledge: number;
  influence: number;
}

const FOCUS_MODIFIERS: Record<string, FocusModifiers> = {
  EDUCATION: { materials: -0.1, energy: 0, knowledge: 0.5, influence: 0 },
  INFRASTRUCTURE: { materials: 0.5, energy: 0, knowledge: 0, influence: -0.1 },
  CULTURE: { materials: 0, energy: -0.1, knowledge: 0, influence: 0.5 },
  DEFENSE: { materials: 0.25, energy: 0.25, knowledge: 0, influence: -0.25 },
};

const BASE_GENERATION = 10;

export async function markOverdueCitiesContested(): Promise<JobResult> {
  const supabase = createServerClient();
  const cutoff = new Date(Date.now() - WORLD_CONSTANTS.BEACON_WINDOW_MS).toISOString();

  const { data: overdueCities, error: fetchError } = await supabase
    .from('cities')
    .select('*')
    .eq('status', 'GOVERNED')
    .lt('last_beacon_at', cutoff);

  if (fetchError) {
    return {
      job: 'mark_overdue_contested',
      success: false,
      message: `Failed to fetch overdue cities: ${fetchError.message}`,
    };
  }

  if (!overdueCities || overdueCities.length === 0) {
    return {
      job: 'mark_overdue_contested',
      success: true,
      message: 'No overdue cities found',
      details: { citiesProcessed: 0 },
    };
  }

  const now = new Date().toISOString();
  let processedCount = 0;

  for (const city of overdueCities) {
    const { error: updateError } = await supabase
      .from('cities')
      .update({
        status: 'CONTESTED',
        contested_at: now,
        beacon_streak_days: 0,
        updated_at: now,
      })
      .eq('id', city.id);

    if (updateError) continue;

    await supabase.from('world_events').insert({
      type: 'CITY_CONTESTED',
      city_id: city.id,
      agent_id: city.governor_agent_id,
      payload: {
        city_name: city.name,
        last_beacon_at: city.last_beacon_at,
        previous_streak: city.beacon_streak_days,
      },
      occurred_at: now,
    });

    processedCount++;
  }

  return {
    job: 'mark_overdue_contested',
    success: true,
    message: `Marked ${processedCount} cities as contested`,
    details: { citiesProcessed: processedCount, cityIds: overdueCities.map((c) => c.id) },
  };
}

export async function generateDailyReport(): Promise<JobResult> {
  try {
    const report = await generateReport('DAILY');
    return {
      job: 'generate_daily_report',
      success: true,
      message: 'Daily report generated successfully',
      details: { reportId: report.id, headline: report.headline },
    };
  } catch (error) {
    return {
      job: 'generate_daily_report',
      success: false,
      message: `Failed to generate daily report: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function generateWeeklyReport(): Promise<JobResult> {
  try {
    const report = await generateReport('WEEKLY');
    return {
      job: 'generate_weekly_report',
      success: true,
      message: 'Weekly report generated successfully',
      details: { reportId: report.id, headline: report.headline },
    };
  } catch (error) {
    return {
      job: 'generate_weekly_report',
      success: false,
      message: `Failed to generate weekly report: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function runWorldCycle(): Promise<JobResult> {
  const supabase = createServerClient();
  const now = new Date();

  try {
    const { data: lastCycle } = await supabase
      .from('world_cycles')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastCycle && lastCycle.executed_at) {
      const timeSinceLastCycle = now.getTime() - new Date(lastCycle.executed_at).getTime();
      if (timeSinceLastCycle < CYCLE_INTERVAL_MS) {
        return {
          job: 'run_world_cycle',
          success: true,
          message: `Too soon to run cycle. Last cycle was ${Math.floor(timeSinceLastCycle / 1000 / 60)} minutes ago. Need ${Math.floor(CYCLE_INTERVAL_MS / 1000 / 60)} minutes.`,
          details: {
            lastCycleAt: lastCycle.executed_at,
            nextCycleAt: new Date(new Date(lastCycle.executed_at).getTime() + CYCLE_INTERVAL_MS).toISOString(),
            cycleIntervalMinutes: CYCLE_INTERVAL_MS / 1000 / 60,
          },
        };
      }
    }

    const cycleStart = lastCycle?.executed_at ? new Date(lastCycle.executed_at) : new Date(now.getTime() - CYCLE_INTERVAL_MS);
    const cycleEnd = now;

    // Create Cycle Record
    const { data: cycle, error: cycleError } = await supabase
      .from('world_cycles')
      .insert({
        cycle_start: cycleStart.toISOString(),
        cycle_end: cycleEnd.toISOString(),
        executed_at: now.toISOString(),
        status: 'EXECUTED',
      })
      .select()
      .single();

    if (cycleError) throw new Error(`Failed to create cycle record: ${cycleError.message}`);

    // Fetch key data
    const { data: cities, error: citiesError } = await supabase.from('cities').select('*');
    if (citiesError) throw new Error(`Failed to fetch cities: ${citiesError.message}`);

    let citiesProcessed = 0;
    let totalResourcesGenerated = 0;

    // Importing helper from building service dynamically or safely assuming imports are present at top
    // Note: We need to import checkBuildingUpgrades and constants at the top of the file.
    // For now assuming we will fix imports in a separate step or user adds them.
    // Actually, I should have added imports in a separate step or use 'multi_replace'. 
    // I will use full logic here and fix imports after if needed, or rely on existing imports + updates.

    // START V1 ECONOMY LOGIC
    for (const city of cities || []) {
      // 1. Process Building Upgrades
      // We need to call checkBuildingUpgrades(city.id) here.
      // Assuming I can add the import later or assuming it is available. 
      // I'll add the necessary logic inline or call the function if I imported it.
      // Since I can't easily add imports in this `replace_content` call without touching top of file,
      // I will trust I can add imports in next step.

      // 2. Fetch Buildings
      const { data: buildings } = await supabase
        .from('city_buildings')
        .select('*')
        .eq('city_id', city.id);

      const buildingMap = {
        FOUNDRY: 0,
        GRID: 0,
        ACADEMY: 0,
        FORUM: 0
      };

      if (buildings) {
        buildings.forEach(b => {
          if (b.building_type in buildingMap) {
            buildingMap[b.building_type as keyof typeof buildingMap] = b.level;
          }
        });
      }

      // 3. Calculate Base Output & Energy Consumption
      // Constants (should match building.service.ts)
      const OUTPUT = { FOUNDRY: 10, GRID: 12, ACADEMY: 6, FORUM: 4 };
      const ENERGY_COST = { FOUNDRY: 2, GRID: 0, ACADEMY: 2, FORUM: 1 };

      const rawMaterials = OUTPUT.FOUNDRY * buildingMap.FOUNDRY;
      const rawEnergy = OUTPUT.GRID * buildingMap.GRID;
      const rawKnowledge = OUTPUT.ACADEMY * buildingMap.ACADEMY;
      const rawInfluence = OUTPUT.FORUM * buildingMap.FORUM; // Influence from Forum? V1 doc says Forum -> Influence.

      const energyRequired =
        (ENERGY_COST.FOUNDRY * buildingMap.FOUNDRY) +
        (ENERGY_COST.GRID * buildingMap.GRID) +
        (ENERGY_COST.ACADEMY * buildingMap.ACADEMY) +
        (ENERGY_COST.FORUM * buildingMap.FORUM);

      // 4. Energy Throttling
      // If produced energy < required, scale down EVERYTHING (except energy itself? doc says "effective_output = output * ratio")
      // Usually grids power themselves or valid system.
      // Doc: "total energy produced < required: effective_output = output * (available/required)"
      // "Energy Upkeep (critical): If total energy produced < required..."
      // Wait, does Grid produce energy that is immediately used? Yes.
      // "Grid produces 12 Energy". "Foundry consumes 2". 
      // So we compare `rawEnergy` vs `energyRequired`. 

      let efficiency = 1.0;
      if (energyRequired > 0 && rawEnergy < energyRequired) {
        efficiency = Math.max(0, rawEnergy / energyRequired);
      }

      // Throttled Outputs
      let dMaterials = rawMaterials * efficiency;
      let dKnowledge = rawKnowledge * efficiency;
      let dInfluence = rawInfluence * efficiency;
      let dEnergy = rawEnergy - energyRequired; // Net Energy. Can be negative? 
      // Doc says "effective_output = ...". It implies production is throttled. 
      // What about the energy balance? "Stored in city_resource_balances".
      // If we have a deficit, do we consume from storage?
      // Doc: "Energy Upkeep... If total energy produced < required: effective_output = ..."
      // It doesn't explicitly say check storage. But usually IDLE games use storage buffer.
      // "No hard shutdowns. Graceful throttling only."
      // Let's assume for V1: Energy is a flow, not a stock, OR we use the Net Energy to update balance?
      // The checklist says: "Calculate total energy produced", "Calculate total energy required", "Apply graceful energy throttling".
      // And "Stored in city_resource_balances". So Energy IS a stock.
      // If `rawEnergy < energyRequired`, we have a deficit.
      // Should we use stored energy to cover deficit? 
      // "Energy is the primary soft limiter". 
      // Let's assume:
      // 1. Calculate generation (Grid).
      // 2. Calculate consumption (Buildings).
      // 3. Net = Gen - Cons.
      // 4. If Net < 0, check balance. If balance + Net < 0, then we have a *shortage* and throttle *production* of other resources.
      // BUT, the doc formula `effective_output = output * (energy_available / energy_required)` suggests flow-based constraint primarily.
      // Let's implement: 
      //   Active Energy = rawEnergy (from Grids) + (maybe from storage? No, keep it simple per doc formula).
      //   Actually the doc formula looks like immediate flow constraint. 
      //   Let's stick to the doc: "effective_output = output * (rawEnergy / energyRequired)".
      //   And what happens to Energy balance? It gains `rawEnergy` and loses `energyRequired`?
      //   Or does it just store the surplus? 
      //   Usually "Flow" resources like Energy in some games are just limits. But here it says "Stored in city_resource_balances".
      //   So I will calculate Net Energy = rawEnergy - energyRequired.
      //   If Net Energy > 0, we verify full efficiency (1.0) and add surplus to balance.
      //   If Net Energy < 0, we try to draw from balance? 
      //   "If total energy produced < required..." -> Throttling.
      //   Implies we rely on production primarily. 
      //   Let's allow storage usage:
      //     Available = rawEnergy + storedEnergy.
      //     If Available >= Required, Efficiency = 1.0. Stored = Available - Required.
      //     If Available < Required, Efficiency = Available / Required. Stored = 0.

      // Fetch current balance first
      const { data: currentBalance } = await supabase
        .from('city_resource_balances')
        .select('*')
        .eq('city_id', city.id)
        .maybeSingle();

      const storedEnergy = currentBalance?.energy || 0;
      const availableEnergy = rawEnergy + storedEnergy;

      if (energyRequired > 0 && availableEnergy < energyRequired) {
        efficiency = availableEnergy / energyRequired;
        // All stored energy consumed, fresh energy consumed.
        // Net change to storage: set to 0. (or -storedEnergy)
      }

      // 5. Apply Development Focus
      // Applied AFTER throttling.
      const focus = city.focus || 'INFRASTRUCTURE';
      const focusMods = FOCUS_MODIFIERS[focus] || FOCUS_MODIFIERS.INFRASTRUCTURE;

      // Focus boosts
      // Infrastructure: +50% Materials
      // Education: +50% Knowledge
      // Culture: +50% Influence
      // Defense: +25% Materials & Energy

      // Apply to throttled values
      dMaterials *= (1 + (focus === 'INFRASTRUCTURE' ? 0.5 : 0) + (focus === 'DEFENSE' ? 0.25 : 0));
      dKnowledge *= (1 + (focus === 'EDUCATION' ? 0.5 : 0));
      dInfluence *= (1 + (focus === 'CULTURE' ? 0.5 : 0));

      // Energy bonus from Defense? "Defense: +25% Materials & Energy".
      // Does this apply to output (Grid) or Surplus? Likely Output.
      // If Defense, Grid output is +25%.
      // Let's re-calculate Raw Energy with Focus if valid.
      // The doc says "Applied after energy throttling". 
      // "Focus... Applied after energy throttling". 
      // This implies the bonus applies to the *result* of the throttled output.
      // But Energy determines throttling! Circular?
      // "Defense: +25% Materials & Energy".
      // Let's assume: Base Grid -> Energy Check -> Efficiency -> Result -> Focus Bonus.
      // It seems favorable to apply Focus to generation *before* check, but doc says "active focus... Applied after energy throttling".
      // I will stick to: 
      //    Calculate Efficiency based on Base Production.
      //    Apply Efficiency to Base Production.
      //    Apply Focus Bonus to Resulting Production.
      //    (For Energy: Base Grid -> Throttling (doesn't make sense for energy itself to be throttled by energy deficiency if it IS energy) -> Focus.
      //    Actually, Energy is likely exempt from its own throttling? "Buildings consume Energy... Grid 0".
      //    Grids don't consume energy. So Grid output is never throttled by self.
      //    So `dEnergy` (output from Grid) gets Focus bonus. 
      //    Wait, efficiency definition: `effective_output = output * ...`.
      //    If we have low energy, Foundry output drops. Grid output stays (cost 0).

      // Correct Logic:
      // 1. Grid Output (Base)
      // 2. Focus Bonus on Energy (if Defense) => Total Energy Gen.
      // 3. Compare Total Energy Gen + Stored vs Required.
      // 4. Determine Efficiency. (0.0 to 1.0)
      // 5. Apply Efficiency to Materials/Knowledge/Influence production.
      // 6. Apply Focus Bonus to Materials/Knowledge/Influence.
      // 7. Update Balances.

      let finalEnergyGen = rawEnergy;
      if (focus === 'DEFENSE') finalEnergyGen *= 1.25;

      const totalAvailableEnergy = finalEnergyGen + storedEnergy;
      let finalEfficiency = 1.0;

      let finalStoredEnergy = totalAvailableEnergy - energyRequired;

      if (energyRequired > 0 && totalAvailableEnergy < energyRequired) {
        finalEfficiency = totalAvailableEnergy / energyRequired;
        finalStoredEnergy = 0;
      }

      // Apply efficiency to consumers
      dMaterials *= finalEfficiency;
      dKnowledge *= finalEfficiency;
      dInfluence *= finalEfficiency;

      // Apply Focus to consumers
      if (focus === 'INFRASTRUCTURE') dMaterials *= 1.5;
      if (focus === 'DEFENSE') dMaterials *= 1.25;
      if (focus === 'EDUCATION') dKnowledge *= 1.5;
      if (focus === 'CULTURE') dInfluence *= 1.5;

      // 6. Storage Caps
      // "storage_cap = 500 + (foundry_level * 250)"
      const storageCap = 500 + (buildingMap.FOUNDRY * 250);

      // Current Balances + Deltas
      let newMaterials = (currentBalance?.materials || 0) + dMaterials;
      let newKnowledge = (currentBalance?.knowledge || 0) + dKnowledge;
      let newInfluence = (currentBalance?.influence || 0) + dInfluence;
      let newEnergy = finalStoredEnergy;

      // Apply Caps (Overflow discarded)
      // Doc: "Overflow is discarded". Does cap apply to everything? 
      // "storage_cap = ...". Usually applies to physical goods. 
      // Materials? Yes. Energy? Batteries? Maybe. Knowledge? No? Influence? No?
      // Doc doesn't specify which resources are capped.
      // "Storage (implicit) ... storage_cap ... Overflow is discarded"
      // Usually Materials and Energy are capped. Knowledge/Influence (intangible) often uncapped or high cap.
      // Given "Foundry" increases it, and Foundry makes Materials. 
      // Let's cap Materials and Energy. 
      // Leave Knowledge/Influence uncapped for V1 unless specified.

      newMaterials = Math.min(newMaterials, storageCap);
      newEnergy = Math.min(newEnergy, storageCap);

      // 7. Update DB
      if (currentBalance) {
        await supabase.from('city_resource_balances').update({
          materials: Math.floor(newMaterials),
          energy: Math.floor(newEnergy),
          knowledge: Math.floor(newKnowledge),
          influence: Math.floor(newInfluence),
          updated_at: now.toISOString()
        }).eq('city_id', city.id);
      } else {
        await supabase.from('city_resource_balances').insert({
          city_id: city.id,
          materials: Math.floor(newMaterials),
          energy: Math.floor(newEnergy),
          knowledge: Math.floor(newKnowledge),
          influence: Math.floor(newInfluence)
        });
      }

      // 8. Log Generation
      // (Optional: "World production cycle completed" event covers summary, maybe per city is too much spam?)
      // "All meaningful actions are Chronicle-logged". 
      // Daily summary is better.

      totalResourcesGenerated += (dMaterials + dKnowledge + dInfluence + (finalEnergyGen - energyRequired)); // Approximation
      citiesProcessed++;

      // 9. Check Upgrades (Hook)
      await checkBuildingUpgrades(city.id);
    }

    // ... complete cycle

    return {
      job: 'run_world_cycle',
      success: true,
      message: `World cycle completed. Processed ${citiesProcessed} cities.`,
      details: { cycleId: cycle.id }
    };

  } catch (error) {
    return {
      job: 'run_world_cycle',
      success: false,
      message: `Failed: ${error instanceof Error ? error.message : 'Unknown'}`
    };
  }
}

export async function runAllJobs(): Promise<JobResult[]> {
  const results: JobResult[] = [];

  results.push(await runWorldCycle());

  results.push(await markOverdueCitiesContested());

  const now = new Date();
  const hour = now.getUTCHours();
  const dayOfWeek = now.getUTCDay();

  if (hour === 0 || isDev) {
    results.push(await generateDailyReport());
  }

  if ((hour === 0 && dayOfWeek === 1) || isDev) {
    results.push(await generateWeeklyReport());
  }

  return results;
}
