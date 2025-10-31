import { useReactFlow } from "reactflow";

interface GroupOverlaysProps {
  nodeGroups: any;
  nodes: any[];
}

export default function GroupOverlays({
  nodeGroups,
  nodes,
}: GroupOverlaysProps) {
  const { getViewport } = useReactFlow();
  const viewport = getViewport();

  return (
    <>
      {Object.values(nodeGroups).map((group: any) => {
        if (group.collapsed) return null;
        const groupNodes = nodes.filter((n) => group.nodeIds.includes(n.id));
        if (groupNodes.length === 0) return null;

        const paddingX = 40;
        const paddingY = 40;
        const minX =
          Math.min(...groupNodes.map((n) => n.position.x)) - paddingX;
        const minY =
          Math.min(...groupNodes.map((n) => n.position.y)) - paddingY;
        const maxX =
          Math.max(...groupNodes.map((n) => n.position.x + 320)) + paddingX;
        const maxY =
          Math.max(...groupNodes.map((n) => n.position.y + 140)) + paddingY;

        return (
          <div
            key={group.id}
            style={{
              position: "absolute",
              left: minX * viewport.zoom + viewport.x,
              top: minY * viewport.zoom + viewport.y,
              width: (maxX - minX) * viewport.zoom,
              height: (maxY - minY) * viewport.zoom,
              border: `${2 * viewport.zoom}px solid ${group.color}`,
              borderRadius: `${8 * viewport.zoom}px`,
              backgroundColor: `${group.color}10`,
              pointerEvents: "none",
              zIndex: -1,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -12 * viewport.zoom,
                left: 8 * viewport.zoom,
                backgroundColor: group.color,
                color: "black",
                padding: `${2 * viewport.zoom}px ${8 * viewport.zoom}px`,
                borderRadius: `${4 * viewport.zoom}px`,
                fontSize: `${10 * viewport.zoom}px`,
                fontWeight: "bold",
                fontFamily: "monospace",
              }}
            >
              {group.name}
            </div>
          </div>
        );
      })}
    </>
  );
}
