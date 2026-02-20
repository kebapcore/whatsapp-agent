# WhatsApp Agent - Architecture Documentation

Complete technical architecture and design patterns.

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    WHATSAPP AGENT v2.0                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 ELECTRON MAIN PROCESS                │  │
│  │  Bootstrap, Window Management, IPC Routing           │  │
│  │  (/src/main/index.js)                               │  │
│  └──────────────────────────────────────────────────────┘  │
│              ▲                                   ▲           │
│              │ IPC                              │ IPC       │
│              ▼                                   ▼           │
│  ┌──────────────────────┐        ┌──────────────────────┐  │
│  │  ELECTRON PRELOAD    │        │   REACT RENDERER     │  │
│  │  (IPC Bridge)        │        │   (UI Components)    │  │
│  │  (/src/preload.js)   │        │   (/src/renderer/)   │  │
│  └──────────────────────┘        └──────────────────────┘  │
│                                           ▲                 │
│                                           │                 │
│                    ┌──────────────────────┘                 │
│                    │                                        │
│                    ▼                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              BACKEND SERVICES LAYER                  │  │
│  │                                                      │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │ Config Manager                              │   │  │
│  │  │ - Load/save configuration                  │   │  │
│  │  │ - Manage system instructions               │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │                                                      │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │ WhatsApp Service                            │   │  │
│  │  │ - Browser automation (puppeteer)            │   │  │
│  │  │ - Session management                        │   │  │
│  │  │ - Message sending/receiving                 │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │                                                      │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │ Gemini Service                              │   │  │
│  │  │ - API communication                         │   │  │
│  │  │ - Prompt engineering                        │   │  │
│  │  │ - Response parsing                          │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │                                                      │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │ History Manager                             │   │  │
│  │  │ - Message storage (JSON)                    │   │  │
│  │  │ - Context building                          │   │  │
│  │  │ - Memory rotation                           │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │                                                      │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │ Message Processor                           │   │  │
│  │  │ - Route messages                            │   │  │
│  │  │ - Decide action (reply/ignore/operator)     │   │  │
│  │  │ - Handle responses                          │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ▲                                 │
│                          │ Logging                         │
│                          ▼                                 │
│                    ┌──────────────┐                        │
│                    │   Log Stream │                        │
│                    │ (to UI)      │                        │
│                    └──────────────┘                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer Architecture

### 1. Presentation Layer (React)

**Location:** `/src/renderer/`

**Responsibilities:**
- User interface rendering
- Event handling
- Form submission
- Real-time updates

**Key Files:**
- `App.jsx` - Root component
- `views/ConfigWizard.jsx` - Setup wizard
- `views/Dashboard.jsx` - Main interface
- `components/` - UI components
- `theme/darkTheme.js` - Material Design

**Technology:**
- React 18 (hooks)
- Material-UI v5
- Vite (bundler)

---

### 2. IPC Bridge Layer

**Location:** `/src/preload.js`

**Responsibilities:**
- Expose safe APIs to renderer
- Route calls to main process
- Handle responses

**Pattern:**
```javascript
contextBridge.exposeInMainWorld('electron', {
    configWizard: () => ipcRenderer.invoke('app:init-config-wizard'),
    startWhatsApp: () => ipcRenderer.invoke('whatsapp:start'),
    // ... more APIs
});
```

**Ensures:** Renderer cannot access Node.js directly (security)

---

### 3. Main Process Layer (Electron)

**Location:** `/src/main/index.js`

**Responsibilities:**
- Window creation/management
- IPC handler setup
- Service initialization
- Graceful shutdown

**Lifecycle:**
1. App starts → create window
2. Preload injects electron API
3. Renderer loads → requests config
4. Main process initializes services
5. Services run in background
6. IPC calls route to handlers
7. Results sent back to renderer

---

### 4. Backend Services Layer

#### 4.1 Config Manager

**File:** `/src/backend/config-manager.js`

**Paths:**
- Config: `~/.whatsapp-agent/config.json`
- Instructions: `~/.whatsapp-agent/gemini.txt`

**Methods:**
```javascript
ConfigManager.getConfig()           // Load config
ConfigManager.saveConfig(config)    // Save config
ConfigManager.getSystemInstructions() // Load AI prompt
ConfigManager.saveSystemInstructions(text) // Save prompt
ConfigManager.resetToDefault()      // Factory reset
ConfigManager.getDetectedBrowsers() // Auto-detect browsers
```

**Data Structure:**
```json
{
  "browser": { type, chromiumPath, headless, sandbox },
  "gemini": { apiKey, model, temperature, groundingSearch },
  "messageHandling": { autoReplyEnabled, typingSimulation, ... },
  "operatorEscalation": { requestHelpWhenNeeded, ... },
  "storage": { historyLimit, attachmentStorage }
}
```

#### 4.2 WhatsApp Service

**File:** `/src/backend/whatsapp-service.js`

**Core Class:** `WhatsAppService`

**Lifecycle:**
```
constructor → initialize() → on('qr') → on('ready') → listening
```

**Key Methods:**
```javascript
await service.initialize()        // Start WhatsApp
await service.sendMessage(id)     // Send message
await service.setTyping(id)       // Typing indicator
await service.logout()            // Close session
service.onMessage(callback)       // Listen for messages
service.getQRCode()               // Get QR for login
service.getStatus()               // Current status
```

**Puppeteer Args:**
```javascript
[
  '--no-sandbox',                 // Allow in dev/isolated env
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',      // Fix memory issues
  '--disable-gpu',                // No GPU needed for browser
  '--user-data-dir=/tmp/...'      // Temp session dir
]
```

#### 4.3 Gemini Service

**File:** `/src/backend/gemini-service.js`

**Core Class:** `GeminiService`

**Initialization:**
```javascript
new GeminiService(apiKey, model, systemInstructions)
```

**Key Methods:**
```javascript
await service.generateResponse(context, config) // Get AI response
service.updateSystemInstructions(text)          // Change prompt
service.setApiKey(key)                          // Change API key
service.isConfigured()                          // Validate setup
```

**API Interaction:**
```
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent

{
  system_instruction: { parts: [{ text: prompt }] },
  contents: [{ role: 'user', parts: [{ text: context }] }],
  generationConfig: { response_mime_type: 'application/json' }
}
```

**Response Format (Expected):**
```json
{
  "action": "reply"|"ignore"|"operator",
  "target_message_id": "msg_id_or_null",
  "content": "Message text",
  "thought_process": "Brief reasoning"
}
```

#### 4.4 History Manager

**File:** `/src/backend/history-manager.js`

**Storage:** `~/.whatsapp-agent/history.json`

**Key Methods:**
```javascript
manager.addMessage(msg)          // Record incoming/outgoing
manager.getRecent(count)         // Get last N messages
manager.buildContextString()     // Format for Gemini
manager.getStatistics()          // Sender stats
manager.clear()                  // Empty history
manager.exportToJSON()           // Backup
manager.exportToCSV()            // Export data
```

**Message Entry Structure:**
```javascript
{
  messageId: "msg_id",
  timestamp: "2024-01-01T12:34:56Z",
  senderId: "user_id",
  senderName: "John",
  isGroup: false,
  chatName: "Private",
  content: "Message text",
  isReply: false,
  replyContext: null,
  aiResponse: "Bot response",
  attachments: []
}
```

**Memory Rotation:**
- Stores up to `historyLimit` messages (default: 100)
- When full: oldest message removed (FIFO)
- Prevents unbounded memory usage

#### 4.5 Message Processor

**File:** `/src/backend/message-processor.js`

**Core Class:** `MessageProcessor`

**Workflow:**
```
Message received
    ↓
shouldProcess() check (config rules)
    ↓
buildContextString() from history
    ↓
gemini.generateResponse(context)
    ↓
Parse action
    ├─ reply: sendMessage()
    ├─ ignore: log and continue
    └─ operator: request human input
    ↓
addToHistory()
```

**Key Methods:**
```javascript
await processor.processMessage(inputData, config)  // Handle one message
processor.shouldProcess(inputData, config)         // Check if should reply
processor.setOperatorResponse(response)            // Receive human input
processor.extractProfiles()                        // Build sender stats
```

---

## Data Flow Patterns

### Pattern 1: Configuration Setup

```
User Input (Wizard)
    ↓ [IPC: saveConfig]
Main Process Handler
    ↓
ConfigManager.saveConfig()
    ↓
Write ~/.whatsapp-agent/config.json
    ↓
Initialize Services
    ├─ WhatsAppService
    ├─ GeminiService
    └─ HistoryManager
    ↓
Return success to renderer
    ↓
Renderer shows QR code
```

### Pattern 2: Message Handling

```
User sends message in WhatsApp
    ↓
whatsapp-web.js detects
    ↓
WhatsAppService.onMessage()
    ↓
Message data → MessageProcessor
    ↓
shouldProcess() → true?
    ├─ No: log, quit
    └─ Yes: continue
    ↓
HistoryManager.buildContextString()
    ↓
GeminiService.generateResponse()
    ↓ POST to API
Gemini API response
    ↓
Parse JSON response
    ↓
Action == "reply"?
    ├─ Yes: WhatsAppService.sendMessage()
    ├─ No (ignore): log only
    └─ No (operator): push to UI
    ↓
HistoryManager.addMessage() → save
    ↓
Send log to renderer [IPC]
    ↓
Renderer updates Live Logs
```

### Pattern 3: System Instruction Edit

```
User edits in UI
    ↓ [IPC: saveSystemInstructions]
Main Handler
    ↓
ConfigManager.saveSystemInstructions()
    ↓
Write ~/whatsapp-agent/gemini.txt
    ↓
GeminiService.updateSystemInstructions()
    ↓
Next Gemini call uses new prompt
    ↓
Send log: "Instructions updated"
    ↓
Renderer shows success message
```

---

## File Organization Rationale

```
src/
├── main/                   # Electron entry point
│   └── index.js            # Window setup, IPC routing
│
├── preload.js              # IPC bridge (security layer)
│
├── backend/                # Business logic (no UI dependency)
│   ├── config-manager.js   # Configuration I/O
│   ├── whatsapp-service.js # Browser automation
│   ├── gemini-service.js   # AI API calls
│   ├── history-manager.js  # Data persistence
│   └── message-processor.js # Message logic
│
└── renderer/               # React UI (no Node API direct access)
    ├── App.jsx             # Root component
    ├── views/              # Full-page components
    │   ├── ConfigWizard.jsx
    │   └── Dashboard.jsx
    ├── components/         # Reusable UI pieces
    │   ├── LiveLog.jsx
    │   ├── OperatorPanel.jsx
    │   ├── QRCode.jsx
    │   └── ...
    └── theme/              # Styling
        └── darkTheme.js
```

**Why this structure?**

1. **Separation of Concerns** - Each layer has single responsibility
2. **Testability** - Backend services don't depend on React
3. **Security** - Renderer can't access filesystem directly
4. **Scalability** - Easy to add features without touching other layers
5. **Maintainability** - Clear boundaries between domains

---

## Security Model

### Isolation Layers

```
┌─────────────────────────────────────────┐
│  Renderer (React)                       │
│  ❌ No Node.js access                   │
│  ❌ No fs module                        │
│  ❌ No process access                   │
│  ✅ Can only call exposed APIs          │
└────────────────┬────────────────────────┘
                 │ Preload (Bridge)
                 │ ✅ Controlled API list
                 │ ✅ Type checking
                 │ ✅ Validation
                 ▼
┌─────────────────────────────────────────┐
│  Main Process (Electron + Node.js)      │
│  ✅ Full system access                  │
│  ✅ File I/O                            │
│  ✅ Process management                  │
│  ⚠️  Must validate all IPC input        │
└─────────────────────────────────────────┘
```

### Best Practices Implemented

1. **contextIsolation: true** - APIs sandboxed
2. **nodeIntegration: false** - No Node in renderer
3. **sandbox: true** - Extra process sandbox (configurable)
4. **preload script** - Only whitelist needed APIs
5. **Input validation** - Check IPC data on main
6. **No eval()** - No dynamic code execution
7. **HTTPS only** - External API calls

---

## Extension Points

### Adding a New Backend Service

1. Create `/src/backend/new-service.js`:
```javascript
class NewService {
    constructor(config) { this.config = config; }
    async initialize() { /* setup */ }
    async method() { /* functionality */ }
}
module.exports = { NewService };
```

2. Import in main: `const { NewService } = require('../backend/new-service');`

3. Add IPC handler:
```javascript
ipcMain.handle('service:method', async (event, arg) => {
    return await newService.method(arg);
});
```

4. Expose in preload:
```javascript
contextBridge.exposeInMainWorld('electron', {
    serviceMethod: (arg) => ipcRenderer.invoke('service:method', arg)
});
```

5. Use in React:
```javascript
const result = await window.electron.serviceMethod(arg);
```

### Adding a New UI Component

1. Create `/src/renderer/components/MyComponent.jsx`
2. Import in views where needed
3. Pass props from parent
4. Call `window.electron.*` methods for backend

### Customizing the AI Behavior

1. **System Instructions** - Edit prompt in app UI
2. **Temperature** - Edit in config.json
3. **Model** - Change in config.json (gemini-2.5-flash, etc)
4. **Grounding** - Enable Google Search in config

---

## Performance Considerations

### Memory

- History manager limits to 100 messages (configurable)
- Older messages automatically deleted
- Logs kept in memory (last 200)
- Log array rotation prevents unbounded growth

### CPU

- Puppeteer headless mode saves 15-20%
- Disable images/plugins saves 10-15%
- Gemini API calls throttled by rate limits
- Typing simulation uses minimal CPU

### Network

- Only API calls are to Gemini (few per minute)
- WhatsApp Web uses WebSocket (persistent connection)
- Typical usage: < 1MB/day
- Offline capable for local processing

### Storage

- Config: < 1KB
- History (100 messages): < 50KB typically
- WhatsApp session: ~ 5-10MB
- Total: ~ 15-20MB per installation

---

## Error Handling Strategy

### Graceful Degradation

```
Critical Error
    ↓
Log to console & UI
    ↓
Try to recover?
    ├─ Yes: Retry with backoff
    └─ No: Escalate to operator
    ↓
If unrecoverable: graceful shutdown
```

### Error Categories

**Configuration Errors** (non-recoverable)
- Missing API key → Show wizard
- Invalid path → Ask user
- Bad JSON → Load defaults

**Runtime Errors** (potentially recoverable)
- Network timeout → Retry after 30s
- Rate limit → Back off exponentially
- Session lost → Reconnect with QR

**Fatal Errors** (shutdown required)
- Uncaught exception → Log, exit
- Corrupted data → Delete, reset
- Browser crash → Clear session, restart

---

## Testing Strategy

### Unit Tests

Would test individual services:
- `ConfigManager.saveConfig()` → writes correct JSON
- `GeminiService.generateResponse()` → parses API response
- `HistoryManager.addMessage()` → rotates correctly

### Integration Tests

Would test service interactions:
- Config → WhatsApp → initialization
- Message received → Gemini → response sent

### E2E Tests

Would test full workflows:
- User goes through wizard → logs in → sends messages

### Current

No tests included - add with:
```bash
npm install --save-dev jest @testing-library/react
```

---

## Deployment Considerations

### Single Machine
- zip up `/src/` and `/package.json`
- Run `npm install && npm start`
- Config stored per-user in `~/.whatsapp-agent/`

### Multiple Machines
- Can't shared WhatsApp session
- Each needs separate login
- Different API keys possible

### Linux Server (Headless)
- Run with headless=true in config
- Use systemd service for auto-start
- Monitor with `systemctl status whatsapp-agent`
- Logs accessible via Live Logs tab

### Container (Docker)
- Would need display server for Puppeteer
- Or run headless with special sauce
- Volume-mount `~/.whatsapp-agent/` for persistence

---

## Future Improvements

Potential enhancements to architecture:

1. **Database Layer** - Replace JSON with SQLite
2. **Message Queue** - Add Bull/Bee-Queue for reliability
3. **Plugin System** - Allow third-party services
4. **Clustering** - Run multiple agents coordinated
5. **Webhook Integration** - Send events to external systems
6. **Error Tracking** - Sentry integration
7. **Metrics** - Prometheus-style monitoring
8. **Caching** - Redis for conversation context

---

## References

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev)
- [Material-UI Components](https://mui.com/material-ui)
- [whatsapp-web.js](https://github.com/pedrosans/whatsapp-web.js)
- [Gemini API](https://ai.google.dev)

---

**Architecture designed for clarity, maintainability, and extensibility.**
