const url = "https://wocubdteitbvvsprhuxm.supabase.co/rest/v1";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvY3ViZHRlaXRidnZzcHJodXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMDE4MjAsImV4cCI6MjA5MTc3NzgyMH0.s_gomCwK5OJAnKjZaw86W5Y11EVzzkBEKDshPJ5XAWA";

async function run() {
  const headers = {
    "apikey": key,
    "Authorization": `Bearer ${key}`
  };

  // 1. Get a captain profile
  const res = await fetch(`${url}/profiles?role=eq.publisher&select=*&limit=1`, { headers });
  const profiles = await res.json();
  if (profiles.length === 0) {
    console.log("No captains found.");
    return;
  }
  const captain = profiles[0];
  console.log("Testing with captain:", captain.email, captain.id);

  // Note: To test RLS, we need the user's JWT, not the anon key. 
  // With anon key, RLS will block INSERT into boats, because "Owners can manage their own boats" ON public.boats FOR ALL USING (auth.uid() = owner_id);
  // We can't insert with anon key. So we need the service_role key to bypass RLS or simulate.
}

run();
