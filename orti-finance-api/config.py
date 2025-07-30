import os
from dotenv import load_dotenv

# Carica le variabili d'ambiente
load_dotenv()

# Configurazione Supabase CLOUD (funzionante)
SUPABASE_URL = "https://udeavsfewakatewsphfw.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZWF2c2Zld2FrYXRld3NwaGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTU2MzIsImV4cCI6MjA2OTI3MTYzMn0.7JuPSYEG-UoxvmYecVUgjWIAJ0PQYHeN2wiTnYp2NjY"

# Database PostgreSQL connection CLOUD
DATABASE_URL = "postgresql://postgres:[YOUR-PASSWORD]@db.udeavsfewakatewsphfw.supabase.co:5432/postgres" 