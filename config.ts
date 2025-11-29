
export const SUPABASE_URL = 'https://bacpduvlvymxvcdmtsvr.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhY3BkdXZsdnlteHZjZG10c3ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODUwOTksImV4cCI6MjA3OTE2MTA5OX0.2t6S_dIexSjGpRaSFE1DkuazsIhF8dk57l8fVdZZgJk';

// Storage Configuration
// Options: 'supabase' | 'aws'
export const STORAGE_PROVIDER = 'aws'; 

// AWS Configuration
export const AWS_CONFIG = {
    // Asegúrate de que este nombre coincida EXACTAMENTE con el que creaste en AWS S3
    BUCKET_NAME: 'pets-app-imagenes-tony-prod', 
    REGION: 'us-east-1',
    
    // He pre-calculado esta URL basándome en tu SUPABASE_URL.
    // Solo funcionará una vez que despliegues la función en Supabase.
    SIGNING_ENDPOINT: 'https://bacpduvlvymxvcdmtsvr.supabase.co/functions/v1/sign-s3-upload' 
};
