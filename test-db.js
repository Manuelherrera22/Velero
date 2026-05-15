const url = "https://wocubdteitbvvsprhuxm.supabase.co/rest/v1/profiles?role=eq.affiliate&select=*"
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvY3ViZHRlaXRidnZzcHJodXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMDE4MjAsImV4cCI6MjA5MTc3NzgyMH0.s_gomCwK5OJAnKjZaw86W5Y11EVzzkBEKDshPJ5XAWA"

fetch(url, {
  headers: {
    "apikey": key,
    "Authorization": `Bearer ${key}`
  }
}).then(res => res.json()).then(data => console.log(JSON.stringify(data, null, 2)))
