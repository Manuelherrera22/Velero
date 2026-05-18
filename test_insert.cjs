const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

import('@supabase/supabase-js').then(async ({ createClient }) => {
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  
  console.log('Attempting to query trips...');
  const { data, error } = await supabase.from('trips').select('id').limit(1);
  if (error) console.error('Query Error:', error);
  else console.log('Query Success:', data);
  
  console.log('Attempting to insert a dummy trip...');
  const { data: insertData, error: insertError } = await supabase.from('trips').insert({
    title: 'Dummy Test',
    captain_id: 'c4ef7c89-e389-47fa-9931-3054c716b2bb', // Fake UUID
    status: 'draft'
  }).select();
  
  if (insertError) console.error('Insert Error:', insertError);
  else console.log('Insert Success:', insertData);
  
  process.exit(0);
});
