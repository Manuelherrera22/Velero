const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

import('@supabase/supabase-js').then(async ({ createClient }) => {
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  
  const { data, error } = await supabase.from('trip_dates').select('*');
  if (error) { console.error(error); process.exit(1); }
  
  console.log('Found', data.length, 'dates');
  for (const row of data) {
    const oldDate = new Date(row.date);
    const newDate = new Date(oldDate.getTime() + 60 * 24 * 60 * 60 * 1000); // add 60 days
    const dateStr = newDate.toISOString().split('T')[0];
    
    const { error: updateError } = await supabase.from('trip_dates').update({ date: dateStr }).eq('id', row.id);
    if (updateError) {
      console.error('Failed to update', row.id, updateError);
    } else {
      console.log('Updated', row.id, 'from', row.date, 'to', dateStr);
    }
  }
});
