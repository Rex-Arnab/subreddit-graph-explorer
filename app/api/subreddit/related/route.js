import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const limit = searchParams.get("limit") || "10";

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    );
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
      console.error("Reddit API Error:", response.status, response.statusText);
      let errorBody = "Failed to fetch from Reddit API";
      try {
        errorBody = await response.text();
      } catch { }
      return NextResponse.json(
        {
          error: `Reddit API Error: ${response.status} ${response.statusText}`,
          details: errorBody
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    const subreddits = data.data.children
      .filter((child) => child.kind === "t5")
      .map((child) => ({
        id: child.data.display_name.toLowerCase(),
        name: child.data.display_name,
        subscribers: child.data.subscribers,
        icon: child.data.icon_img
      }));

    return NextResponse.json(subreddits);
  } catch (error) {
    console.error("Network or parsing error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch or parse Reddit data",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
