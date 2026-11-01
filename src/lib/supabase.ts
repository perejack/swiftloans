import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://clrfuyyxptssekmvbkvl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNscmZ1eXl4cHRzc2VrbXZia3ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0ODMwNDAsImV4cCI6MjEwOTA1OTA0MH0.1XVjn-U1ic3WAlLeI3o28D929JLTYNKWt8wBFdx9LGg';

export const supabase = createClient(supabaseUrl, supabaseKey);
