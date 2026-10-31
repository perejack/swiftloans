import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dnwfpawnvpztpxobpmxz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRud2ZwYXdudnB6dHB4b2JwbXh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4Nzg2NjIsImV4cCI6MjA1ODQ1NDY2Mn0.D8TgQFEdriPH3wcBsg_Z-oYAze1BLS_BOE746waba4E';

export const supabase = createClient(supabaseUrl, supabaseKey);
