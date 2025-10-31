import { useState } from "react";
import {
  Folder,
  FolderOpen,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
} from "lucide-react";

interface Node {
  id: string;
  data: { label: string };
  selected?: boolean;
}

interface Group {
  id: string;
  name: string;
  color: string;
  nodeIds: string[];
  collapsed: boolean;
}

interface GroupsPanelProps {
  groups: { [groupId: string]: Group };
  nodes: Node[];
  selectedNodes: Node[];
  onCreateGroup: (selectedNodeIds: string[], name: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onRenameGroup: (groupId: string, newName: string) => void;
  onToggleCollapse: (groupId: string) => void;
  onSetGroupColor: (groupId: string, color: string) => void;
  onRemoveNodeFromGroup: (nodeId: string) => void;
}

const PRESET_COLORS = [
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
];

export default function GroupsPanel({
  groups,
  nodes,
  selectedNodes,
  onCreateGroup,
  onDeleteGroup,
  onRenameGroup,
  onToggleCollapse,
  onSetGroupColor,
  onRemoveNodeFromGroup,
}: GroupsPanelProps) {
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [colorPickerGroup, setColorPickerGroup] = useState<string | null>(null);

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      return;
    }

    if (selectedNodes.length === 0) {
      return;
    }

    const nodeIds = selectedNodes.map((n) => n.id);
    const groupId = onCreateGroup(nodeIds, newGroupName);

    if (groupId) {
      setNewGroupName("");
      setExpandedGroups((prev) => new Set([...prev, groupId]));
    }
  };

  const handleRename = (groupId: string) => {
    if (editingName.trim()) {
      onRenameGroup(groupId, editingName);
    }
    setEditingGroupId(null);
    setEditingName("");
  };

  const startEditing = (groupId: string, currentName: string) => {
    setEditingGroupId(groupId);
    setEditingName(currentName);
  };

  const toggleExpanded = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const groupArray = Object.values(groups);

  return (
    <div className="h-full bg-black border-green-900/50 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b-2 border-green-900/50">
        <div className="flex items-center gap-2 mb-2">
          <Folder className="w-4 h-4 text-green-500" />
          <h3 className="text-green-500 font-mono text-sm font-bold">
            NODE GROUPS
          </h3>
        </div>
        <div className="text-[10px] text-green-700 font-mono">
          TOTAL: {groupArray.length} | SELECTED: {selectedNodes.length}
        </div>
      </div>

      {/* Create Group Section */}
      <div className="p-3 border-b border-green-900/50 bg-green-950/20">
        <div className="text-[10px] text-green-600 font-mono mb-2">
          CREATE NEW GROUP:
        </div>
        <div className="space-y-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
            placeholder="Group name..."
            className="w-full px-2 py-1 bg-black border border-green-900/50 text-green-500 text-xs font-mono focus:outline-none focus:border-green-500"
            disabled={selectedNodes.length === 0}
          />
          <button
            onClick={handleCreateGroup}
            disabled={!newGroupName.trim() || selectedNodes.length === 0}
            className="w-full px-2 py-1 bg-green-900/30 text-green-500 text-xs font-mono hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed border border-green-900/50"
          >
            <Plus className="w-3 h-3 inline mr-1" />
            CREATE FROM {selectedNodes.length} NODE(S)
          </button>
        </div>
        {selectedNodes.length === 0 && (
          <div className="mt-2 text-[10px] text-yellow-600 font-mono">
            ⚠ Select nodes in canvas first
          </div>
        )}
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {groupArray.length === 0 ? (
          <div className="text-center text-green-700 text-xs font-mono py-8">
            No groups created yet.
            <br />
            Select nodes and create a group.
          </div>
        ) : (
          groupArray.map((group) => {
            const groupNodes = nodes.filter((n) =>
              group.nodeIds.includes(n.id),
            );
            const isExpanded = expandedGroups.has(group.id);
            const isEditing = editingGroupId === group.id;
            const isColorPicking = colorPickerGroup === group.id;

            return (
              <div
                key={group.id}
                className="border border-green-900/50 bg-black/50 rounded"
                style={{ borderColor: `${group.color}50` }}
              >
                {/* Group Header */}
                <div className="p-2 flex items-center gap-2">
                  <button
                    onClick={() => toggleExpanded(group.id)}
                    className="text-green-500 hover:text-green-400"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  {group.collapsed ? (
                    <Folder
                      className="w-4 h-4"
                      style={{ color: group.color }}
                    />
                  ) : (
                    <FolderOpen
                      className="w-4 h-4"
                      style={{ color: group.color }}
                    />
                  )}

                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(group.id);
                          if (e.key === "Escape") {
                            setEditingGroupId(null);
                            setEditingName("");
                          }
                        }}
                        className="flex-1 px-1 py-0.5 bg-black border border-green-500 text-green-500 text-xs font-mono focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRename(group.id)}
                        className="text-green-500 hover:text-green-400"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingGroupId(null);
                          setEditingName("");
                        }}
                        className="text-red-500 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex-1 text-xs font-mono"
                      style={{ color: group.color }}
                    >
                      {group.name}
                      <span className="text-green-700 ml-2">
                        ({groupNodes.length})
                      </span>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setColorPickerGroup(isColorPicking ? null : group.id)
                        }
                        className="p-1 hover:bg-green-900/30 rounded"
                        title="Change color"
                      >
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: group.color }}
                        />
                      </button>
                      <button
                        onClick={() => startEditing(group.id, group.name)}
                        className="text-green-600 hover:text-green-500 p-1"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onToggleCollapse(group.id)}
                        className="text-green-600 hover:text-green-500 p-1"
                        title="Toggle collapse"
                      >
                        {group.collapsed ? (
                          <Plus className="w-3 h-3" />
                        ) : (
                          <Minus className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => onDeleteGroup(group.id)}
                        className="text-red-600 hover:text-red-500 p-1"
                        title="Delete group"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Color Picker */}
                {isColorPicking && (
                  <div className="px-2 pb-2 flex gap-1">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          onSetGroupColor(group.id, color);
                          setColorPickerGroup(null);
                        }}
                        className="w-6 h-6 rounded border-2 border-transparent hover:border-green-500"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                )}

                {/* Expanded Node List */}
                {isExpanded && groupNodes.length > 0 && (
                  <div className="border-t border-green-900/50 bg-green-950/10">
                    {groupNodes.map((node) => (
                      <div
                        key={node.id}
                        className="px-2 py-1 flex items-center justify-between text-[10px] font-mono border-b border-green-900/30 last:border-b-0"
                      >
                        <div className="text-green-600 truncate flex-1">
                          {node.data.label || node.id}
                        </div>
                        <button
                          onClick={() => onRemoveNodeFromGroup(node.id)}
                          className="text-red-600 hover:text-red-500 ml-2"
                          title="Remove from group"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2 border-t border-green-900/50 bg-green-950/20">
        <div className="text-[9px] text-green-700 font-mono space-y-0.5">
          <div>• Select nodes in canvas, then create group</div>
          <div>• Click folder icon to expand/collapse</div>
          <div>• Groups highlight nodes on canvas</div>
        </div>
      </div>
    </div>
  );
}
