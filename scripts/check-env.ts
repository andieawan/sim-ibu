for (const [key, val] of Object.entries(process.env)) {
  if (key.includes('GOOGLE') || key.includes('FIREBASE') || key.includes('GCP') || key.includes('API') || key.includes('KEY') || key.includes('CREDENTIALS')) {
    console.log(`${key}: ${val ? (val.length > 10 ? val.substring(0, 10) + '...' : val) : 'empty'}`);
  }
}
