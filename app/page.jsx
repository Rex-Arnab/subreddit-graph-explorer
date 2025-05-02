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
        <div className="w-full pb-5">
          <a
            href="https://github.com/Rex-Arnab/subreddit-graph-explorer"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 text-sm text-gray-300 hover:text-white transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
              />
            </svg>
            Star on GitHub
          </a>
        </div>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center">
            <h1 className="text-2xl font-bold mb-1 text-center text-white">
              Subreddit Graph Explorer
            </h1>
          </div>
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
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-lg text-white font-medium disabled:opacity-80 transition-all duration-200 transform hover:scale-[1.02] active:scale-95 shadow-md disabled:transform-none"
                disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
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
                    <span className="font-medium">Searching...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    Explore
                  </span>
                )}
              </button>
              <label className="flex items-center gap-2 text-sm text-gray-300 hover:text-white cursor-pointer transition-colors">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={allowNsfw}
                    onChange={(e) => setAllowNsfw(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
                </div>
                <span className="font-medium">NSFW</span>
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
