# WhatsApp Agent - Complete Installation Guide

This guide covers everything needed to get WhatsApp Agent running on Linux.

## Quick Start (5 minutes)

```bash
# 1. Clone repo
git clone https://github.com/kebapcore/whatsapp-agent.git
cd whatsapp-agent

# 2. Install dependencies
npm install

# 3. Get API key from https://aistudio.google.com

# 4. Start app
npm start

# 5. Follow configuration wizard
```

---

## Prerequisites

### System Requirements

- **Linux OS**: Ubuntu 20.04+, Debian 11+, or similar distribution
- **RAM**: 2GB minimum, 4GB+ recommended
- **Storage**: 500MB free space
- **Internet**: Required for Gemini API

### Software Requirements

#### Node.js & npm

Check your versions:

```bash
node --version    # Should be v16+ (18+ recommended)
npm --version     # Should be v8+
```

**Install Node.js:**

```bash
# Using apt (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

#### Browser (Chrome/Chromium)

WhatsApp Web requires a Chromium-based browser:

```bash
# Ubuntu/Debian
sudo apt-get install -y chromium-browser

# Or install Google Chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
```

Verify installation:

```bash
chromium-browser --version
# or
google-chrome --version
```

#### Git (Optional, for cloning)

```bash
sudo apt-get install -y git
```

---

## Installation Steps

### Step 1: Clone Repository

```bash
git clone https://github.com/kebapcore/whatsapp-agent.git
cd whatsapp-agent
```

Or download as ZIP and extract:

```bash
cd whatsapp-agent-main
```

### Step 2: Install NPM Dependencies

```bash
npm install
```

This installs:
- Electron (desktop framework)
- React 18 (UI)
- Material-UI (component library)
- whatsapp-web.js (WhatsApp automation)
- vite (build tool)
- And many more...

**Installation time:** 3-5 minutes depending on internet speed

**If you encounter errors:**

```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install

# If still failing, check Node version
node --version  # Must be v16+
```

### Step 3: Get Gemini API Key

1. Open https://aistudio.google.com in your browser
2. Sign in with your Google account
3. Click "Get API Key" button
4. Create a new API key for free
5. Copy the API key (you'll need this)

**Keep this key secure!** Don't commit it to git.

### Step 4: Prepare Config Directory

```bash
mkdir -p ~/.whatsapp-agent
chmod 700 ~/.whatsapp-agent
```

This creates the directory where app stores configs, history, and session data.

---

## Running the Application

### Development Mode (Recommended for First Time)

```bash
npm start
```

This does:
1. Starts Vite dev server on http://localhost:5173
2. Launches Electron window
3. Shows DevTools for debugging

**Expected output:**

```
> npm start

> whatsapp-ai-agent@2.0.0 start
> concurrently "npm run electron" "npm run dev"

[0] > npm run dev
[0] > vite
[0]
[0]   VITE v4.5.0  ready in 123 ms
[0]
[0]   ➜  local:   http://localhost:5173/
[0]   ➜  press h to show help
[1] > npm run electron
[1] > electron .
```

Then Electron window opens with the app.

### First Run Setup

1. **Configuration Wizard** appears
2. Select your browser (Chrome/Chromium)
3. Adjust puppeteer settings (most defaults are fine)
4. Select message handling preferences
5. **Paste your Gemini API key** here
6. Confirm other settings
7. Click "Save & Continue"

### QR Code Login

After configuration:

1. Large QR code appears
2. On your phone, open WhatsApp
3. Go to Settings → Linked Devices
4. Choose "Link a device"
5. Scan the QR code with your phone
6. Confirm on your phone
7. App automatically connects

**The app is now ready to use!**

---

## Production Build

### Build for Distribution

```bash
# 1. Build React UI
npm run build

# 2. Create Linux packages
npm run dist:linux

# Output files:
# - dist/WhatsApp-Agent-2.0.0.AppImage
# - dist/WhatsApp-Agent-2.0.0.deb
```

### Install from DEB Package

```bash
# On the built system
sudo dpkg -i WhatsApp-Agent-2.0.0.deb

# Or use apt
sudo apt install ./WhatsApp-Agent-2.0.0.deb

# Run
whatsapp-agent
```

### Run AppImage

```bash
chmod +x WhatsApp-Agent-2.0.0.AppImage
./WhatsApp-Agent-2.0.0.AppImage
```

---

## Usage Guide

### Main Dashboard

Three tabs available:

#### 1. Dashboard Tab
- System status display
- Agent control buttons
- Operator intervention panel (if needed)

#### 2. Live Logs Tab
- Real-time event stream
- Color-coded by severity
- Searchable

#### 3. System Instructions Tab
- Edit AI behavior
- Hot-reload after save
- Reset to defaults

### Configuration Files

All stored in `~/.whatsapp-agent/`:

```
config.json          - Main settings
gemini.txt           - System instructions
history.json         - Message history (auto-managed)
session/             - WhatsApp Web session data
```

### Configuration Editor

Edit `~/.whatsapp-agent/config.json` for advanced settings:

```json
{
  "browser": {
    "type": "chrome",
    "headless": true,
    "sandbox": false
  },
  "gemini": {
    "apiKey": "YOUR_KEY",
    "model": "gemini-2.5-flash",
    "temperature": 0.7
  },
  "messageHandling": {
    "autoReplyEnabled": true,
    "groupHandling": "mention_only"
  }
}
```

---

## Troubleshooting

### Issue: QR Code Not Appearing

**Symptoms:** App shows "Initializing..." but no QR code

**Solution:**

```bash
# Kill any leftover chrome processes
pkill -9 chrome
pkill -9 chromium

# Clear WhatsApp session
rm -rf ~/.whatsapp-agent/session

# Restart
npm start
```

### Issue: "Browser not found"

**Symptoms:** Error about Chrome/Chromium not installed

**Solution:**

```bash
# Install Chromium
sudo apt-get install chromium-browser

# Or Chrome
sudo apt-get install google-chrome-stable

# Update config to use correct path
# Edit ~/.whatsapp-agent/config.json:
{
  "browser": {
    "type": "custom",
    "chromiumPath": "/usr/bin/google-chrome"
  }
}
```

### Issue: "Invalid Gemini API key"

**Symptoms:** Gemini requests fail immediately

**Solution:**

1. Check API key is correct
2. Ensure spaces/newlines removed
3. Generate new key from aistudio.google.com
4. Update in config

### Issue: Memory usage growing

**Solution:**

1. Reduce history limit in config:

```json
{
  "storage": {
    "historyLimit": 50
  }
}
```

2. Clear history from dashboard

### Issue: WhatsApp session lost

**Solutions:**

1. Click "Reconnect WhatsApp"
2. Or "Restart Agent"
3. In extreme cases, clear session:

```bash
rm -rf ~/.whatsapp-agent/session
# Then restart app and rescan QR
```

### Issue: App crashes on startup

**Solutions:**

```bash
# Check logs
npm start 2>&1 | tee app.log

# Clear old data
rm -rf ~/.whatsapp-agent/session

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try again
npm start
```

---

## Advanced Configuration

### Custom System Prompt

Edit the **System Instructions** tab in the app, or edit `~/.whatsapp-agent/gemini.txt` directly.

### Headless Mode (No Browser Window)

In `~/.whatsapp-agent/config.json`:

```json
{
  "browser": {
    "headless": true
  }
}
```

### Group Message Handling

Options in `config.json`:

```json
{
  "messageHandling": {
    "groupHandling": "always" | "mention_only" | "ignore"
  }
}
```

### Temperature Tuning

Lower = more deterministic, Higher = more creative:

```json
{
  "gemini": {
    "temperature": 0.7
  }
}
```

### History Limit

Store fewer messages to save memory:

```json
{
  "storage": {
    "historyLimit": 50
  }
}
```

---

## Common Commands

```bash
# Start development
npm start

# Just UI dev server
npm run dev

# Just Electron
npm run electron

# Build for production
npm run build

# Create installers
npm run dist:linux

# Code formatting
npm run format

# Linting
npm run lint
```

---

## Uninstallation

### If installed via DEB

```bash
sudo dpkg -r whatsapp-agent
```

### If built locally

```bash
# Just delete the folder
rm -rf ~/whatsapp-agent

# And remove data
rm -rf ~/.whatsapp-agent
```

---

## System Service (Optional)

Run as background systemd service:

### Create Service File

Save as `/etc/systemd/system/whatsapp-agent.service`:

```ini
[Unit]
Description=WhatsApp AI Agent
After=network.target

[Service]
Type=simple
User=your-username
ExecStart=/opt/whatsapp-agent/WhatsApp-Agent
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Enable and Start

```bash
sudo systemctl daemon-reload
sudo systemctl enable whatsapp-agent
sudo systemctl start whatsapp-agent
sudo systemctl status whatsapp-agent
```

---

## Performance Tips

1. **Use headless mode** for 20% better performance
2. **Reduce history limit** if memory is constrained
3. **Disable learning mode** if not needed
4. **Use performance mode** in puppeteer settings
5. **Close other apps** to free RAM

---

## Getting Help

1. Check the main [README.md](README.md)
2. Review logs from **Live Logs** tab
3. Check existing issues on GitHub
4. Create new issue with:
   - System info (OS, Node version)
   - Error logs from the app
   - Steps to reproduce
   - Screenshots if applicable

---

## Next Steps

After successful installation:

1. **Configure AI behavior** in System Instructions tab
2. **Monitor logs** in Live Logs tab
3. **Test with messages** in WhatsApp
4. **Adjust temperature** if responses too creative/robotic
5. **Set up system service** for auto-start

---

**Happy automating! 🚀**
