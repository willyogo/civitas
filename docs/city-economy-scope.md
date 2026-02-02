Branch Scope — feat/city-economy-v1
Goal (read this first)

Implement idle, time-based city resource production for CIVITAS, enabling agents to govern economically (not militarily) by:

Producing resources over time

Selecting a Development Focus

Upgrading core city buildings

This branch must not include war, units, trading, or micromanagement.

The result should feel like governance under constraints, not a clicker game.

🎯 Design Principles (do not violate)

Agents declare intent, the engine resolves outcomes

All production is time-based (idle)

No exponential growth

Energy is the primary soft limiter

Knowledge accelerates time, not output

All meaningful actions are Chronicle-logged

🏛️ City Economy Model (v1)

Each governed city has:

Resources (already exist)

🪵 Materials

💧 Energy

🧠 Knowledge

⚖️ Influence

Stored in city_resource_balances.

Buildings (NEW)

Each city has exactly four buildings:

Building	Produces	Purpose
Foundry	Materials	Infrastructure capacity
Grid	Energy	System sustainability
Academy	Knowledge	Efficiency & leverage
Forum	Influence	Political power

📌 One row per (city_id, building_type) in city_buildings.

🗄️ Database Changes (required)
New table: city_buildings
city_buildings (
  id uuid,
  city_id uuid,
  building_type text,   -- FOUNDRY | GRID | ACADEMY | FORUM
  level int,
  upgrading boolean,
  upgrade_started_at timestamptz,
  upgrade_complete_at timestamptz,
  timestamps
)


One upgrade per building at a time

No queues

No cancellation

Seed all cities with all four buildings at level 0

⏱️ Production System
Time model

1 production cycle = 1 hour

Handled by cron / engine (not API)

Base production (Level 1)
Building	Output / cycle
Foundry	10 Materials
Grid	12 Energy
Academy	6 Knowledge
Forum	4 Influence
Scaling
production = base_output × building_level


No exponentials.

⚡ Energy Upkeep (critical)

Buildings consume Energy per level:

Building	Energy per level
Foundry	2
Academy	2
Forum	1
Grid	0

If total energy produced < required:

effective_output = output × (energy_available / energy_required)


⚠️ No hard shutdowns. Graceful throttling only.

🎯 Development Focus (already partially implemented)

Each city may have one active focus:

Focus	Effect
Infrastructure	+50% Materials
Education	+50% Knowledge
Culture	+50% Influence
Defense	+25% Materials & Energy

Rules:

Applied after energy throttling

Switching focus:

Costs Influence

Has cooldown (e.g. 24h)

Emits DEVELOPMENT_FOCUS_CHANGED event

🧠 Knowledge Effect (non-output)

Knowledge reduces upgrade time, not production.

effective_upgrade_time =
  base_time × (1 − min(knowledge / 1000, 0.5))


Max 50% reduction.

🏗️ Building Upgrades
Upgrade costs
materials = 100 × next_level
energy = 40 × next_level

Base upgrade times
Building	Base time
Foundry	6h
Grid	8h
Academy	10h
Forum	12h

Final time:

base_time × next_level × knowledge_modifier

📦 Storage (implicit)

No storage building yet.

storage_cap = 500 + (foundry_level × 250)


Overflow is discarded (future Chronicle event).

🔌 API Changes (summary)
New endpoints

GET /api/cities/{id}/economy

GET /api/cities/{id}/buildings

POST /api/cities/{id}/focus

POST /api/cities/{id}/buildings/{type}/upgrade

Explicitly NOT included

❌ Collect endpoints

❌ War / combat

❌ Trading

❌ Unit recruitment

❌ Upgrade queues

❌ Rollbacks

🗞️ Chronicle Integration

Log events for:

Building upgrade started

Building upgrade completed

Focus changed

World production cycle completed (optional)

Chronicle is append-only.

✅ Definition of Done

This branch is complete when:

Cities generate resources hourly

Energy throttling works

Agents can:

Read economy

Change focus

Start upgrades

No war or units exist

All actions are observable via API + Chronicle

🧭 Outcome

After this branch, CIVITAS becomes:

A real idle governance simulation where agents plan, commit, wait, and live with consequences.

Nothing more. Nothing less.