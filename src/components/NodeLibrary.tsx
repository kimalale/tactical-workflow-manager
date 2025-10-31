import React, { useState } from "react";
import { Package, Download, Star, Search } from "lucide-react";

export interface NodeTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  code: string;
  author: string;
  downloads: number;
  rating: number;
  tags: string[];
}

const NODE_TEMPLATES: NodeTemplate[] = [
  {
    id: "email_sender",
    name: "Email Sender",
    description: "Send emails via SMTP or API",
    category: "Communication",
    code: `// Email Sender Node
console.log("Sending email...");

const emailConfig = {
  to: data.email || 'recipient@example.com',
  subject: data.subject || 'Notification',
  body: data.message || 'Your workflow has completed!'
};

// Using a mail API (e.g., SendGrid, Mailgun)
const response = await axios.post('https://api.mailservice.com/send', {
  to: emailConfig.to,
  subject: emailConfig.subject,
  html: emailConfig.body
}, {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

console.log("Email sent:", response.data);
return { success: true, messageId: response.data.id };`,
    author: "Community",
    downloads: 1250,
    rating: 4.8,
    tags: ["email", "notification", "communication"],
  },
  {
    id: "json_parser",
    name: "JSON Parser",
    description: "Parse and validate JSON data",
    category: "Data Processing",
    code: `// JSON Parser Node
console.log("Parsing JSON...");

try {
  // Parse input JSON
  const parsed = typeof data === 'string' ? JSON.parse(data) : data;

  console.log("Parsed successfully:", Object.keys(parsed).length, "keys");

  // Validate required fields
  const required = ['id', 'name'];
  const missing = required.filter(field => !parsed[field]);

  if (missing.length > 0) {
    console.log("Missing fields:", missing.join(', '));
    return { error: "Missing required fields", fields: missing };
  }

  return { success: true, data: parsed };

} catch (error) {
  console.log("Parse error:", error.message);
  return { error: "Invalid JSON", message: error.message };
}`,
    author: "Community",
    downloads: 2100,
    rating: 4.9,
    tags: ["json", "parsing", "validation"],
  },
  {
    id: "slack_notifier",
    name: "Slack Notification",
    description: "Send messages to Slack channels",
    category: "Communication",
    code: `// Slack Notification Node
console.log("Sending Slack notification...");

const slackWebhook = vars.get('SLACK_WEBHOOK_URL') || 'YOUR_WEBHOOK_URL';

const message = {
  text: data.message || 'Workflow notification',
  blocks: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: \`*\${data.title || 'Notification'}*\\n\${data.message}\`
      }
    }
  ]
};

const response = await axios.post(slackWebhook, message);

console.log("Slack message sent");
return { success: true, timestamp: Date.now() };`,
    author: "TacticalTeam",
    downloads: 3400,
    rating: 5.0,
    tags: ["slack", "notification", "messaging"],
  },
  {
    id: "csv_generator",
    name: "CSV Generator",
    description: "Convert JSON data to CSV format",
    category: "Data Processing",
    code: `// CSV Generator Node
console.log("Generating CSV...");

// Convert array of objects to CSV
const items = Array.isArray(data) ? data : [data];

if (items.length === 0) {
  return { error: "No data to convert" };
}

// Get headers from first item
const headers = Object.keys(items[0]);

// Generate CSV string
let csv = headers.join(',') + '\\n';

items.forEach(item => {
  const row = headers.map(header => {
    const value = item[header];
    // Escape values with commas or quotes
    return typeof value === 'string' && (value.includes(',') || value.includes('"'))
      ? \`"\${value.replace(/"/g, '""')}"\`
      : value;
  });
  csv += row.join(',') + '\\n';
});

console.log("CSV generated:", items.length, "rows");

// Store in variables
vars.set('lastCSV', csv);

return {
  success: true,
  csv: csv,
  rows: items.length,
  columns: headers.length
};`,
    author: "DataTools",
    downloads: 1800,
    rating: 4.7,
    tags: ["csv", "export", "data"],
  },
  {
    id: "delay_timer",
    name: "Delay/Timer",
    description: "Add delays between workflow steps",
    category: "Utility",
    code: `// Delay Timer Node
console.log("Starting delay...");

// Get delay in milliseconds (default 1 second)
const delayMs = data ? data.delay : 1000;
const delaySeconds = delayMs / 1000;

console.log(\`Waiting for \${delaySeconds} seconds...\`);

// Wait
const delay = async (number) => {
    await new Promise(resolve => setTimeout(resolve, number));
}
await delay(delayMs);

console.log("Delay complete");

return {
  success: true,
  delayed: delayMs,
  timestamp: Date.now()
};`,
    author: "Community",
    downloads: 5200,
    rating: 4.6,
    tags: ["delay", "timer", "utility"],
  },
];

export const NodeLibrary: React.FC<{
  onImportNode: (template: NodeTemplate) => void;
  onClose: () => void;
}> = ({ onImportNode, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", ...new Set(NODE_TEMPLATES.map((t) => t.category))];

  const filteredTemplates = NODE_TEMPLATES.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some((tag) => tag.includes(searchTerm.toLowerCase()));
    const matchesCategory =
      selectedCategory === "All" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-black border-2 border-green-500 w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-950 to-black border-b-2 border-green-500 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-green-500" />
            <h2 className="text-green-400 font-mono text-xl font-bold">
              NODE LIBRARY
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-green-500 hover:text-green-400 font-mono text-xl"
          >
            ✕
          </button>
        </div>

        {/* Search & Filter */}
        <div className="p-4 border-b border-green-900/50 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black border border-green-900/50 text-green-400 font-mono text-sm px-10 py-2 focus:border-green-500 focus:outline-none"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-black border border-green-900/50 text-green-400 font-mono text-sm px-4 py-2 focus:border-green-500 focus:outline-none"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-black/50 border border-green-900/50 p-4 rounded hover:border-green-500/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-green-400 font-mono text-sm font-bold">
                  {template.name}
                </h3>
                <div className="flex items-center gap-1 text-yellow-500 text-xs">
                  <Star className="w-3 h-3 fill-current" />
                  <span>{template.rating}</span>
                </div>
              </div>

              <p className="text-green-600 text-xs mb-3">
                {template.description}
              </p>

              <div className="flex flex-wrap gap-1 mb-3">
                {template.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-green-900/30 text-green-500 text-[10px] px-2 py-0.5 rounded font-mono"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-[10px] text-green-700 font-mono mb-3">
                <span>by {template.author}</span>
                <span className="flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  {template.downloads}
                </span>
              </div>

              <button
                onClick={() => {
                  onImportNode(template);
                  onClose();
                }}
                className="w-full bg-green-900/50 hover:bg-green-800/50 border border-green-500/50 text-green-400 font-mono text-xs py-2 transition-colors"
              >
                IMPORT TEMPLATE
              </button>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-green-700 font-mono">
            No templates found
          </div>
        )}
      </div>
    </div>
  );
};
