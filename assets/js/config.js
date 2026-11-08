// Public browser configuration only. Never put a Supabase service_role/secret key here.
window.ISAIDON_SUPABASE_URL = "https://ussrtmkwasnajfphykby.supabase.co";
window.ISAIDON_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzc3J0bWt3YXNuYWpmcGh5a2J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQxMzM2MDEsImV4cCI6MjEwOTcwOTYwMX0.OSMQUulZIHkm8T1sVlNmK5K5IyKDGzCV9WUY1nxLXUM";

window.createIaidonSupabaseClient = function () {
  if (!window.supabase || !window.ISAIDON_SUPABASE_URL ||
      !window.ISAIDON_SUPABASE_ANON_KEY ||
      window.ISAIDON_SUPABASE_ANON_KEY.includes("PASTE_YOUR")) {
    throw new Error("Set your Supabase publishable/anon key in assets/js/config.js first.");
  }
  return window.supabase.createClient(
    window.ISAIDON_SUPABASE_URL,
    window.ISAIDON_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
};
