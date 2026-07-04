# AI-Curated Personal Knowledge Canvas

An infinite, visually rich personal knowledge workspace where users can map notes, links, and images, with assistance from a local or cloud-hosted AI for tag extraction, auto-clustering, semantic connection suggestions, and visual organization.

The workspace is designed to run **offline-first and locally** to guarantee privacy, utilizing IndexedDB for persistent storage of your canvas notes, edges, and user sessions.

---

## 🛠️ Technology Stack

- **Frontend Core**: React 19 + Vite + TypeScript
- **Infinite Canvas**: `@xyflow/react` (React Flow)
- **Local Persistence**: `Dexie.js` (IndexedDB database ORM)
- **Styling & Aesthetics**: Vanilla CSS with custom dark glassmorphic tokens, glowing borders, and animations
- **AI Providers (Hybrid)**: Local Ollama (Mistral), Google Gemini API, or OpenAI API (configured dynamically per user profile)
- **Security**: Local Web Crypto API (SHA-256) for password hashing

---

## 🚀 Getting Started

### 1. Configure Your Chosen AI Provider

You can configure the application to use either a free local LLM or a cloud-hosted API:

#### Option A: Local Ollama (100% Free & Offline)
1. **Windows Native (Recommended)**: Download and run the installer from the [Official Ollama Website](https://ollama.com/download/windows).
2. **Docker**: If you prefer containers, run:
   ```bash
   docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
   docker exec -it ollama ollama run mistral
   ```
3. Open your terminal and pull the Mistral model:
   ```bash
   ollama run mistral
   ```
4. Keep Ollama running in the background.

#### Option B: Google Gemini API (Cloud)
- Obtain a free or paid API Key from the [Google AI Studio Console](https://aistudio.google.com/).
- Recommended model endpoint: `gemini-1.5-flash` (fastest and supports free tier limits).

#### Option C: OpenAI API (Cloud)
- Obtain an API Key from the [OpenAI Platform Console](https://platform.openai.com/).
- Recommended model endpoint: `gpt-4o-mini` (highly cost-effective and smart).

---

### 2. Run the Application

1. Clone or open the project folder in your terminal.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to **`http://localhost:5173`**.
5. Register a new account on the **Local Login Gate**.
6. Set up your preferred AI brain in the **AI Config Onboarding Modal**.

---

## 🎨 Key Features & Workspace Guide

- **Local Authentication Gateway**:
  - A glassmorphic login/signup gate. Account credentials and settings are stored entirely in your browser's IndexedDB. Hashing is performed locally via `crypto.subtle`.
- **Hybrid AI Brain Selector (Onboarding & Sidebar)**:
  - Connect your canvas to local Ollama (checks connection status dynamically), Google Gemini, or OpenAI using your personal API keys (keys are stored locally in IndexedDB).
- **Declutter Panel Toggles (Distraction-Free Mode)**:
  - Collapse the left panel ("Canvas Hub") and right sidebar ("AI Assistant") to enjoy a clean, open infinite canvas workspace.
  - When both panels are collapsed, a **floating glass capsule header** automatically slides down at the top center, displaying your active session status, AI engine indicator, and quick buttons to log out or reconfigure the AI config.
- **Visual Node Mapping**:
  - **Text Note Card**: Markdown note-taking blocks with inline editing and a **🔮 Auto-tag** helper.
  - **Web Link Card**: Dynamic bookmarks displaying source domains, URLs, descriptions, and tags.
  - **Image Card**: Supports direct URL links and local file uploads (converts images locally to Base64 strings saved in IndexedDB).
  - **Group Frame**: Resizable transparent containers (emerald, amber, violet, terracotta, ocean) for organizing notes physically.
- **Interactive Connections (Pulsing Edges)**:
  - AI-suggested connections render as dashed, pulsing purple lines. Hovering over a suggestion displays the AI's reason.
  - Click **`[ ✅ Connect ]`** to save it permanently as a solid visual line, or click **`[ ❌ Dismiss ]`** to discard the proposal.
- **Canvas-Aware AI Assistant (Chat Sidebar)**:
  - Collapsible chat interface. When active, it appends summaries of your mapped canvas elements to the context window so you can ask: *"Summarize my active notes"* or *"Where are the gaps in my current planning?"*.

---

## 💸 Cost Awareness & Hardware Requirements

### Estimated Cost Breakdown
- **Software License**: **$0 (100% Free)**. Ollama, React Flow, Dexie.js, Vite, and Lucide Icons are open-source.
- **Local Persistence & Hashing**: **$0**. Local browser storage (IndexedDB) and native Web Crypto APIs are free.
- **AI Generation Cost**:
  - **Local Ollama**: **$0**. Runs entirely on your own hardware.
  - **Google Gemini API**: **$0 (Free Tier available)**. The free tier on Google AI Studio allows up to 15 RPM (Requests Per Minute), 1 million TPM, and 1,500 RPD (Requests Per Day). Pay-as-you-go billing applies above this.
  - **OpenAI API**: **Usage-based (Paid)**. Calls use your pre-funded developer credits. GPT-4o-mini is priced at approximately $0.150 per 1M input tokens and $0.600 per 1M output tokens (costs should be verified on OpenAI's official pricing page).

### Hardware & Resource Allocation (For Local Ollama only)
- **Processor & GPU**: Running Mistral locally requires:
  - A modern processor (Apple Silicon, Intel i5/AMD Ryzen 5 or higher).
  - A dedicated GPU with at least 6GB VRAM (e.g., NVIDIA RTX series) for responsive generations.
- **System Memory**: A minimum of **8GB RAM** is required to run Mistral, though **16GB RAM** is highly recommended to run the local Vite build server and the LLM simultaneously.
