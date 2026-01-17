<p align="center">
  <img src="public/icons/codemind.png" alt="CodeMind" width="500">
</p>

<h3 align="center">AI-Powered Repository Analyzer</h3>
<p align="center">Understand any GitHub repository in seconds with intelligent AI analysis.</p>

<div align="center">

[![Stars](https://img.shields.io/github/stars/AhmedV20/codemind?style=social)](https://github.com/AhmedV20/codemind/stargazers)
[![Version](https://img.shields.io/badge/version-1.1.0-blue)](https://github.com/AhmedV20/codemind/releases)
[![Build](https://img.shields.io/github/actions/workflow/status/AhmedV20/codemind/ci.yml?label=CI/Build)](https://github.com/AhmedV20/codemind/actions)
[![Privacy](https://img.shields.io/badge/Privacy-Protected-green)](PRIVACY.md)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## 🚀 Installation

<div align="center">

### 📦 Download CodeMind

<table>
<tr>
<td align="center" width="50%">
<br>
<img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/edge/edge_48x48.png" width="65">
<br>
<img src="https://img.shields.io/badge/Edge-Coming_Soon-0078D7?style=for-the-badge&logo=microsoftedge&logoColor=white" alt="Edge">
<br><br>
<p><b>🔄 Under Review</b></p>
<p>Our Edge extension is currently being reviewed by Microsoft. Check back soon!</p>
</td>
<td align="center" width="50%">
<br>
<img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/firefox/firefox_48x48.png" width="65">
<br>
<img src="https://img.shields.io/badge/Firefox-Coming_Soon-FF7139?style=for-the-badge&logo=firefoxbrowser&logoColor=white" alt="Firefox">
<br><br>
<p><b>📝 In Progress</b></p>
<p>Firefox submission is underway. We'll notify you once it's available!</p>
</td>
</tr>
</table>

<br>

> 💡 **Want to try CodeMind now?** See the [Manual Installation](#-manual-installation) guide below for Chrome/Edge.

</div>

---

### 💡 What is CodeMind?

CodeMind is a browser extension that uses AI to analyze GitHub repositories. It fetches the repository structure, README, dependencies, and key files, then generates a comprehensive summary explaining what the project does, who it's for, and how to use it.

**How to use:**

1. Install the extension from your browser's store (or manually - see the [manual installation](#-manual-installation) guide)
2. Navigate to any GitHub repository
3. Click the **CodeMind** button next to the Insights tab
4. Configure your AI provider in the settings panel
5. Click **Analyze Repository** to get your summary

---

## ✨ Features

### Core Features
- **One-Click Analysis** — Click the CodeMind button on any GitHub repo
- **AI Summaries** — Get instant, readable explanations of complex code
- **Interactive Chat** — Ask follow-up questions about the repository
- **Smart Caching** — Results saved for 24 hours

### AI Providers
| Provider | Free Tier | Description |
|----------|-----------|-------------|
| **Gemini** | ✅ Yes | Google's AI with generous free tier |
| **OpenRouter** | ✅ Yes | Access 100+ models (DeepSeek, Qwen, etc.) |
| **Claude** | ❌ Paid | Anthropic's Claude models |
| **HuggingFace** | ✅ Yes | Open-source models |

### v1.1.0 Highlights
- 🧠 **ThinkingBox** — See AI reasoning process in collapsible box
- 🔑 **GitHub Token** — Handle rate limits with personal access token
- 🎨 **Glass UI** — Modern glassmorphism design throughout
- ⚠️ **Error Handling** — Clear error messages with retry options

---

## 🔒 Privacy Policy

Your privacy matters. CodeMind:
- ✅ Stores API keys locally in your browser only
- ✅ Never sends data to external servers (except AI providers you choose)
- ✅ Uses HTTPS for all API communications
- ✅ Allows you to clear all data anytime

Read the full [Privacy Policy](PRIVACY.md).

---

## 💻 Development

### 🛠️ Setup
```bash
# Clone the repository
git clone https://github.com/AhmedV20/codemind.git
cd codemind

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

### 🔧 Manual Installation


**Step 1: Build the extension**
```bash
npm run build
```

**Step 2: Load in Chrome/Edge**

1. Open your browser and navigate to:
   - **Chrome**: `chrome://extensions`
   - **Edge**: `edge://extensions`

2. Enable **Developer mode** (toggle in top-right corner)

3. Click **"Load unpacked"**

4. Select the `dist` folder from the project directory

5. CodeMind is now installed! 🎉

**Step 3: Configure**

1. Click the CodeMind extension icon in your toolbar
2. Add your AI API key (Gemini, OpenRouter, Claude, or HuggingFace)
3. Navigate to any GitHub repo and start analyzing!

</details>

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

<a href="https://github.com/AhmedV20/codemind/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=AhmedV20/codemind" />
</a>

---

## 📄 License

[MIT](LICENSE) © 2026 CodeMind