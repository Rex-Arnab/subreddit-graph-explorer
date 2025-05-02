import { NextResponse } from "next/server";

// Basic Post structure (add more fields as needed)

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const subreddit = searchParams.get("name");
  const limit = searchParams.get("limit") || "15"; // Fetch more posts for sidebar

  if (!subreddit) {
    return NextResponse.json(
      { error: 'Subreddit name parameter "name" is required' },
      { status: 400 }
    );
  }

  // Fetch top posts (or hot, new, etc.)
  const redditUrl = `https://www.reddit.com/r/${encodeURIComponent(
    subreddit
  )}/top.json?limit=${limit}&t=month`; // e.g., top posts of the month

  try {
    const response = await fetch(redditUrl, {
      headers: {
        "User-Agent": "NextJS Subreddit Explorer v0.1 by YourUsername"
      }
      // next: { revalidate: 600 } // Revalidate every 10 minutes
    });

    if (!response.ok) {
      console.error("Reddit API Error:", response.status, response.statusText);
      // Try to get error message from Reddit if available
      const errorBody = await response.text().catch(() => "Failed to fetch from Reddit API");
      return NextResponse.json(
        {
          error: `Reddit API Error fetching posts: ${response.status} ${response.statusText}`,
          details: errorBody
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Basic filtering and mapping (add more fields if needed)
    const posts = data.data.children
      .filter((child) => child.kind === "t3")
      .map((child) => child.data);

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Network or parsing error fetching posts:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch or parse Reddit post data",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
