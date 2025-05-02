/**
 * Extracts all URLs and specific IDs from URLs (like Imgur) from a given text string
 * @param text The input text to search for URLs
 * @returns Object containing arrays of found URLs and extracted IDs
 */
export function extractLinks(text) {
  const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/gi;
  const urlMatches = text.match(urlRegex) || [];

  // Extract Imgur IDs (format: https://i.imgur.com/ID.gifv)
  const imgurIdRegex = /https?:\/\/i\.imgur\.com\/([a-zA-Z0-9]+)(?:\..+)?/gi;
  const imgurMatches = [...text.matchAll(imgurIdRegex)];
  const imgurIds = imgurMatches.map((match) => match[1]);

  return {
    urls: urlMatches,
    ids: imgurIds
  };
}

/**
 * Fetches top posts from a subreddit
 * @param {string} name - Subreddit name
 * @param {number} [limit=15] - Number of posts to fetch
 * @returns {Promise<Array>} Array of post objects
 */
export async function getSubredditPosts(name, limit = 15) {
  if (!name) {
    throw new Error('Subreddit name parameter "name" is required');
  }

  const redditUrl = `https://www.reddit.com/r/${encodeURIComponent(
    name
  )}/top.json?limit=${limit}&t=month`;

  try {
    const response = await fetch(redditUrl, {
      headers: {
        "User-Agent": "NextJS Subreddit Explorer v0.1 by YourUsername"
      }
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "Failed to fetch from Reddit API");
      throw new Error(`Reddit API Error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    return data.data.children
      .filter((child) => child.kind === "t3")
      .map((child) => child.data);
  } catch (error) {
    console.error("Network or parsing error fetching posts:", error);
    throw new Error(`Failed to fetch posts: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Searches for related subreddits
 * @param {string} query - Search query
 * @param {number} [limit=10] - Number of results to return
 * @returns {Promise<Array>} Array of subreddit objects
 */
export async function searchRelatedSubreddits(query, limit = 10) {
  if (!query) {
    throw new Error('Query parameter "q" is required');
  }

  const redditUrl = `https://www.reddit.com/subreddits/search.json?q=${encodeURIComponent(
    query
  )}&limit=${limit}&include_over_18=on`;

  try {
    const response = await fetch(redditUrl, {
      headers: {
        "User-Agent": "NextJS Subreddit Explorer v0.1 by YourUsername"
      }
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "Failed to fetch from Reddit API");
      throw new Error(`Reddit API Error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    return data.data.children
      .filter((child) => child.kind === "t5")
      .map((child) => ({
        id: child.data.display_name.toLowerCase(),
        name: child.data.display_name,
        subscribers: child.data.subscribers,
        icon: child.data.icon_img
      }));
  } catch (error) {
    console.error("Network or parsing error:", error);
    throw new Error(`Failed to search subreddits: ${error instanceof Error ? error.message : String(error)}`);
  }
}
