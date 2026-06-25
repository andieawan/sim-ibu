import { GoogleAuth } from 'google-auth-library';

async function main() {
  console.log('--- Environment ---');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
  
  try {
    const auth = new GoogleAuth();
    const projectId = await auth.getProjectId();
    console.log('Auth Project ID:', projectId);
    
    const client = await auth.getClient();
    console.log('Credential type:', client.constructor.name);
    
    // Test if we can get an access token
    const accessToken = await client.getAccessToken();
    console.log('Access token retrieved successfully:', !!accessToken.token);
  } catch (err: any) {
    console.error('Error checking service account:', err);
  }
}

main();
