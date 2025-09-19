// Simple script to fix Pornhub previews
// Run with: node scripts/fix-pornhub-previews.js

const fetch = require('node-fetch');

async function fixPornhubPreviews() {
  try {
    console.log('Calling fix-pornhub-previews endpoint...');
    
    const response = await fetch('http://localhost:3002/api/debug/fix-pornhub-previews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Note: This endpoint requires authentication
      // You might need to add session cookies here
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('Success:', result);
    } else {
      console.error('Error:', result);
    }
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

fixPornhubPreviews();