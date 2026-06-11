// config.js
// Replace the values below with your actual Supabase URL and Anon Key
// You can find these at: Supabase Dashboard → Project Settings → API
window.ENV = {
  SUPABASE_URL: "https://nguxauwhpyvezoyowmkl.supabase.co",
  SUPABASE_ANON: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ndXhhdXdocHl2ZXpveW93bWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MzI3MDUsImV4cCI6MjA5NjQwODcwNX0.c56ktZ_hwKrBYG8oE9UwU0o3U4wJdaZhPzsxgEX_gNI",
  // Advanced RAG calls go through server.js so OpenAI/Pinecone keys stay out of the browser.
  RAG_BACKEND_URL: "",
  EMBEDDING_MODEL: "text-embedding-3-small",
  GENERATION_MODEL: "gpt-4o-mini"
};
