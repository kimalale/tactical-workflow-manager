# Tactical Workflow Manager

  ![Version](https://img.shields.io/badge/Version-4.4.0-ffff00?style=for-the-badge&logo=git&logoColor=00ff00&labelColor=000000)

![Version](https://img.shields.io/badge/Last%20Updated-31%20October%202025-ffff00?style=for-the-badge&logo=git&logoColor=00ff00&labelColor=000000)

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Installation](#installation)
4. [Quick Start](#quick-start)
5. [Node Types](#node-types)
6. [Core Systems](#core-systems)
7. [API Reference](#api-reference)
8. [Use Cases](#use-cases)
9. [Troubleshooting](#troubleshooting)

---

## Brief Overview

The Tactical Workflow Manager is visual workflow automation system built with React Vite, with a theme inspired by hacking terminals in moview. It enables users to create complex automation workflows using a node-based interface with real-time execution, database integration, and webhook support. It also provides a Node-Scipted Library/Marketplace for users to share their workflow configs.

### Main Capabilities
- **Visual Workflow Builder** - Select-and-drag node creation and connection
- **Code Execution Engine** - Run custom JavaScript in each node (still yet to implement sandbox usage)
- **Real-time Automation** - Schedule workflows to run automatically
- **Database Integration** - Store and retrieve data from multiple databases
- **Webhook Support** - Trigger workflows via HTTP POST requests
- **Variable Storage** - Persist data across workflow executions

---

## Features

### Node Types

| Node Type | Description |
|-----------|-------------|
| **Basic Function**  | General-purpose JavaScript execution |
| **HTTP Request**  | Make API calls with Axios |
| **Condition** | IF/ELSE branching logic |
| **Loop** | Repeat execution with iteration control |
| **Variable Storage** | Store/retrieve global variables |
| **Database** | Save/query database records |
| **Webhook** | Receive external HTTP triggers |

### Important Core Systems

1. **Execution Engine**
   - Topological node execution order
   - Async/await support
   - Error handling and recovery
   - Execution history tracking

2. **Variable Storage**
   - Global key-value store
   - Accessible across all nodes
   - Persistent during workflow session
   - UI management panel

3. **Scheduler**
   - Multiple schedule support
   - Seconds/Minutes/Hours intervals
   - Start/Stop controls
   - Next execution display

4. **Webhooks**
   - Create multiple webhooks
   - Enable/Disable individual hooks
   - Event logging
   - Trigger count tracking

5. **Database Integration**
   - MongoDB support
   - PostgreSQL support
   - Firebase support
   - MySQL support
   - Connection testing
   - Execution history storage

---

## Installation

### Prerequisites
```bash
node >= 22.15.0
npm >= 11.1.0
```

### Setup Instructions

1. **Clone the repo**
```bash
git clone http://github.com/kimalale/tactical-workflow-manager.git
cd tactical-workflow-manager
```

2. **Install Dependencies**
```bash
npm install
```

6. **Run Application**
```bash
npm run dev
```

Navigate to `http://localhost:5173`

---

## Quick Start

### Creating Your First Workflow

1. **Add Nodes**
   - Click "ADD NODE" dropdown
   - Select node type (e.g., "Basic Function")
   - Node appears on canvas

2. **Connect Nodes**
   - Drag from right green dot (output)
   - Drop on left green dot (input) of target node
   - Green animated line appears

3. **Edit Node Code**
   - Click the maximize icon (⤢) on node
   - Monaco editor appears
   - Write your JavaScript code
   - Code editor won't move node while editing

4. **Execute Workflow**
   - Click "EXECUTE" button
   - Watch console for output
   - View execution status in nodes

### Example: Simple Data Processing

**Node 1: Generate Data**
```javascript
console.log("Generating data...");
const data = {
  id: Date.now(),
  value: Math.random() * 100
};
console.log("Generated:", data);
return data;
```

**Node 2: Process Data**
```javascript
console.log("Received:", data);
const processed = {
  ...data,
  doubled: data.value * 2,
  processedAt: new Date().toISOString()
};
console.log("Processed:", processed);
return processed;
```

**Node 3: Store Result**
```javascript
console.log("Storing:", data);
vars.set('lastResult', data);
console.log("Stored in variables!");
return { success: true };
```

Connect: Node 1 → Node 2 → Node 3, then click Execute!

---

## Node Types

### 1. Basic Function Node

**Purpose:** General-purpose JavaScript execution

**Available Objects:**
- `data` - Input from previous node
- `console` - Logging (console.log, console.error)
- `vars` - Variable storage access
- `axios` - HTTP client
- `db` - Database access

**Example:**
```javascript
console.log("Input data:", data);

// Your logic
const result = data ? data * 2 : 42;

console.log("Output:", result);
return result;
```

---

### 2. HTTP Request Node

**Purpose:** Make API calls to external services

**Features:**
- GET, POST, PUT, DELETE methods
- Custom headers
- Authentication support
- Error handling

**Example:**
```javascript
console.log("Making API request...");

try {
  // GET request
  const response = await axios.get('https://api.example.com/data', {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json'
    }
  });

  console.log("Status:", response.status);
  console.log("Data:", response.data);

  return response.data;

} catch (error) {
  console.log("ERROR:", error.message);
  return { error: error.message };
}
```

**POST Example:**
```javascript
const postData = await axios.post('https://api.example.com/submit', {
  playerId: data.playerId,
  score: data.score
}, {
  headers: {
    'Authorization': 'Bearer TOKEN',
    'Cookie': data.cookie
  }
});

return postData.data;
```

---

### 3. Condition Node

**Purpose:** Branch workflow based on conditions

**Features:**
- Two output handles (TRUE and FALSE)
- Boolean return value routes flow
- Support complex conditions

**Example:**
```javascript
console.log("Evaluating:", data);

// Check multiple conditions
if (data && data.score > 100) {
  console.log("High score path!");
  return true;  // Goes to TRUE output
} else {
  console.log("Low score path!");
  return false; // Goes to FALSE output
}
```

**Connecting:**
- TRUE output (top) → Success path nodes
- FALSE output (bottom) → Failure/retry path nodes

---

### 4. Loop Node

**Purpose:** Execute code multiple times

**Features:**
- Iteration tracking
- State preservation
- Continue/break control
- Result accumulation

**Example:**
```javascript
console.log("Loop iteration:", loopData.iteration || 0);

// Initialize
if (!loopData.iteration) {
  loopData.iteration = 0;
  loopData.results = [];
}

loopData.iteration++;

// Your loop logic
const result = {
  iteration: loopData.iteration,
  value: data ? data * loopData.iteration : loopData.iteration
};

loopData.results.push(result);
console.log("Current:", result);

// Control loop
if (loopData.iteration < 5) {
  console.log("Continuing...");
  return {
    continue: true,
    data: result,
    loopData
  };
} else {
  console.log("Complete!");
  return {
    continue: false,
    data: loopData.results,
    loopData
  };
}
```

---

### 5. Variable Storage Node

**Purpose:** Store and retrieve global variables

**Variable API:**
- `vars.set(key, value)` - Store variable
- `vars.get(key)` - Retrieve variable
- `vars.has(key)` - Check if exists
- `vars.delete(key)` - Remove variable
- `vars.all()` - Get all variables

**Example:**
```javascript
console.log("Variable operations...");

// Store data
vars.set('userId', 'USER123');
vars.set('sessionData', {
  token: 'abc123',
  expires: Date.now() + 3600000
});

// Retrieve data
const userId = vars.get('userId');
console.log("User ID:", userId);

// Check existence
if (vars.has('sessionData')) {
  const session = vars.get('sessionData');
  console.log("Session found:", session);
}

// Get all variables
const allVars = vars.all();
console.log("All variables:", Object.keys(allVars));

return { stored: true, count: Object.keys(allVars).length };
```

---

### 6. Database Node

**Purpose:** Save and query database records

**Database API:**
- `db.save(collection, data)` - Save record
- `db.query(collection, filter)` - Query records
- `db.connections` - View active connections

**Example:**
```javascript
console.log("Database operations...");

// Save execution result
const saveResult = await db.save('workflow_executions', {
  timestamp: new Date().toISOString(),
  nodeData: data,
  status: 'completed',
  metadata: {
    source: 'workflow',
    version: '4.0.0'
  }
});

console.log("Saved:", saveResult);

// Query historical data
const history = await db.query('workflow_executions', {
  status: 'completed'
});

console.log("Found", history.length, "records");

return {
  saved: saveResult.success,
  historyCount: history.length
};
```

---

### 7. Webhook Node

**Purpose:** Receive data from external HTTP requests

**Usage:**
```javascript
console.log("Webhook triggered!");

// Data comes from POST request
if (!data) {
  console.log("No webhook data");
  return { error: "No data" };
}

console.log("Received payload:", data);

// Process webhook data
const processed = {
  ...data,
  receivedAt: new Date().toISOString(),
  processed: true
};

// Store for other nodes
vars.set('lastWebhook', processed);

console.log("Webhook processed");
return processed;
```

---

## Core Helper Systems

### Variable Storage System

**Purpose:** Share data between nodes and workflow executions

**Features:**
- Global key-value store
- Supports all JSON types
- UI management panel
- Persistent during session

**Usage in Nodes:**
```javascript
// Set variables
vars.set('apiKey', 'secret123');
vars.set('userData', { id: 1, name: 'User' });
vars.set('attempts', 0);

// Get variables
const key = vars.get('apiKey');
const user = vars.get('userData');

// Increment counter
vars.set('attempts', vars.get('attempts') + 1);

// Check existence
if (vars.has('userData')) {
  console.log("User data exists");
}

// Delete variable
vars.delete('tempData');

// Get all
const all = vars.all();
```

**UI Management:**
1. Click "VARS" button in header
2. Click "+ ADD" to create variable
3. Enter name and value (JSON or string)
4. Click "SET VARIABLE"
5. Variables appear in list
6. Click "DELETE" to remove
7. Click "CLEAR" to remove all

---

### Scheduler System

**Purpose:** Automatically execute workflows at intervals

**Features:**
- Multiple schedules per workflow
- Second/minute/hour intervals
- Start/stop control
- Next run time display

**Setup:**
1. Enter interval (e.g., "5")
2. Select unit (seconds/minutes/hours)
3. Click "ADD"
4. Click "START" to activate scheduler
5. Workflow runs automatically

**Use Cases:**
- Monitor APIs every 5 minutes
- Process data every hour
- Check game status every 30 seconds
- Send reports daily

**Example Workflow:**
```
Every 10 minutes:
  Check API → Condition → [Active?]
                           ├─ TRUE → Process
                           └─ FALSE → Log & Skip
```

---

### Webhook System

**Purpose:** Trigger workflows from external events

**Features:**
- Multiple webhook endpoints
- Enable/disable per webhook
- Event logging
- Trigger count tracking

**Setup:**
1. Click "HOOKS" button
2. Click "+ ADD"
3. Enter webhook name (e.g., "game_event")
4. Click "CREATE WEBHOOK"
5. Webhook ID generated
6. Use endpoint: `POST /webhook/{webhook_id}`

**Simulating Webhook (for testing):**
```javascript
// In console or test script
triggerWebhook('wh_123456', {
  event: 'player_action',
  playerId: 'P123',
  score: 500
});
```

**Real Implementation:**
In production, set up HTTP server:
```javascript
app.post('/webhook/:webhookId', (req, res) => {
  const { webhookId } = req.params;
  const data = req.body;

  // Trigger workflow with data
  triggerWorkflow(webhookId, data);

  res.json({ success: true });
});
```

---

### Database Integration

**Purpose:** Store workflow results permanently

**Supported Databases:**
- MongoDB
- PostgreSQL
- Firebase
- MySQL

**Setup:**
1. Click "DB" button
2. Click "+ ADD"
3. Select database type
4. Enter database name
5. Enter connection string
6. Click "CONNECT DATABASE"

**Connection Strings:**

**MongoDB:**
```
mongodb://username:password@host:27017/database
mongodb+srv://username:password@cluster.mongodb.net/database
```

**PostgreSQL:**
```
postgresql://username:password@host:5432/database
```

**Firebase:**
```
https://project-id.firebaseio.com
```

**MySQL:**
```
mysql://username:password@host:3306/database
```

**Using in Nodes:**
```javascript
// Check connections
console.log("Connected DBs:", db.connections.length);

// Save data
await db.save('executions', {
  id: Date.now(),
  data: data,
  timestamp: new Date()
});

// Query data
const results = await db.query('executions', {
  status: 'completed'
});
```

---

## API Reference

### Node Execution Context

Every node has access to these objects:

#### `data`
- **Type:** `any`
- **Description:** Output from previous connected node
- **Example:** `const input = data;`

#### `console`
- **Methods:**
  - `console.log(...args)` - Log to console panel
  - `console.error(...args)` - Log error to console
- **Example:** `console.log("Processing:", data);`

#### `axios`
- **Type:** Axios instance
- **Methods:** GET, POST, PUT, DELETE, etc.
- **Example:** `await axios.get('https://api.com')`

#### `vars`
- **Methods:**
  - `vars.set(key, value)` - Store variable
  - `vars.get(key)` - Retrieve variable
  - `vars.has(key)` - Check existence
  - `vars.delete(key)` - Remove variable
  - `vars.all()` - Get all variables

#### `db`
- **Methods:**
  - `db.save(collection, data)` - Save to database
  - `db.query(collection, filter)` - Query database
- **Properties:**
  - `db.connections` - Array of active connections

#### `loopData` (Loop nodes only)
- **Type:** `object`
- **Description:** Persistent state across loop iterations
- **Example:** `loopData.iteration = 0;`

### Return Values

**Standard Node:**
```javascript
return anyValue; // Passed to next node
```

**Condition Node:**
```javascript
return true;  // Routes to TRUE output
return false; // Routes to FALSE output
```

**Loop Node:**
```javascript
return {
  continue: true,  // Continue looping
  data: result,    // Data for next iteration
  loopData: state  // Preserved state
};

// Or to end loop:
return {
  continue: false,
  data: finalResult,
  loopData: state
};
```

---

## Use Cases

### 1. API Monitoring & Alerting

**Workflow:**
```
Scheduler (every 5 minutes)
  ↓
Health Check → [Response OK?]
                ├─ TRUE → Log Success → Store Metrics
                └─ FALSE → Send Alert → Log Error → Retry
```

**Node 1: Health Check**
```javascript
console.log("Checking API health...");

try {
  const start = Date.now();
  const response = await axios.get('https://your-api.com/health');
  const duration = Date.now() - start;

  vars.set('lastCheck', Date.now());
  vars.set('responseTime', duration);

  console.log(`✓ API healthy (${duration}ms)`);
  return response.status === 200;

} catch (error) {
  console.log("✗ API down:", error.message);
  return false;
}
```

**Node 2: Send Alert (FALSE path)**
```javascript
const lastCheck = vars.get('lastCheck');
const failCount = vars.get('apiFailures') || 0;

vars.set('apiFailures', failCount + 1);

await axios.post('https://alerts.com/notify', {
  service: 'API Monitor',
  status: 'DOWN',
  failureCount: failCount + 1,
  timestamp: new Date().toISOString()
});

console.log("🚨 Alert sent! Failures:", failCount + 1);
return { alerted: true, failures: failCount + 1 };
```

---

### 3. Data Pipeline Processing

**Workflow:**
```
Webhook Trigger
  ↓
Validate Data → [Valid?]
                 ├─ TRUE → Transform → Store DB → Send Confirmation
                 └─ FALSE → Log Error → Send Rejection
```

**Node 1: Webhook Trigger**
```javascript
console.log("Data received from webhook:", data);

// Store raw data
vars.set('rawWebhookData', data);

return data;
```

**Node 2: Validate**
```javascript
const required = ['id', 'type', 'payload'];
const hasAllFields = required.every(field => data && data[field]);

console.log("Validation:", hasAllFields ? "PASS" : "FAIL");
return hasAllFields;
```

**Node 3: Transform (TRUE path)**
```javascript
const transformed = {
  id: data.id,
  type: data.type.toUpperCase(),
  payload: JSON.parse(data.payload),
  processedAt: new Date().toISOString(),
  source: 'webhook'
};

vars.set('transformedData', transformed);
console.log("Data transformed:", transformed.id);

return transformed;
```

**Node 4: Store to DB**
```javascript
const result = await db.save('processed_data', data);

console.log("Saved to database:", result.id);

// Update metrics
const count = vars.get('processedCount') || 0;
vars.set('processedCount', count + 1);

return { saved: true, id: result.id };
```

---

### 4. Social Media Automation

**Workflow:**
```
Scheduler (every 2 hours)
  ↓
Fetch Content → Filter Quality → [Quality > 80?]
                                  ├─ TRUE → Post to Social → Track Engagement
                                  └─ FALSE → Discard → Log
```

**Node 1: Fetch Content**
```javascript
console.log("Fetching content...");

const response = await axios.get('https://content-api.com/latest');
const items = response.data.items;

console.log(`Found ${items.length} items`);
return items;
```

**Node 2: Filter Quality**
```javascript
const filtered = data.filter(item => {
  const qualityScore = calculateQuality(item);
  return qualityScore > 80;
});

function calculateQuality(item) {
  let score = 0;
  if (item.title.length > 10) score += 30;
  if (item.description.length > 50) score += 30;
  if (item.image) score += 20;
  if (item.tags.length > 2) score += 20;
  return score;
}

console.log(`Filtered: ${filtered.length} high quality`);
return filtered;
```

**Node 3: Post to Social**
```javascript
const posted = [];

for (const item of data) {
  const result = await axios.post('https://social-api.com/post', {
    content: item.title,
    description: item.description,
    image: item.image
  }, {
    headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
  });

  posted.push(result.data);
  console.log(`Posted: ${item.title}`);
}

vars.set('lastPosted', Date.now());
return { posted: posted.length };
```

---

### 5. E-commerce Order Processing

**Workflow:**
```
Webhook (New Order)
  ↓
Validate Order → Check Inventory → [In Stock?]
                                    ├─ TRUE → Process Payment → Ship → Confirm
                                    └─ FALSE → Backorder → Notify Customer
```

**Node 1: Validate Order**
```javascript
console.log("New order:", data.orderId);

const valid = data.items &&
              data.items.length > 0 &&
              data.customer &&
              data.paymentMethod;

if (valid) {
  vars.set(`order_${data.orderId}`, data);
  console.log("✓ Order valid");
} else {
  console.log("✗ Invalid order");
}

return valid;
```

**Node 2: Check Inventory**
```javascript
const order = data;
let allInStock = true;

for (const item of order.items) {
  const inventory = await axios.get(
    `https://inventory-api.com/check/${item.sku}`
  );

  if (inventory.data.quantity < item.quantity) {
    allInStock = false;
    console.log(`✗ Out of stock: ${item.sku}`);
  }
}

console.log(allInStock ? "✓ All items available" : "✗ Some items unavailable");
return allInStock;
```

**Node 3: Process Payment (TRUE path)**
```javascript
const order = vars.get(`order_${data.orderId}`);

const payment = await axios.post('https://payment-api.com/charge', {
  amount: order.total,
  currency: 'USD',
  paymentMethod: order.paymentMethod,
  orderId: order.orderId
});

if (payment.data.success) {
  console.log("✓ Payment successful:", payment.data.transactionId);

  await db.save('orders', {
    ...order,
    status: 'paid',
    transactionId: payment.data.transactionId,
    paidAt: new Date().toISOString()
  });

  return { success: true, transactionId: payment.data.transactionId };
} else {
  console.log("✗ Payment failed");
  return { success: false, error: payment.data.error };
}
```

---

## Troubleshooting

### Common Issues

#### 1. Node Not Executing

**Issues:** Node status stays "STANDBY", no console output

**Solutions:**
- Check if node is connected to workflow
- Verify previous node completes successfully
- Look for errors in console panel
- Check if scheduler is running (if using schedules)

#### 2. "Cannot read property of undefined"

**Issues:** Error in console about undefined property

**Solutions:**
```javascript
// ✓ Safe access
if (data && data.property) {
  console.log(data.property);
}

// ✓ Use optional chaining
console.log(data?.property?.nested);

// ✓ Provide defaults
const value = data?.property || 'default';
```

#### 3. Infinite Loop

**Issues:** Workflow never completes, same node executing repeatedly

**Solutions:**
```javascript
// Add iteration limit
if (!loopData.iteration) {
  loopData.iteration = 0;
}

loopData.iteration++;

if (loopData.iteration > 100) {
  console.log("Emergency stop - too many iterations");
  return { continue: false, data: null, loopData };
}
```

#### 4. Axios Request Fails

**Issues:** "Network Error" or "Request failed"

**Solutions:**
```javascript
try {
  const response = await axios.get(url, {
    timeout: 10000, // 10 second timeout
    headers: {
      'User-Agent': 'Mozilla/5.0...',
      'Accept': 'application/json'
    }
  });
  return response.data;
} catch (error) {
  if (error.response) {
    console.log("Server error:", error.response.status);
  } else if (error.request) {
    console.log("No response from server");
  } else {
    console.log("Request setup error:", error.message);
  }
  return { error: error.message };
}
```

#### 5. Variable Not Found

**Issues:** `vars.get()` returns undefined

**Solutions:**
```javascript
// Check if variable exists first
if (vars.has('myVariable')) {
  const value = vars.get('myVariable');
} else {
  console.log("Variable not found, using default");
  vars.set('myVariable', defaultValue);
}

// Or use default value
const value = vars.get('myVariable') || defaultValue;
```

#### 6. Database Connection Failed

**Issues:** "Connection refused" or "Authentication failed"

**Solutions:**
- Verify connection string format
- Check database credentials
- Ensure database is accessible (firewall, VPN)
- Test connection in database panel
- Check if database is running

#### 7. Webhook Not Triggering

**Issues:** Webhook created but workflow doesn't execute

**Solutions:**
- Verify webhook is enabled (green dot)
- Check webhook ID matches request
- Ensure POST request to correct endpoint
- Check webhook events panel for triggers
- Verify webhook is active (not disabled)

#### 8. Condition Node Not Routing

**Issues:** Both paths or neither path executes

**Solutions:**
```javascript
// Must return boolean
if (condition) {
  console.log("Taking TRUE path");
  return true;  // Explicit boolean
} else {
  console.log("Taking FALSE path");
  return false; // Explicit boolean
}

// ✗ Wrong - returns object
return { result: true }; // This won't work!
```

#### 9. Schedule Not Running

**Issues:** Schedule created but workflow doesn't execute

**Solutions:**
- Click "START" button in scheduler panel
- Check if workflow has errors (test with Execute first)
- Verify interval is reasonable (not too small)
- Check console for scheduler messages
- Ensure no nodes are in ERROR state

#### 10. Monaco Editor (Code Editor) Not Working

**Issues:** Can't edit code, editor doesn't appear

**Solutions:**
- Click maximize icon (⤢) to expand editor
- Ensure node is selected
- Check browser console for errors
- Try creating new node
- Refresh page if editor is frozen

---

## Workflow Examples

### Example 1: Data Sync Pipeline

```javascript
// Node 1: Fetch from Source
const source = await axios.get('https://source-api.com/data');
console.log(`Fetched ${source.data.length} records`);
return source.data;

// Node 2: Transform
const transformed = data.map(item => ({
  id: item.id,
  name: item.name.toUpperCase(),
  value: parseFloat(item.value),
  timestamp: new Date().toISOString()
}));
console.log(`Transformed ${transformed.length} records`);
return transformed;

// Node 3: Batch Save
for (const record of data) {
  await db.save('sync_data', record);
}
console.log(`Saved ${data.length} records`);

vars.set('lastSync', Date.now());
vars.set('syncCount', (vars.get('syncCount') || 0) + data.length);

return { synced: data.length };
```

---

## Advanced Pattern Usages to make life easier lel

### Pattern 1: Retry with Exponential Backoff

```javascript
if (!loopData.attempt) {
  loopData.attempt = 0;
  loopData.maxAttempts = 5;
}

loopData.attempt++;

try {
  const result = await axios.get('https://unstable-api.com');
  console.log("Success on attempt", loopData.attempt);
  return { continue: false, data: result.data, loopData };

} catch (error) {
  if (loopData.attempt >= loopData.maxAttempts) {
    console.log("Max attempts reached");
    return { continue: false, data: { error: "Failed" }, loopData };
  }

  const delay = Math.pow(2, loopData.attempt) * 1000;
  console.log(`Retry in ${delay}ms...`);

  await new Promise(resolve => setTimeout(resolve, delay));
  return { continue: true, data: null, loopData };
}
```

### Pattern 2: Fan-out / Fan-in

Create multiple parallel nodes that process different aspects, then combine:

```
Start → Split Data → [Process A]
                   → [Process B]  → Combine Results → End
                   → [Process C]
```

### Pattern 3: Circuit Breaker

```javascript
const failures = vars.get('apiFailures') || 0;
const lastFailure = vars.get('lastFailureTime') || 0;
const circuitOpen = vars.get('circuitOpen') || false;

// Reset after 60 seconds
if (circuitOpen && Date.now() - lastFailure > 60000) {
  vars.set('circuitOpen', false);
  vars.set('apiFailures', 0);
  console.log("Circuit breaker reset");
}

if (circuitOpen) {
  console.log("Circuit breaker open - skipping request");
  return { error: "Circuit breaker open" };
}

try {
  const result = await axios.get('https://api.com');
  vars.set('apiFailures', 0);
  return result.data;

} catch (error) {
  vars.set('apiFailures', failures + 1);
  vars.set('lastFailureTime', Date.now());

  if (failures + 1 >= 3) {
    vars.set('circuitOpen', true);
    console.log("Circuit breaker opened!");
  }

  return { error: error.message };
}
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Delete** | Delete selected node/edge |
| **Ctrl/Cmd + S** | Save workflow |
| **Ctrl/Cmd + Z** | Undo (in Monaco editor) |
| **Ctrl/Cmd + F** | Find in editor |
| **Ctrl/Cmd + /** | Comment/uncomment code |
| **Tab** | Indent code |
| **Shift + Tab** | Outdent code |

---

## Personal Considerations

1. **Don't hardcode secrets if you intend to share your workflows**
   ```javascript
   // ✗ Bad
   const apiKey = "sk_live_abc123";

   // ✓ Good - use variables
   const apiKey = vars.get('apiKey');
   ```

2. **Validate all external data**
   ```javascript
   if (!data || typeof data !== 'object') {
     return { error: "Invalid data" };
   }
   ```

3. **Rate limit API calls (in case you're using webhook)**
   ```javascript
   const lastCall = vars.get('lastApiCall') || 0;
   if (Date.now() - lastCall < 1000) {
     return { error: "Rate limited" };
   }
   ```

4. **Sanitize database queries**
   ```javascript
   // Validate input before querying
   if (!/^[a-zA-Z0-9_]+$/.test(userId)) {
     return { error: "Invalid user ID" };
   }
   ```

---

## Additional Resources (For potential contributors or forkers)

- **React Flow Docs:** https://reactflow.dev
- **Axios Docs:** https://axios-http.com
- **Monaco Editor:** https://microsoft.github.io/monaco-editor
- **Tailwind CSS:** https://tailwindcss.com

---

## License

Creative Commons Attribution-NonCommercial 4.0 International

---

## Support

For issues or questions:
1. Check Troubleshooting section
2. Review examples
3. Test with simple workflow first
4. Check browser console for errors
5. And contribution is welcome.

---

![Version](https://img.shields.io/badge/Version-4.4.0-ffff00?style=for-the-badge&logo=git&logoColor=00ff00&labelColor=000000)

![Version](https://img.shields.io/badge/Last%20Updated-31%20October%202025-ffff00?style=for-the-badge&logo=git&logoColor=00ff00&labelColor=000000)
