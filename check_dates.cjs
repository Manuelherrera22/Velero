const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

import('@supabase/supabase-js').then(async ({ createClient }) => {
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  
  const { data, error } = await supabase.from('trip_dates').select('*').eq('trip_id', 'c4ef7c89-e389-47fa-9931-3054c716b2bb');
  if (error) { console.error(error); process.exit(1); }
  
  console.log('Found', data.length, 'dates for this trip:', data);
  
  // Also get all trips to see if this trip has any dates at all
  const { data: allDates } = await supabase.from('trip_dates').select('*');
  console.log('Total dates in DB:', allDates.length);
});
