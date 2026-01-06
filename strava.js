// Strava API Configuration
const STRAVA_CLIENT_ID = '186960'; 
const STRAVA_CLIENT_SECRET = '4d4e2f2f8bad530d071e0dcb2530e84202550400'; 
const STRAVA_REDIRECT_URI = 'https://jacktoohey17.github.io/debt-walk.github.io/'; 
const ATHELETE_ID = 162881641;
const STARTING_MILES = 364;

/**
 * Get the OAuth authorization URL for Strava
 * @returns {string} Authorization URL
 */
function getStravaAuthUrl() {
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    redirect_uri: STRAVA_REDIRECT_URI,
    response_type: 'code',
    scope: 'activity:read_all',
    approval_prompt: 'force'
  });
  return `https://www.strava.com/oauth/authorize?${params}`;
}

/**
 * Exchange authorization code for access token
 * @param {string} code - Authorization code from Strava OAuth callback
 * @returns {Promise<Object>} Token response with access_token and refresh_token
 */
async function getAccessToken(code) {
  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

/**
 * Fetch all activities for an athlete with the name "Debt Walk"
 * @param {string} accessToken - Strava API access token
 * @returns {Promise<Array>} Array of activities with name "Debt Walk"
 */
async function fetchDebtWalkActivities(accessToken) {
  try {
    const activities = [];
    let page = 1;
    const perPage = 200; // Strava max per page
    let hasMore = true;

    while (hasMore) {
        const url = ATHELETE_ID
        ? `https://www.strava.com/api/v3/athletes/${ATHELETE_ID}/activities?per_page=${perPage}&page=${page}`
        : `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&page=${page}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.length === 0) {
        hasMore = false;
      } else {
        // Filter for "Debt Walk" activities
        const debtWalks = data.filter(activity => activity.name === 'Debt Walk');
        activities.push(...debtWalks);
        page++;
      }
    }

    return activities;
  } catch (error) {
    console.error('Error fetching Debt Walk activities:', error);
    throw error;
  }
}

/**
 * Calculate total distance and stats from Debt Walk activities
 * @param {Array} activities - Array of Debt Walk activities
 * @returns {Object} Stats object with total distance, count, and activity list
 */
function calculateDebtWalkStats(activities) {
  const totalDistance = activities.reduce((sum, activity) => {
    // Strava returns distance in meters, convert to miles
    return sum + (activity.distance / 1609.34);
  }, 0);

  return {
    totalDistance: totalDistance.toFixed(2),
    remainingMiles: (STARTING_MILES - totalDistance),
    activityCount: activities.length,
    activities: activities.map(activity => ({
      name: activity.name,
      date: activity.start_date,
      distance: (activity.distance / 1609.34).toFixed(2),
      movingTime: activity.moving_time,
      elevationGain: (activity.total_elevation_gain || 0).toFixed(2),
      id: activity.id
    }))
  };
}

/**
 * Main function to orchestrate Strava API workflow
 * @param {string} accessToken - Strava API access token
 * @returns {Promise<Object>} Stats and activities
 */
async function getDebtWalkStats(accessToken) {
  try {
    const activities = await fetchDebtWalkActivities(accessToken);
    const stats = calculateDebtWalkStats(activities);
    return stats;
  } catch (error) {
    console.error('Error getting Debt Walk stats:', error);
    throw error;
  }
}

// Export for use in other modules (if using ES6 modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getStravaAuthUrl,
    getAccessToken,
    fetchDebtWalkActivities,
    calculateDebtWalkStats,
    getDebtWalkStats
  };
}
