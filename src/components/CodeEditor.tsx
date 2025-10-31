import Editor, { type OnChange, type OnMount } from "@monaco-editor/react";
import { useRef } from "react";

// Monaco Editor Component with proper event handling
const CodeEditor = ({
  value,
  onChange,
  nodeId,
  onEditorMount,
}: {
  value: string;
  onChange: (value: string) => void;
  nodeId: string;
  onEditorMount?: (editor: any) => void;
}) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    if (!editor) return;
    editorRef.current = editor;

    // Configure Monaco theme
    monaco.editor.defineTheme("tactical-theme", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "22c55e", fontStyle: "italic" },
        { token: "keyword", foreground: "4ade80" },
        { token: "string", foreground: "86efac" },
        { token: "number", foreground: "22c55e" },
      ],
      colors: {
        "editor.background": "#000000",
        "editor.foreground": "#22c55e",
        "editorLineNumber.foreground": "#166534",
        "editor.lineHighlightBackground": "#052e16",
        "editor.selectionBackground": "#14532d",
      },
    });
    monaco.editor.setTheme("tactical-theme");

    if (onEditorMount) {
      onEditorMount(editor);
    }
  };

  return (
    <div className="h-full border border-green-900/30">
      <Editor
        height="100%"
        defaultLanguage="javascript"
        value={value}
        language="javascript"
        onChange={onChange as OnChange | undefined}
        onMount={handleEditorDidMount}
        theme="tactical-theme"
        options={{
          minimap: { enabled: false },
          fontSize: 12,
          fontFamily: "monospace",
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          insertSpaces: true,
          mouseWheelZoom: true,
          tabSize: 2,
          wordWrap: "on",
          contextmenu: true,
          selectOnLineNumbers: true,
        }}
      />
      <div className="absolute top-2 right-2 text-[10px] text-green-700 font-mono bg-black/80 px-2 py-1 border border-green-900/50">
        NODE: {nodeId}
      </div>
    </div>
  );
};

export default CodeEditor;
