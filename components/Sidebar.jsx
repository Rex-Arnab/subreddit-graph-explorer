"use client";

import React, { useState, useEffect, useRef } from "react";
import { extractLinks, getSubredditPosts } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import Hls from "hls.js";

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
    const videoRef = useRef(null);
    const [useHls, setUseHls] = useState(false);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      if (Hls.isSupported() && post.media.reddit_video.hls_url) {
        const hls = new Hls();
        hls.loadSource(post.media.reddit_video.hls_url);
        hls.attachMedia(video);
        setUseHls(true);

        return () => {
          hls.destroy();
        };
      }
    }, [post.media.reddit_video.hls_url]);

    return (
      <div className="relative">
        <video
          ref={videoRef}
          controls
          className="max-w-full my-2 rounded"
          preload="metadata">
          {!useHls && (
            <source
              src={post.media.reddit_video.fallback_url}
              type="video/mp4"
            />
          )}
          Your browser does not support the video tag.
        </video>
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline text-sm block mt-1">
          View Video on Reddit
        </a>
      </div>
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
    return (
      <div className="text-sm text-gray-300 my-2 markdown-content">
        <ReactMarkdown>{post.selftext}</ReactMarkdown>
      </div>
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

const Sidebar = ({ subredditName, onClose, allowNsfw = false }) => {
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
        const data = await getSubredditPosts(subredditName, 50, allowNsfw);
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
    <div className="fixed inset-0 sm:left-auto sm:right-0 w-full sm:w-96 h-full bg-gray-800 shadow-xl z-20 overflow-y-auto transform transition-transform duration-300 ease-in-out flex flex-col">
      <div className="sticky top-0 z-10 bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">
            r/{subredditName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
            aria-label="Close sidebar">
            ×
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-400">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading posts...
          </div>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-900/20 rounded-lg text-red-400">
          Error: {error}
        </div>
      )}

      {!isLoading && !error && posts.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-center">
            No posts found for this subreddit
          </p>
        </div>
      )}

      <div className="grid gap-4 flex-grow p-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-gray-700/80 hover:bg-gray-700 p-4 rounded-xl shadow-lg transition-colors duration-200">
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
