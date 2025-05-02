"use client";

import React, { useState, useEffect } from "react";
import { extractLinks } from "@/lib/utils";

const PostContent = ({ post }) => {
  const isImageUrl = /\.(jpg|jpeg|png|gif)$/i.test(post.url);
  if (
    post.post_hint === "image" ||
    (isImageUrl && !post.is_video && !post.media?.reddit_video)
  ) {
    return (
      <img
        src={post.url}
        alt={post.title}
        className="max-w-full h-auto my-2 rounded"
      />
    );
  }
  if (post.is_video && post.media?.reddit_video) {
    return (
      <video controls className="max-w-full my-2 rounded" preload="metadata">
        <source src={post.media.reddit_video.fallback_url} type="video/mp4" />
        Your browser does not support the video tag.
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline">
          View Video on Reddit
        </a>
      </video>
    );
  }
  if (post.post_hint === "rich:video" && post.secure_media_embed?.content) {
    console.log("post.secure_media_embed", post.secure_media_embed);
    const links = extractLinks(post.secure_media_embed.content);
    console.log("first link", links.urls[0]);
    if (post.secure_media_embed.media_domain_url) {
      const domainLinks = extractLinks(
        post.secure_media_embed.media_domain_url
      );
      return (
        <iframe
          src={domainLinks.urls[0]}
          width={post.secure_media_embed.width}
          height={post.secure_media_embed.height}
          className="my-2 aspect-video max-w-full"
          title={post.title}
          allowFullScreen
        />
      );
    }
    return (
      <div
        className="my-2 aspect-video max-w-full [&>iframe]:w-full [&>iframe]:h-full"
        dangerouslySetInnerHTML={{ __html: post.secure_media_embed.content }}
      />
    );
  }
  if (post.selftext) {
    const previewText =
      post.selftext.length > 300
        ? post.selftext.substring(0, 300) + "..."
        : post.selftext;
    return (
      <p className="text-sm text-gray-300 my-2 whitespace-pre-wrap">
        {previewText}
      </p>
    );
  }
  if (post.post_hint === "link" && !isImageUrl) {
    console.log("POST:", post);
    const { ids } = extractLinks(post.url);
    const id = ids.length > 0 ? ids[0] : "";
    if (post.url.startsWith("https://i.imgur.com")) {
      return (
        <blockquote
          className="imgur-embed-pub"
          lang="en"
          data-id={id}
          style={{ width: "100%" }}>
          <a href={post.url}>{post.title}</a>
        </blockquote>
      );
    }
    return (
      <a
        href={post.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:underline block my-2 truncate">
        {post.url}
      </a>
    );
  }

  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 hover:underline block my-2 truncate">
      View Post/Link
    </a>
  );
};

const Sidebar = ({ subredditName, onClose }) => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!subredditName) {
      setPosts([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const fetchPosts = async () => {
      setIsLoading(true);
      setError(null);
      setPosts([]);
      try {
        const response = await fetch(
          `/api/subreddit/posts?name=${encodeURIComponent(
            subredditName
          )}&limit=50`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Failed to fetch posts (${response.status})`
          );
        }
        const data = await response.json();
        setPosts(data);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [subredditName]);

  if (!subredditName) {
    return null;
  }

  return (
    <div className="fixed top-0 right-0 w-full md:w-1/3 lg:w-1/4 h-full bg-gray-800 shadow-lg z-20 overflow-y-auto p-4 transform transition-transform translate-x-0 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">r/{subredditName}</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-2xl"
          aria-label="Close sidebar">
          ×
        </button>
      </div>

      {isLoading && <p className="text-gray-400">Loading posts...</p>}
      {error && <p className="text-red-400">Error: {error}</p>}

      {!isLoading && !error && posts.length === 0 && (
        <p className="text-gray-400">
          No posts found for this subreddit (or API error).
        </p>
      )}

      <div className="space-y-4 flex-grow">
        {posts.map((post) => (
          <div key={post.id} className="bg-gray-700 p-3 rounded-lg shadow">
            <h3 className="text-md font-medium text-white mb-1">
              {post.title}
            </h3>
            <div className="text-xs text-gray-400 mb-2">
              <span>u/{post.author}</span> | <span>{post.score} points</span> |
              <a
                href={`${"https://www.reddit.com"}${post.permalink}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 hover:underline">
                View on Reddit
              </a>
            </div>
            <PostContent post={post} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
