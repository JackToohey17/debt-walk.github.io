/**
 * Test script to authenticate with Strava API and retrieve authorized user's name
 */

// Import configuration from strava.js
// Note: In a real Node.js environment, you'd use: const { getAccessToken } = require('./strava.js');
// For browser environment, strava.js must be loaded first via <script> tag

/**
 * Authenticate with Strava and return the authorized athlete's name
 * @param {string} authorizationCode - The authorization code from Strava OAuth callback
 * @returns {Promise<Object>} Object containing access token and athlete info
 */
async function authenticateAndGetUserName(authorizationCode) {
  try {
    console.log('Exchanging authorization code for access token...');
    
    // Step 1: Exchange authorization code for access token
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code: authorizationCode,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    console.log('Access token obtained successfully');

    // Step 2: Fetch authenticated athlete profile
    console.log('Fetching athlete profile...');
    
    const athleteResponse = await fetch('https://www.strava.com/api/v3/athlete', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!athleteResponse.ok) {
      throw new Error(`Failed to fetch athlete profile: ${athleteResponse.statusText}`);
    }

    const athleteData = await athleteResponse.json();
    
    const athleteName = `${athleteData.firstname} ${athleteData.lastname}`;
    
    console.log('✓ Authentication successful!');
    console.log(`Authenticated user: ${athleteName}`);
    console.log(`Athlete ID: ${athleteData.id}`);
    console.log(`City: ${athleteData.city}, State: ${athleteData.state}`);

    // Return both token and athlete info
    return {
      success: true,
      accessToken: accessToken,
      refreshToken: tokenData.refresh_token,
      athlete: {
        id: athleteData.id,
        firstname: athleteData.firstname,
        lastname: athleteData.lastname,
        name: athleteName,
        city: athleteData.city,
        state: athleteData.state,
        profile_medium: athleteData.profile_medium,
        profile: athleteData.profile
      }
    };
  } catch (error) {
    console.error('Authentication failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Parse the authorization code from the current URL
 * (Useful when redirected back from Strava OAuth)
 * @returns {string|null} Authorization code if present, null otherwise
 */
function getAuthorizationCodeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('code');
}

/**
 * Initialize authentication flow
 * If authorization code exists in URL, authenticate immediately
 */
async function initializeAuth() {
  const code = getAuthorizationCodeFromUrl();
  
  if (code) {
    console.log('Authorization code found in URL, authenticating...');
    const result = await authenticateAndGetUserName(code);
    
    if (result.success) {
      // Store the access token and athlete info in localStorage
      localStorage.setItem('stravaAccessToken', result.accessToken);
      localStorage.setItem('stravaRefreshToken', result.refreshToken);
      localStorage.setItem('stravaAthlete', JSON.stringify(result.athlete));
      
      console.log('Credentials stored in localStorage');
      
      // Optional: Redirect to main page after successful auth
      // window.location.href = 'index.html';
    }
    
    return result;
  } else {
    console.log('No authorization code found. Redirect user to:', getStravaAuthUrl());
  }
}

// Export functions for use in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    authenticateAndGetUserName,
    getAuthorizationCodeFromUrl,
    initializeAuth
  };
}

// Auto-initialize if this is a callback page
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', initializeAuth);
}
