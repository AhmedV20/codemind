<p align="center">
  <img src="public/icons/codemind.png" alt="CodeMind" width="500">
</p>

<h3 align="center">AI-Powered Repository Analyzer</h3>
<p align="center">Understand any GitHub repository in seconds with intelligent AI analysis.</p>

<div align="center">

[![Stars](https://img.shields.io/github/stars/AhmedV20/codemind?style=social)](https://github.com/AhmedV20/codemind/stargazers)
[![Version](https://img.shields.io/badge/version-1.2.1-blue)](https://github.com/AhmedV20/codemind/releases)
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
<a href="https://microsoftedge.microsoft.com/addons/detail/hfggelncfoaompalbnkgbincglagmbnj">
<img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/edge/edge_48x48.png" width="65">
<br>
<img src="https://img.shields.io/badge/Edge-Install_Now-0078D7?style=for-the-badge&logo=microsoftedge&logoColor=white" alt="Edge">
</a>
<br><br>
<p><b>✅ Available Now</b></p>
<p>Get CodeMind from the Microsoft Edge Add-ons Store!</p>
</td>
<td align="center" width="50%">
<br>
<img src="https://raw.githubusercontent.com/alrra/browser-logos/main/src/chrome/chrome_48x48.png" width="65">
<br>
<img src="https://img.shields.io/badge/Chrome-Manual_Install-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Chrome">
<br><br>
<p><b>🔧 Developer Mode</b></p>
<p>Install manually via <a href="#-manual-installation">instructions below</a></p>
</td>
</tr>
</table>

<br>

</div>

---

## 💡 What is CodeMind?

CodeMind is a powerful browser extension that uses AI to instantly understand any GitHub repository. Simply click a button and get:

- **Smart Summaries** — Understand what the project does, who it's for, and its key features
- **Code Structure Analysis** — Learn how the codebase is organized  
- **Tech Stack Detection** — See all languages, frameworks, and dependencies at a glance
- **Interactive Q&A** — Ask follow-up questions and get detailed answers about any part of the code
- **Analyzed Files View** — See exactly which files were analyzed (new in v1.2.0!)

<!-- Demo GIF - Replace with your actual demo recording
<p align="center">
  <img src="docs/demo.gif" alt="CodeMind Demo" width="700">
  <br>
  <em>Analyze any GitHub repository in seconds</em>
</p>
-->

**How to use:**

1. Install from the [Edge Add-ons Store](https://microsoftedge.microsoft.com/addons/detail/hfggelncfoaompalbnkgbincglagmbnj) or [manually](#-manual-installation)
2. Navigate to any GitHub repository
3. Click the **CodeMind** button next to the Insights tab
4. Configure your AI provider (Gemini, OpenAI, Claude, HuggingFace, or OpenRouter)
5. Click **Analyze Repository** to get your summary

---

## ✨ Features

### Core Features
- **One-Click Analysis** — Click the CodeMind button on any GitHub repo
- **AI Summaries** — Get instant, readable explanations of complex code
- **Interactive Chat** — Ask follow-up questions about the repository
- **Smart Caching** — Results saved for 24 hours
- **Analyzed Files Dropdown** — See which files were included in the analysis

### AI Providers
| Provider | Free Tier | Description |
|----------|-----------|-------------|
| **Gemini** | ✅ Yes | Google's AI with generous free tier |
| **OpenAI** | ❌ Paid | GPT-4o with streaming support (new!) |
| **OpenRouter** | ✅ Yes | Access 100+ models (DeepSeek, Qwen, etc.) |
| **Claude** | ❌ Paid | Anthropic's Claude models |
| **HuggingFace** | ✅ Yes | Open-source models |

### v1.2.1 Highlights
- 🌐 **Edge Browser Support** — Fixed extension not working on Microsoft Edge
- ⏱️ **Improved Timing** — Increased injection timeout for slower browsers
- 🔍 **URL Fallback** — Added URL pattern validation for better reliability

### v1.2.0 Highlights
- 🤖 **OpenAI Support** — GPT-4o integration with streaming
- 📂 **Analyzed Files Dropdown** — See which files were analyzed with glow animation
- 🌐 **No GitHub Token Required** — Works on public repos without authentication
- 🎯 **Smart File Selection** — Intelligent 80k token budget with file prioritization
- 🧠 **ThinkingBox** — See AI reasoning process in collapsible box
- 🎨 **Redesigned UI** — New Analyze button with status colors
- ⏱️ **Request Throttling** — Built-in cooldown to prevent rate limits

### Previous Versions
<details>
<summary>v1.1.x Features</summary>

- 🧠 **ThinkingBox** — See AI reasoning process in collapsible box
- 🔑 **GitHub Token** — Handle rate limits with personal access token
- 🎨 **Glass UI** — Modern glassmorphism design throughout
- ⚠️ **Error Handling** — Clear error messages with retry options

</details>

---

## 🔒 Privacy Policy

Your privacy matters. CodeMind:
- ✅ Stores API keys locally in your browser only
- ✅ Never sends data to external servers (except AI providers you choose)
- ✅ Uses HTTPS for all API communications
- ✅ Allows you to clear all data anytime
- ✅ No GitHub token required for public repositories

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

### 📁 Project Structure
```
src/
├── background/          # Service worker & API calls
│   ├── api/             # AI provider implementations
│   └── services/        # Analysis, cache, strategies
├── content/             # UI components & hooks
│   ├── components/      # React components
│   └── utils/           # DOM scrapers, parsers
├── shared/              # Types & constants
└── popup/               # Extension popup
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
2. Add your AI API key (Gemini, OpenAI, OpenRouter, Claude, or HuggingFace)
3. Navigate to any GitHub repo and start analyzing!

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

<a href="https://github.com/AhmedV20/codemind/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=AhmedV20/codemind" />
</a>

---

## 📄 License

[MIT](LICENSE) © 2026 CodeMind