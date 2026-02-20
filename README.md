# WhatsApp Agent v2.0

**Production-ready desktop application for Linux that runs a WhatsApp AI agent powered by Gemini.**

A fully local, independent desktop control panel for automated WhatsApp message handling using Google's Gemini AI. Everything runs on your machine—no cloud dependence.

## Features

✨ **Core Features:**
- 🤖 Full GUI with dark theme (Material Design 3)
- 🔧 Configuration wizard on first run
- 💾 Persistent storage (JSON-based)
- 📊 Live log streaming with color coding
- 👨‍💼 Operator intervention panel
- ✏️ System instruction editor with hot reload
- 🔄 Graceful restart capability
- 🌐 QR-based WhatsApp Web authentication
- 📱 Group and private message support
- ⌨️ Typing simulation
- 🧠 Message history & learning profiles

## System Requirements

- **OS:** Linux (Ubuntu 20.04+, Debian 11+, or similar)
- **Node.js:** v16+ (18+ recommended)
- **RAM:** 2GB minimum, 4GB+ recommended
- **Browser:** Chrome, Chromium, or Brave (auto-detected)
- **Internet:** Required for Gemini API

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/kebapcore/whatsapp-agent.git
cd whatsapp-agent
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Click "Get API Key"
3. Create a new API key for free
4. Keep this key safe (you'll need it during setup)

### 4. Configure App Data Directory

The app stores config and data in `~/.whatsapp-agent/`:

```bash
mkdir -p ~/.whatsapp-agent
```

## Running the Application

### Development Mode

```bash
npm start
```

This launches:
- Vite dev server (http://localhost:5173)
- Electron main process

### Production Build

```bash
npm run build
npm run dist:linux
```

Generates:
- `dist/` - Built web assets
- `.out/` - Linux AppImage and .deb installers

## First Run Setup

When you launch the app for the first time:

1. **Configuration Wizard** appears
2. Select browser and puppeteer settings
3. Configure message handling behavior
4. Enter Gemini API key
5. Set operator escalation rules
6. Choose storage options
7. Review and save

Once saved, you'll see the **QR Login Screen**.

### QR Code Login

1. A large QR code appears in the center
2. Open WhatsApp on your phone
3. Scan the QR with "Link a device"
4. Approve on your phone
5. App automatically transitions to dashboard

## Dashboard

### Sections

**Dashboard Tab:**
- System status (connection, session, memory)
- Agent control buttons (Restart, Reconnect, Clear)
- Operator intervention panel (when needed)

**Live Logs Tab:**
- Real-time event stream
- Color-coded by level (error, warning, success, info, debug)
- Source and timestamp for each event

**System Instructions Tab:**
- Full text editor for Gemini system prompt
- Save and reload options
- Reset to default
- Changes take effect immediately

### Control Buttons

- **Restart Agent** - Restarts WhatsApp session
- **Reconnect WhatsApp** - Attempts reconnection
- **Clear Logs** - Clears log panel
- **Reload Config** - Reloads configuration from disk

## Configuration Files

### Location

All files stored in `~/.whatsapp-agent/`:

```
~/.whatsapp-agent/
├── config.json          # Main configuration
├── gemini.txt           # System instructions
├── history.json         # Message history
└── session/             # WhatsApp Web session
```

### config.json Structure

```json
{
  "browser": {
    "type": "chrome",
    "headless": true,
    "sandbox": false,
    "performanceMode": true
  },
  "gemini": {
    "apiKey": "sk-...",
    "model": "gemini-2.5-flash",
    "temperature": 0.7,
    "groundingSearch": false
  },
  "messageHandling": {
    "autoReplyEnabled": true,
    "typingSimulation": true,
    "groupHandling": "mention_only"
  },
  "storage": {
    "historyLimit": 100
  }
}
```

## Architecture

### Backend Services

```
src/backend/
├── config-manager.js       # Config loading/saving
├── history-manager.js      # Message history & stats
├── gemini-service.js       # Gemini API client
├── whatsapp-service.js     # WhatsApp Web wrapper
└── message-processor.js    # Message logic & routing
```

### Renderer (UI)

```
src/renderer/
├── views/
│   ├── ConfigWizard.jsx    # Setup wizard
│   └── Dashboard.jsx        # Main interface
├── components/
│   ├── LiveLog.jsx         # Log viewer
│   ├── OperatorPanel.jsx   # Human intervention
│   ├── SystemStatusPanel   # Status display
│   └── SystemInstructionsEditor.jsx
└── theme/
    └── darkTheme.js        # Material Design 3 theme
```

### Main Process

```
src/main/
├── index.js               # Electron main
└── ../preload.js          # Secure IPC bridge
```

## Usage Examples

### Auto-respond to all messages

In **System Instructions**, set message behavior to "respond to all". Agent will answer every private and group message.

### Manual override mode

Use the **Operator Panel** when Gemini requests help. Your response gets sent and logged.

### Custom system prompt

Edit **System Instructions** tab to customize AI personality, response style, or behavior rules.

### Monitor agent activity

**Live Logs** show every action:
- Incoming messages
- Gemini processing
- Typing indicators
- Message sends
- Errors

### Restart after configuration

Click "Restart Agent" to reload config without restarting app.

## Troubleshooting

### QR Code Not Appearing

```bash
# Check logs, then:
npm start
# Look for WhatsApp initialization errors
```

### Browser Not Found

1. Ensure Chrome/Chromium installed: `apt install chromium-browser`
2. Or install Chrome from Google
3. Use custom browser path in config

### Gemini API Errors

```
Invalid API Key → Check key in config
Rate Limited → Reduce message frequency
Timeout → Check internet connection
```

### WhatsApp Session Lost

Click "Reconnect WhatsApp" or scan QR again.

### Memory Usage Growing

Message history limit in config (default: 100). Reduce if needed.

## Production Deployment

### For Single Machine

```bash
npm run dist:linux
# Creates installable .deb and AppImage
sudo dpkg -i dist/WhatsApp-Agent-2.0.0.deb
```

### Running as Systemd Service

Create `/etc/systemd/system/whatsapp-agent.service`:

```ini
[Unit]
Description=WhatsApp AI Agent
After=network.target

[Service]
Type=simple
User=your-user
ExecStart=/opt/whatsapp-agent/WhatsApp-Agent
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable whatsapp-agent
sudo systemctl start whatsapp-agent
```

## API Reference

### IPC Handlers (Main Process)

All Electron IPC calls exposed via `window.electron`:

```javascript
// Configuration
await window.electron.saveConfig(config)
await window.electron.checkConfigExists()

// WhatsApp
await window.electron.startWhatsApp()
await window.electron.restartWhatsApp()
await window.electron.getQRCode()
await window.electron.isWhatsAppReady()
await window.electron.getWhatsAppStatus()

// Messages
await window.electron.sendOperatorResponse(response)

// System Instructions
await window.electron.getSystemInstructions()
await window.electron.saveSystemInstructions(text)
await window.electron.getDefaultSystemInstructions()

// Logs
await window.electron.clearLogs()
window.electron.onNewLog(callback)

// History
await window.electron.getRecentHistory(limit)
await window.electron.clearHistory()
```

## Development

### Project Structure

```
whatsapp-agent/
├── src/
│   ├── main/          # Electron main process
│   ├── backend/       # Node.js services
│   ├── renderer/      # React UI
│   └── preload.js     # IPC bridge
├── public/            # Static assets
├── dist/              # Built renderer
├── package.json
├── vite.config.js
└── README.md
```

### Scripts

```bash
npm start              # Dev mode (Vite + Electron)
npm run dev            # Vite dev server only
npm run electron       # Electron only
npm run electron-dev   # Nodemon + Electron
npm run build          # Build renderer
npm run dist:linux     # Full Linux build
npm run lint           # ESLint check
npm run format         # Prettier format
```

### Code Style

- **ESLint** for linting
- **Prettier** for formatting
- **React 18** with hooks
- **Material-UI v5** components

### Adding Features

1. Backend service → `src/backend/`
2. IPC handler → `src/main/index.js`
3. Preload method → `src/preload.js`
4. React component → `src/renderer/`

## Security Notes

⚠️ **Important:**

- API key stored locally in `~/.whatsapp-agent/config.json`
- Never commit config.json to version control
- Each machine has its own WhatsApp session
- All data stored locally—no cloud sync
- Sandbox enabled for browser rendering

## License

MIT License - See LICENSE file

## Support

For issues, feature requests, or contributions:

1. Check existing issues
2. Provide logs from **Live Logs** tab
3. Include system info (OS, Node version, browser)

## Changelog

### v2.0.0 (Current)

- Complete rewrite with Electron + React
- Material Design 3 dark theme
- Full configuration wizard
- Live log streaming
- System instruction editor
- Operator intervention panel
- Production-ready build system
- Linux AppImage/DEB distribution

---

**Made with ❤️ for WhatsApp automation**
