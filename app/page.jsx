"use client"; // Make this a Client Component to manage state and interactions

import React, { useState, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import Sidebar from "@/components/Sidebar";
import { searchRelatedSubreddits } from "@/lib/utils";

// Dynamically import the SubredditGraph component ONLY on the client-side
const DynamicSubredditGraph = dynamic(
  () => import("@/components/SubredditGraph"),
  {
    ssr: false, // Disable server-side rendering for this component
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-white text-xl">Loading Graph Component...</p>
      </div>
    )
  }
);

export default function Home() {
  const [query, setQuery] = useState("");
  const [graphData, setGraphData] = useState({
    nodes: [],
    links: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSubreddit, setSelectedSubreddit] = useState(null);
  const [searchedNodeId, setSearchedNodeId] = useState(null);
  const [allowNsfw, setAllowNsfw] = useState(false);

  const handleSearch = async (event) => {
    if (event) event.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setGraphData({ nodes: [], links: [] });
    setSelectedSubreddit(null);
    setSearchedNodeId(query.trim().toLowerCase());

    try {
      const initialNode = {
        id: query.trim().toLowerCase(),
        name: `r/${query.trim()}`
      };

      const relatedSubs = await searchRelatedSubreddits(query, 20, allowNsfw);

      const nodes = [
        initialNode,
        ...relatedSubs.map((sub) => ({
          id: sub.id,
          name: `r/${sub.name}`,
          val: sub.subscribers ? Math.log10(sub.subscribers + 1) : 1
        }))
      ];
      const links = relatedSubs.map((sub) => ({
        source: initialNode.id,
        target: sub.id
      }));

      setGraphData({ nodes, links });
    } catch (err) {
      console.error("Search error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred during search."
      );
      setGraphData({ nodes: [], links: [] });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpandNode = useCallback(
    async (nodeId) => {
      setIsLoading(true);
      setError(null);
      try {
        const searchName = nodeId.startsWith("r/")
          ? nodeId.substring(2)
          : nodeId;

        const relatedSubs = await searchRelatedSubreddits(
          searchName,
          10,
          allowNsfw
        );

        const newNodes = relatedSubs
          .filter((sub) => sub.id !== nodeId)
          .map((sub) => ({
            id: sub.id,
            name: `r/${sub.name}`,
            val: sub.subscribers ? Math.log10(sub.subscribers + 1) : 1
          }));

        const newLinks = relatedSubs
          .filter((sub) => sub.id !== nodeId)
          .map((sub) => ({
            source: nodeId,
            target: sub.id
          }));

        return { nodes: newNodes, links: newLinks };
      } catch (err) {
        console.error("Expansion error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred during expansion."
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [graphData.links, searchedNodeId]
  );

  const handleNodeClickForSidebar = (node) => {
    setSelectedSubreddit(node.name.substring(2));
  };

  const closeSidebar = () => {
    setSelectedSubreddit(null);
  };

  return (
    <main className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      <div className="p-4 bg-gray-800 shadow-md z-10 sticky top-0">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-3 text-center text-white">
            Subreddit Graph Explorer
          </h1>
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-3 items-center justify-center">
            <div className="flex-1 w-full sm:w-auto">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search subreddits..."
                className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex gap-3 items-center">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold disabled:opacity-50 transition-colors"
                disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
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
                    Searching...
                  </span>
                ) : (
                  "Explore"
                )}
              </button>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowNsfw}
                  onChange={(e) => setAllowNsfw(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="">NSFW</span>
              </label>
            </div>
            {error && (
              <p className="text-red-400 text-sm mt-2 sm:mt-0 text-center w-full">
                {error}
              </p>
            )}
          </form>
        </div>
      </div>

      <div className="flex flex-1 flex-col sm:flex-row overflow-hidden relative">
        <div
          className={`flex-1 h-full transition-all duration-300 ease-in-out ${
            selectedSubreddit ? "w-full sm:w-2/3 lg:w-3/4" : "w-full"
          }`}>
          <Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center">
                <p>Loading Graph...</p>
              </div>
            }>
            <DynamicSubredditGraph
              initialData={graphData}
              onNodeClick={handleNodeClickForSidebar}
              onExpandNode={handleExpandNode}
              isLoading={isLoading && graphData.nodes.length === 0}
            />
          </Suspense>
        </div>

        {selectedSubreddit && (
          <Sidebar
            subredditName={selectedSubreddit}
            onClose={closeSidebar}
            allowNsfw={allowNsfw}
          />
        )}
      </div>
    </main>
  );
}
