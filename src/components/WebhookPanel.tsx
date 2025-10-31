import { Webhook } from "lucide-react";
import { useState } from "react";

interface WebhookTypes {
  webhooks: any[];
  onAdd: (webhookName: string) => void;
  onRemove: (index: number) => void;
  onToggle: (index: number) => void;
  events: any[];
  onTrigger: (webhookId: string, data: Record<string, string>) => void;
}

const WebhookPanel = ({
  webhooks,
  onAdd,
  onRemove,
  onToggle,
  events,
  onTrigger,
}: WebhookTypes) => {
  const [name, setName] = useState<string>("");
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [testPayload, setTestPayload] = useState<string>(
    '{\n  "test": "data",\n  "value": 100\n}',
  );

  const [selectedWebhook, setSelectedWebhook] = useState<WebhookTypes | null>(
    null,
  );
  const [jsonError, setJsonError] = useState("");

  const handleAdd = () => {
    if (name.trim()) {
      onAdd(name.trim());
      setName("");
      setShowAdd(false);
    }
  };
  const handlePayloadChange = (value: string) => {
    setTestPayload(value);
    // Validate JSON as user types
    try {
      if (value.trim()) {
        JSON.parse(value);
        setJsonError("");
      }
    } catch (error: any) {
      setJsonError(error.message);
    }
  };

  const handleTest = (webhookId: string) => {
    try {
      const trimmed = testPayload.trim();

      if (!trimmed) {
        alert("Enter valid JSON payload");
        return;
      }

      const payload = JSON.parse(trimmed);
      onTrigger(webhookId, payload);
      setJsonError("");
    } catch (error: any) {
      // >>> future logging using a toasty
      // for now alert will do lel
      // >>> maybe I use the logType on Console,
      // will see in future
      setJsonError(error.message);
      alert("Invalid JSON: " + error.message);
    }
  };

  const loadExample = (example: "simple" | "user" | "complex") => {
    const examples = {
      simple: '{\n  "event": "test",\n  "data": "hello"\n}',
      user:
        '{\n  "userId": "12345",\n  "action": "login",\n  "timestamp": "' +
        new Date().toISOString() +
        '"\n}',
      complex:
        '{\n  "event": "order_created",\n  "order": {\n    "id": "ord_123",\n    "total": 99.99,\n    "items": [\n      {"name": "Product 1", "qty": 2}\n    ]\n  }\n}',
    };
    setTestPayload(examples[example]);
    setJsonError("");
  };

  const copyWebhookUrl = (webhookId: string) => {
    const url: string = `${window.location.origin}/api/webhook/${webhookId}`;
    navigator.clipboard.writeText(url);
    // seriosly need a toast hook, will develop later
    // TODO: implement a toast
    alert("Webhook URL copied to clipboard!");
  };

  const getCurlCommand = (webhookId: string) => {
    return `curl -X POST ${window.location.origin}/api/webhook/${webhookId} \\
-H "Content-Type: application/json" \\
-d '${testPayload}'`;
  };

  return (
    <div className="h-full flex flex-col bg-black/90 border-2 border-green-900/50">
      <div className="bg-gradient-to-r from-green-950/80 to-black/80 px-3 py-2 border-b border-green-900/30 flex items-center gap-2">
        <Webhook className="w-4 h-4 text-green-500" />
        <span className="text-green-400 font-mono text-xs font-bold tracking-wider">
          WEBHOOKS
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-green-700 font-mono">
            {webhooks.length} HOOKS
          </span>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="text-[10px] text-green-600 hover:text-green-400 font-mono"
          >
            {showAdd ? "CANCEL" : "+ ADD"}
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="p-3 border-b border-green-900/30 bg-black/50">
          <input
            type="text"
            placeholder="Webhook name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-black border border-green-900/50 text-green-400 font-mono text-xs px-2 py-1 mb-2 focus:border-green-500 focus:outline-none"
          />
          <button
            onClick={handleAdd}
            className="w-full bg-green-900/50 hover:bg-green-800/50 border border-green-500/50 text-green-400 font-mono text-xs py-1"
          >
            CREATE WEBHOOK
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {webhooks.length === 0 ? (
          <div className="text-green-700 font-mono text-xs">
            // No webhooks...
          </div>
        ) : (
          webhooks.map((wh, idx) => (
            <div
              key={idx}
              className="bg-black/50 border border-green-900/30 p-2 rounded font-mono text-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${wh.active ? "bg-green-500" : "bg-gray-500"}`}
                  ></div>
                  <span className="text-green-500 font-bold">{wh.name}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onToggle(idx)}
                    className={`text-[10px] ${wh.active ? "text-yellow-500" : "text-green-500"}`}
                  >
                    {wh.active ? "DISABLE" : "ENABLE"}
                  </button>
                  <button
                    onClick={() => onRemove(idx)}
                    className="text-[10px] text-red-600"
                  >
                    DELETE
                  </button>
                </div>
              </div>

              {/* Webhook URL */}
              <div className="mb-2">
                <div className="text-green-700 text-[10px] mb-1">ENDPOINT:</div>
                <div className="bg-black/70 p-2 rounded border border-green-900/30 flex items-center justify-between">
                  <code className="text-green-400 text-[10px] break-all flex-1">
                    POST /api/webhook/{wh.id}
                  </code>
                  <button
                    onClick={() => copyWebhookUrl(wh.id)}
                    className="ml-2 text-green-500 hover:text-green-400 text-[10px]"
                  >
                    COPY
                  </button>
                </div>
              </div>

              {/* Test Section */}
              <div className="border-t border-green-900/30 pt-2 mt-2">
                <div className="text-green-700 text-[10px] mb-1">
                  TEST WEBHOOK:
                </div>
                <textarea
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  placeholder='{"key": "value"}'
                  className="w-full bg-black border border-green-900/50 text-green-400 font-mono text-[10px] px-2 py-1 mb-1 focus:border-green-500 focus:outline-none h-16 resize-none"
                />
                <div className="text-green-700 text-[9px] mb-2 font-mono">
                  Tip: Must be valid JSON
                </div>
                <button
                  onClick={() => handleTest(wh.id)}
                  disabled={!wh.active}
                  className="w-full bg-orange-900/50 hover:bg-orange-800/50 disabled:bg-gray-900/50 border border-orange-500/50 disabled:border-gray-700 text-orange-400 disabled:text-gray-600 font-mono text-[10px] py-1"
                >
                  {wh.active ? "TRIGGER TEST" : "ENABLE WEBHOOK TO TEST"}
                </button>
              </div>

              {/* cURL Command */}
              <div className="border-t border-green-900/30 pt-2 mt-2">
                <div className="text-green-700 text-[10px] mb-1">
                  CURL COMMAND:
                </div>
                <div className="bg-black/70 p-2 rounded border border-green-900/30">
                  <code className="text-green-400 text-[9px] break-all whitespace-pre-wrap">
                    {getCurlCommand(wh.id)}
                  </code>
                </div>
              </div>

              <div className="text-green-600 text-[10px] mt-2">
                Triggers: {wh.triggerCount || 0}
              </div>
            </div>
          ))
        )}
      </div>

      {events.length > 0 && (
        <div className="p-3 border-t border-green-900/30">
          <div className="text-green-500 font-bold mb-2 text-xs font-mono">
            RECENT EVENTS:
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {events
              .slice(-5)
              .reverse()
              .map((evt, idx) => (
                <div
                  key={idx}
                  className="text-[10px] text-green-400 bg-black/50 p-1 rounded font-mono"
                >
                  [{evt.timestamp}] {evt.webhook} -{" "}
                  {JSON.stringify(evt.data).substring(0, 40)}...
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="p-3 border-t border-green-900/30 bg-black/50">
        <div className="text-green-500 font-bold mb-2 text-[10px] font-mono">
          HOW TO USE:
        </div>
        <div className="text-green-700 text-[9px] font-mono space-y-1">
          <div>1. Click "TRIGGER TEST" to test locally</div>
          <div>2. Copy URL and use in Postman/Bruno</div>
          <div>3. Send POST request with JSON body</div>
          <div>4. Webhook will trigger workflow execution</div>
        </div>
      </div>
    </div>
  );
};

export default WebhookPanel;
