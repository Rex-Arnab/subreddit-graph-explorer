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
