# WhatsApp Agent - User Guide

A comprehensive guide to using the WhatsApp Agent application.

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Configuration](#configuration)
4. [Live Monitoring](#live-monitoring)
5. [AI Customization](#ai-customization)
6. [Operation](#operation)
7. [Tips & Tricks](#tips--tricks)

---

## Getting Started

### First Launch

When you launch the app for the first time:

1. **Configuration Wizard** opens automatically
2. Follow the 7-step setup:
   - Browser Selection
   - Puppeteer Settings
   - Message Handling
   - Gemini Configuration
   - Operator Escalation
   - Storage Settings
   - Review & Save

3. After saving, **QR Code Login** screen appears
4. Scan with your phone to connect WhatsApp

### Subsequent Launches

- App remembers your configuration
- Automatically attempts WhatsApp reconnection
- Dashboard loads immediately (if already logged in)

---

## Dashboard Overview

### Top Bar

- **App Name & Status**: Shows version and connection indicator
- **Status Chips**: Real-time connection and session state
  - 🟢 green = connected
  - 🟡 yellow = connecting/initializing
  - ⚫ gray = disconnected

### Three Main Tabs

#### 1. Dashboard Tab

**Your control center:**

```
┌─────────────────────────────────────────┐
│ Dashboard | Live Logs | System Instructions
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────┐  ┌──────────────┐│
│  │ System Status    │  │ Controls     ││
│  │ • Connection     │  │ • Restart    ││
│  │ • Session        │  │ • Reconnect  ││
│  │ • Memory Usage   │  │ • Clear Logs ││
│  │ • Last Action    │  └──────────────┘│
│  └──────────────────┘                  │
│                                         │
│  ┌──────────────────────────────────────┐
│  │ Operator Panel (if needed)           │
│  └──────────────────────────────────────┘
│                                         │
└─────────────────────────────────────────┘
```

**System Status Panel:**
Shows real-time status of your agent:
- **Connection**: `connected` or `disconnected`
- **Session**: `ready` or `initializing`
- **Last Action**: Timestamp of last message
- **Memory Usage**: Heap and total memory

**Agent Controls:**
- **Restart Agent** - Restarts WhatsApp session
- **Reconnect WhatsApp** - Attempts to reconnect
- **Clear Logs** - Clears the log panel

#### 2. Live Logs Tab

Real-time stream of all agent activity:

```
┌────────┬────────┬──────────┬────────────────────────┐
│ Time   │ Level  │ Source   │ Message                │
├────────┼────────┼──────────┼────────────────────────┤
│ 12:34  │ INFO   │ whatsapp │ Message received from  │
│ 12:35  │ DEBUG  │ gemini   │ Processing request     │
│ 12:35  │ SUCCESS│ whatsapp │ Message sent           │
│ 12:36  │ ERROR  │ gemini   │ API rate limit         │
└────────┴────────┴──────────┴────────────────────────┘
```

**Color Coding:**
- 🔴 **Error** (red) - Something went wrong
- 🟡 **Warning** (yellow) - Potential issue
- 🟢 **Success** (green) - Action completed
- 🔵 **Info** (blue) - Informational message
- ⚫ **Debug** (gray) - Debugging details

**Filtering & Scrolling:**
- Logs auto-scroll to bottom
- Last 200 logs kept in memory
- Shows timestamp, level, source, and message

#### 3. System Instructions Tab

Customize the AI behavior:

```
┌─────────────────────────────────────────┐
│ Gemini System Instructions              │
├─────────────────────────────────────────┤
│                                         │
│  [Full-featured text editor]            │
│                                         │
│  - Syntax highlighting                  │
│  - Line numbers                         │
│  - Auto-indentation                     │
│                                         │
│                                         │
│ ┌─────────────┐ [Reset] [Auto-reload]  │
│ │ Save        │                         │
│ └─────────────┘                         │
│                                         │
│ Saved to: ~/.whatsapp-agent/gemini.txt │
└─────────────────────────────────────────┘
```

---

## Configuration

### Initial Setup Wizard

The wizard guides you through 7 screens:

#### Screen 1: Browser Selection

Choose which browser to use for WhatsApp Web:

```
□ Chrome           /usr/bin/google-chrome
□ Chromium        /usr/bin/chromium-browser
□ Brave           /usr/bin/brave-browser
□ Custom Path     [______________ ]
```

**Recommendation:** Chrome or Chromium (most reliable)

#### Screen 2: Puppeteer Settings

Fine-tune browser behavior:

```
☑ Headless Mode
    (Browser runs silently, no window visible)

☑ Disable Sandbox
    (Faster, but less secure - OK for trusted environment)

☑ Performance Mode
    (Disables images & plugins for speed)
```

**Defaults:** Use defaults unless you have specific needs

#### Screen 3: Message Handling

Control when the bot responds:

```
☑ Auto Reply Enabled
    (Automatically respond to messages)

☑ Typing Simulation
    (Shows "typing..." indicator like a human)

☑ Reply to Specific Messages
    (Use quoted replies when applicable)

☑ Learning Mode
    (Builds profiles of frequent contacts)

Group Message Handling:
• Respond to All Messages
○ Mention/Reply Only (Recommended)
○ Ignore Group Messages
```

**Recommendation:** Keep typing simulation enabled for natural feel

#### Screen 4: Gemini Configuration

Set up your AI brain:

```
API Key:    [______________ ]
            (Get from aistudio.google.com)

Model:      ○ Gemini 2.5 Flash (Fastest, Recommended)
            ○ Gemini 2.0 Flash
            ○ Gemini 1.5 Pro (Most capable)

Temperature: [======= 0.7 ] (0=precise, 1=creative)

☑ Enable Google Search Grounding
    (Optional: Uses current web info in responses)
```

**Temperature Explanation:**
- **0.0** - Same response every time (deterministic)
- **0.5** - Balanced
- **1.0** - Very creative and varied

#### Screen 5: Operator Escalation

When humans need to step in:

```
☑ Request Help When Needed
    (Ask human operator when confused)

☑ Allow Manual Override
    (Let operator take control)

☐ Silent Mode
    (Don't notify on escalation)
```

#### Screen 6: Storage Settings

Local data management:

```
History Message Limit: [100]
    (Keep last 100 messages, older ones deleted)

☑ Store Attachments
    (Save media files locally)
```

#### Screen 7: Review & Save

Verify all settings before saving:

```
{
  "browser": { ... },
  "gemini": { ... },
  "messageHandling": { ... },
  ...
}

[Back] [Save & Continue]
```

### Editing Configuration Later

**Method 1: Text Editor**

Edit `~/.whatsapp-agent/config.json` directly:

```bash
nano ~/.whatsapp-agent/config.json
```

Then click "Restart Agent" in dashboard.

**Method 2: In App (Limited)**

Only system instructions can be edited in-app via the **System Instructions** tab.

---

## Live Monitoring

### Understanding the Log Panel

Each log entry shows:

```
12:34:56  SUCCESS  [whatsapp]  Message sent to John Doe
│         │        │          │
│         │        │          └─ What happened
│         │        └──────────── Where it happened
│         └───────────────────── Severity level
└────────────────────────────── Timestamp
```

### Interpreting Messages

**WhatsApp Events:**
- `QR code ready` → Scan the code
- `Message received from [Name]` → Incoming message
- `Message sent to [Name]` → Bot replied
- `Disconnected` → Session lost
- `Authenticated successfully` → Logged in

**Gemini Events:**
- `Requesting Gemini response...` → Processing
- `Gemini response: [action]` → Decision made
- `Operator escalation` → Needs human help

**Error Events:**
- `Authentication failed` → Login issue
- `Gemini API error` → API problem
- `Message send failed` → Delivery issue

### Monitoring Best Practices

1. **Keep Live Logs open** while testing
2. **Note error timestamps** for debugging
3. **Search for patterns** in repeated errors
4. **Clear logs** before testing new features

---

## AI Customization

### System Instructions

The "System Instructions" tab is where you tell Gemini how to behave.

Default instruction set includes:

1. **Output Rules** - JSON format, no markdown
2. **Personality Profile** - Age, class, vibe
3. **Speech Style** - Lowercase, slang, emojis
4. **Interests** - Anime, gaming, tech
5. **Social Relationships** - How to talk to different people
6. **Context Awareness** - Understanding message history
7. **Example Responses** - Reference answers

### Customization Examples

**Example 1: Change Personality**

Find this section:
```
GENEL KARAKTER
* Kullanıcının adı: Şamil.
* Sınıf: 8. Sınıf, 8-H şubesi.
```

And change to:
```
GENEL KARAKTER
* Kullanıcının adı: Bot.
* Sınıf: N/A (I'm an AI)
```

**Example 2: Change Language**

Replace Turkish with English throughout:
```
SPEECH STYLE
* Only lowercase letters
* English slang only
```

**Example 3: Add New Interest**

In the INTERESTS section, add:
```
* Photography and visual arts
* Mountain hiking
```

**Example 4: Change Response Style**

Modify EXAMPLE RESPONSES section:
```
User: "Naber"
Response: "sup, what's up with you?"
```

### Testing Changes

1. Edit text in System Instructions tab
2. Click "Save Changes"
3. (Optional) Enable "Auto-reload Agent"
4. Send test message in WhatsApp
5. Check response

### Default Instructions

Can't remember original? Click "Reset to Default" to restore.

**Saved to:** `~/.whatsapp-agent/gemini.txt`

---

## Operation

### Daily Usage

#### 1. Start the App

```bash
npm start
# or if installed
whatsapp-agent
```

#### 2. Monitor the Dashboard

- Check status chips (should show green/ready)
- Watch Live Logs for activity
- Note any warnings/errors

#### 3. Send WhatsApp Messages

The bot will:
1. Receive your message
2. Process it through Gemini
3. Decide to reply, ignore, or ask for operator help
4. Send response (if applicable)

#### 4. Handle Operator Requests

If Gemini asks for help:
1. **Operator Panel** appears on dashboard
2. Read the request
3. Type your response
4. Click "Send Response"
5. Bot uses your input and continues

#### 5. Monitor and Adjust

- Review logs for issues
- Adjust temperature if responses too creative/robotic
- Edit system instructions if behavior unsatisfactory

### Troubleshooting During Operation

**Bot Not Responding:**
- Check "Auto Reply Enabled" in config
- Check group handling setting
- Restart agent

**Responses Inappropriate:**
- Edit system instructions
- Reduce temperature
- Add specific behavior rules

**Session Keeps Disconnecting:**
- Try "Reconnect WhatsApp" button
- Check internet connection
- Rescan QR code

---

## Tips & Tricks

### Performance Tuning

1. **Enable headless mode** - No browser window needed
2. **Reduce history limit** - Fewer messages = less memory
3. **Disable learning mode** - Not needed for simple responses
4. **Use performance mode** - Faster processing

### Message Handling Strategies

#### Strategy 1: Auto-respond to Everything

Config:
```json
{
  "messageHandling": {
    "autoReplyEnabled": true,
    "groupHandling": "always"
  }
}
```

Use case: Standalone bot that responds to everyone

#### Strategy 2: Selective Mode

Config:
```json
{
  "messageHandling": {
    "autoReplyEnabled": true,
    "groupHandling": "mention_only"
  }
}
```

Use case: Group assistant that only responds when mentioned

#### Strategy 3: Observer Mode

Config:
```json
{
  "messageHandling": {
    "autoReplyEnabled": false
  }
}
```

Use case: Just monitoring, no responses

### System Instruction Tips

1. **Be specific** - "Always use casual language" vs "use bro, chill, vibe"
2. **Use examples** - Gives Gemini clear patterns
3. **Set boundaries** - "Never discuss politics"
4. **Keep it realistic** - Don't pretend to be something impossible
5. **Test changes** - Small adjustments at a time

### Common Customizations

**Make it more serious:**
```
Remove: relaxed, chill, cool
Add: professional, respectful, formal
```

**Make it more helpful:**
```
Add: Ask clarifying questions, provide detailed explanations
```

**Make it more creative:**
```
Increase temperature to 0.9
Add: playful, witty, imaginative
```

**Add special knowledge:**
```
Add under INTERESTS: "Expert in [your topic]"
Add examples with this knowledge
```

### Keyboard Shortcuts

- **Ctrl+Q** - Quit application
- **Ctrl+Shift+I** - Open DevTools (debug)
- **Ctrl+R** - Reload window
- **F11** - Fullscreen (if available)

### Log Analysis

**Find all errors:**
In Live Logs, look for red ERROR entries

**Find performance issues:**
Look for DEBUG entries with timestamps
Calculate time between events

**Find pattern issues:**
Filter by SOURCE (whatsapp, gemini, processor)
See which component is problematic

---

## Best Practices

### Security

1. ✅ Keep API key secure (in `~/.whatsapp-agent`)
2. ✅ Don't share config files
3. ✅ Use strong WhatsApp PIN
4. ✅ Regularly review logged conversations
5. ❌ Never put sensitive info in system instructions

### Performance

1. ✅ Keep history limit at 100 or less
2. ✅ Clear logs occasionally
3. ✅ Monitor memory usage
4. ✅ Restart agent daily
5. ❌ Don't edit huge amounts of text at once

### Reliability

1. ✅ Monitor Live Logs regularly
2. ✅ Have fallback manual response plan
3. ✅ Test new instructions thoroughly
4. ✅ Keep backups of good instructions
5. ❌ Don't change everything at once

---

## FAQ

**Q: How do I make responses faster?**
A: Enable performance mode in config, reduce history limit

**Q: Can I run on a server?**
A: Yes, use headless mode and potentially systemd service

**Q: Does it work 24/7?**
A: Yes, but monitor regularly for disconnections

**Q: How much data does it use?**
A: Minimal - only for API calls to Gemini

**Q: Is my data private?**
A: Yes - all data stored locally, never uploaded except to Gemini API

**Q: Can I use multiple WhatsApp accounts?**
A: Launch multiple instances with different user accounts

**Q: What if I forget my API key?**
A: Get new one from aistudio.google.com, no limits

**Q: Can I edit system instructions while running?**
A: Yes, save and changes apply immediately

---

## Support & Feedback

- 📖 Check [README.md](README.md) for comprehensive docs
- 🚀 See [INSTALL.md](INSTALL.md) for troubleshooting
- 🐛 Report issues on GitHub with logs and system info
- 💡 Suggest features via GitHub discussions

---

**Happy automating!** 🎉
