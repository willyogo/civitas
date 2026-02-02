
import 'dotenv/config';
import { getCityEconomy } from '../lib/services/cities';
import { createServerClient } from '../lib/supabase/client';

async function debugEconomy() {
    const cityId = '49e21b63-2c5d-4e04-81af-31417ae72933';
    console.log(`Debugging economy for city: ${cityId}`);

    try {
        const supabase = createServerClient();

        console.log('1. Testing Connection & Cities Table...');
        const { data: city, error: cityError } = await supabase
            .from('cities')
            .select('*')
            .eq('id', cityId)
            .single();

        if (cityError) console.error('City Error:', cityError);
        else console.log('City Found:', city?.name);

        console.log('2. Testing City Resource Balances...');
        const { data: balances, error: balanceError } = await supabase
            .from('city_resource_balances')
            .select('*')
            .eq('city_id', cityId)
            .maybeSingle();

        if (balanceError) console.error('Balance Error:', balanceError);
        else console.log('Balances:', balances);

        console.log('3. Testing City Buildings...');
        const { data: buildings, error: buildingError } = await supabase
            .from('city_buildings')
            .select('*')
            .eq('city_id', cityId);

        if (buildingError) console.error('Building Error:', buildingError);
        else console.log('Buildings Count:', buildings?.length);

        console.log('4. Calling getCityEconomy()...');
        const economy = await getCityEconomy(cityId);
        console.log('Economy Result:', JSON.stringify(economy, null, 2));

    } catch (err) {
        console.error('CRITICAL ERROR:', err);
    }
}

debugEconomy();
