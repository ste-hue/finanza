import { createClient } from '@supabase/supabase-js'

// 🌍 Global Supabase client - SINGLE INSTANCE to prevent Multiple GoTrueClient warnings
const supabaseUrl = 'https://udeavsfewakatewsphfw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZWF2c2Zld2FrYXRld3NwaGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTU2MzIsImV4cCI6MjA2OTI3MTYzMn0.7JuPSYEG-UoxvmYecVUgjWIAJ0PQYHeN2wiTnYp2NjY'

// ✨ Single shared client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Export default for convenience
export default supabase