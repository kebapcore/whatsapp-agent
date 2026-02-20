# Quick Start Guide - WhatsApp Agent

Get up and running in 10 minutes.

## Prerequisites

```bash
# Check Node.js (must be v16+)
node --version
npm --version

# Install browser (if not present)
sudo apt-get install chromium-browser
```

## Installation (3 minutes)

```bash
# Clone repository
git clone https://github.com/kebapcore/whatsapp-agent.git
cd whatsapp-agent

# Install dependencies
npm install
```

## Get API Key (2 minutes)

1. Open https://aistudio.google.com
2. Sign in with Google
3. Click "Get API Key"
4. Create new key
5. Copy the key

## Launch (2 minutes)

```bash
npm start
```

The app opens. Follow the **Configuration Wizard**:

1. **Browser**: Select Chrome or Chromium
2. **Settings**: Keep defaults or adjust
3. **Messages**: Set to "Mention Only" for groups
4. **API Key**: Paste your Gemini API key
5. **Save**: Click "Save & Continue"

## QR Code Login (3 minutes)

1. Scan the QR code with your phone
2. Open WhatsApp → Settings → Linked Devices
3. Choose "Link a device"
4. Scan with your phone
5. Approve on your phone

**Done!** App is now running.

## Test It

Send yourself a WhatsApp message:
- Private message → Bot replies automatically
- Group mention (if bot is member) → Bot replies
- Watch Live Logs tab for activity

## Customize (Optional)

**Go to System Instructions tab** to edit:
- Personality
- Response style
- Interests
- Special behaviors

Click "Save Changes" and test again.

## Common Commands

```bash
npm start              # Launch
npm run build          # Build for production
npm run dist:linux     # Create installer
npm run format         # Format code
```

## Troubleshooting

**QR not showing?**
```bash
pkill -9 chrome
rm -rf ~/.whatsapp-agent/session
npm start
```

**Browser not found?**
```bash
sudo apt-get install google-chrome-stable
```

**API key error?**
- Get new key from aistudio.google.com
- Paste in config wizard or edit ~/.whatsapp-agent/config.json

## Config Files

Located in: `~/.whatsapp-agent/`

- `config.json` - Settings
- `gemini.txt` - AI instructions
- `history.json` - Saved messages
- `session/` - WhatsApp web session

## Next Steps

1. Read [USER_GUIDE.md](USER_GUIDE.md) for full features
2. Read [README.md](README.md) for technical details
3. Check [INSTALL.md](INSTALL.md) for advanced setup
4. Review logs in **Live Logs** tab
5. Adjust temperature & instructions as needed

## Tips

- **Typing simulation**: Makes responses seem human-like
- **Group handling**: Set to "Mention Only" for safe operation
- **Temperature**: Increase for creativity, decrease for accuracy
- **History limit**: Reduce if memory-constrained

---

**Questions?** Check the docs or GitHub issues.

**Enjoy!** 🚀
