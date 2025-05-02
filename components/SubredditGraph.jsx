"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import ForceGraph2D from "react-force-graph-2d";

const SubredditGraph = ({
  initialData,
  onNodeClick,
  onExpandNode,
  isLoading
}) => {
  const [graphData, setGraphData] = useState(initialData);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const graphRef = useRef();

  useEffect(() => {
    setGraphData(initialData);
    setSelectedNodeId(null);
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
  }, [initialData]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "//s.imgur.com/min/embed.js";
    script.async = true;
    script.charset = "utf-8";
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleNodeHover = useCallback(
    (node) => {
      const newHighlightNodes = new Set();
      const newHighlightLinks = new Set();

      if (node) {
        newHighlightNodes.add(node.id);
        graphData.links.forEach((link) => {
          if (link.source === node.id || link.target === node.id) {
            newHighlightLinks.add(link);
            newHighlightNodes.add(link.source);
            newHighlightNodes.add(link.target);
          }
        });
      }
      setHighlightNodes(newHighlightNodes);
      setHighlightLinks(newHighlightLinks);
    },
    [graphData.links]
  );

  const handleLinkHover = useCallback((link) => {
    const newHighlightNodes = new Set();
    const newHighlightLinks = new Set();

    if (link) {
      newHighlightLinks.add(link);
      newHighlightNodes.add(link.source);
      newHighlightNodes.add(link.target);
    }
    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);
  }, []);

  const handleNodeClickInternal = useCallback(
    async (node) => {
      if (node.x !== undefined && node.y !== undefined) {
        graphRef.current?.centerAt(node.x, node.y, 1000);
        graphRef.current?.zoom(2.5, 1000);
      }

      onNodeClick(node);
      setSelectedNodeId(node.id);

      const newData = await onExpandNode(node.id);

      if (newData) {
        setGraphData((prevData) => {
          const existingNodeIds = new Set(prevData.nodes.map((n) => n.id));
          const existingLinkIds = new Set(
            prevData.links.map((l) => `${l.source}-${l.target}`)
          );

          const uniqueNewNodes = newData.nodes.filter(
            (n) => !existingNodeIds.has(n.id)
          );
          const uniqueNewLinks = newData.links.filter(
            (l) => !existingLinkIds.has(`${l.source}-${l.target}`)
          );

          return {
            nodes: [...prevData.nodes, ...uniqueNewNodes],
            links: [...prevData.links, ...uniqueNewLinks]
          };
        });
      }
    },
    [onNodeClick, onExpandNode]
  );

  const nodeCanvasObject = useCallback(
    (node, ctx, globalScale) => {
      const label = node.name;
      const fontSize = 12 / globalScale;
      ctx.font = `${fontSize}px Sans-Serif`;
      const textWidth = ctx.measureText(label).width;
      const bgDimensions = [
        textWidth + fontSize * 0.4,
        fontSize + fontSize * 0.4
      ];

      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      if (node.id === selectedNodeId) {
        ctx.fillStyle = "rgba(255, 223, 186, 0.95)";
      } else if (highlightNodes.has(node.id)) {
        ctx.fillStyle = "rgba(200, 200, 255, 0.9)";
      }

      if (node.x !== undefined && node.y !== undefined) {
        ctx.fillRect(
          node.x - bgDimensions[0] / 2,
          node.y - bgDimensions[1] / 2,
          bgDimensions[0],
          bgDimensions[1]
        );
      }

      ctx.strokeStyle =
        node.id === selectedNodeId
          ? "orange"
          : highlightNodes.has(node.id)
          ? "blue"
          : "grey";
      ctx.lineWidth = 1 / globalScale;
      if (node.x !== undefined && node.y !== undefined) {
        ctx.strokeRect(
          node.x - bgDimensions[0] / 2,
          node.y - bgDimensions[1] / 2,
          bgDimensions[0],
          bgDimensions[1]
        );
      }

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle =
        node.id === selectedNodeId
          ? "#333"
          : highlightNodes.has(node.id)
          ? "blue"
          : "#333";
      if (node.x !== undefined && node.y !== undefined) {
        ctx.fillText(label, node.x, node.y);
      }

      node.__bckgDimensions = bgDimensions;
    },
    [highlightNodes, selectedNodeId]
  );

  return (
    <div className="w-full h-full relative border border-gray-700 rounded-md overflow-hidden bg-gray-900">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70 z-10">
          <p className="text-white text-xl">Loading Graph...</p>
        </div>
      )}
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeId="id"
        linkSource="source"
        linkTarget="target"
        nodeRelSize={4}
        nodeVal="val"
        nodeLabel="name"
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.fillStyle = color;
          const bckgDimensions = node.__bckgDimensions;
          if (bckgDimensions && node.x !== undefined && node.y !== undefined) {
            ctx.fillRect(
              node.x - bckgDimensions[0] / 2,
              node.y - bckgDimensions[1] / 2,
              bckgDimensions[0],
              bckgDimensions[1]
            );
          }
        }}
        linkColor={() => "rgba(255,255,255,0.3)"}
        linkWidth={(link) => (highlightLinks.has(link) ? 2 : 1)}
        linkDirectionalParticles={(link) => (highlightLinks.has(link) ? 4 : 0)}
        linkDirectionalParticleWidth={2}
        onNodeClick={handleNodeClickInternal}
        onNodeHover={handleNodeHover}
        onLinkHover={handleLinkHover}
        cooldownTicks={100}
        onEngineStop={() => graphRef.current?.zoomToFit(400, 100)}
        enableZoomInteraction={true}
        enableNodeDrag={true}
      />
    </div>
  );
};

export default SubredditGraph;
