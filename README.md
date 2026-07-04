# AI-Curated Personal Knowledge Canvas

An infinite, visually rich personal knowledge workspace where users can map notes, links, and images, with assistance from a local Ollama AI for tag extraction, auto-clustering, semantic connection suggestions, and visual organization.

The workspace is designed to run **100% locally** to guarantee privacy, utilizing IndexedDB for offline persistence and Vite proxy settings to connect directly with your local Ollama instance.

---

## 🛠️ Technology Stack

- **Frontend Core**: React 19 + Vite + TypeScript
- **Infinite Canvas**: `@xyflow/react` (React Flow)
- **Local Persistence**: `Dexie.js` (IndexedDB database ORM)
- **Styling & Aesthetics**: Vanilla CSS with custom dark glassmorphic tokens, glowing borders, and animations
- **Local AI Provider**: Ollama running the **Mistral** model

---

## 🚀 Getting Started

### 1. Install & Configure Ollama (Local AI)

If you encountered Docker engine connection errors, you can run Ollama **natively on Windows** without needing Docker:

#### Option A: Native Windows Installation (Recommended)
1. Download the Windows installer from the [Official Ollama Website](https://ollama.com/download/windows).
2. Install the app and ensure it is running (you should see the Ollama icon in your Windows taskbar tray).
3. Open your PowerShell/Command Prompt and pull the Mistral model:
   ```bash
   ollama run mistral
   ```
4. Once the download finishes, you can test if the API is active by opening `http://localhost:11434` in your browser.

#### Option B: Docker Installation (Requires Docker Desktop Running)
If you prefer running via Docker, make sure Docker Desktop is started first, then execute:
```bash
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
docker exec -it ollama ollama run mistral
```

---

### 2. Run the Application

Once Ollama is active with the Mistral model loaded, start the React canvas client:

1. Clone or open the project folder in your terminal.
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Launch the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to **`http://localhost:5173`**.

---

## 🎨 Key Features & Workspace Guide

- **Canvas Hub (Left Sidebar)**:
  - **Ollama Connection Indicator**: Displays a green dot when Ollama and Mistral are online and ready, or red if offline.
  - **Add Elements**: Add Text Notes, Web Links, Image Cards, or Group Frames near your screen center.
  - **Analyze Canvas**: Triggers Mistral to analyze notes, suggest connection lines with semantic reasons, and auto-group elements into cluster groups.
  - **Load Demo Canvas**: Pre-populates the workspace with sample cards to test immediately.
  - **Reset Workspace**: Wipes the IndexedDB tables to start fresh.
- **Visual Nodes**:
  - **Text Note Card**: Markdown-ready note-taking blocks with manual editing and an AI-powered **🔮 Auto-tag** generator.
  - **Web Link Card**: Dynamic bookmarks displaying URLs, specific domain sources, and external links.
  - **Image Card**: Supports direct URL links as well as local image uploads (converting files locally to Base64 strings saved in IndexedDB).
  - **Group Frame**: Visually group nodes by dragging them inside resizable cluster frames.
- **Interactive Connections (Pulsing Edges)**:
  - AI proposed links appear as dashed, pulsing purple lines. Hovering over a suggestion displays the AI's reason.
  - Click **`[ ✅ Connect ]`** to save it permanently in IndexedDB as a solid line, or click **`[ ❌ Dismiss ]`** to discard the suggestion.
- **Canvas-Aware AI Assistant (Right Sidebar)**:
  - Collapsible chat interface that pings Mistral.
  - When online, it automatically gathers and appends the notes mapped on your canvas into the context window. You can ask queries like: *"Summarize my active notes"* or *"Where are the gaps in my current planning?"*.

---

## 💸 Cost Awareness & Hardware Requirements

### Estimated Cost Breakdown
- **Software License**: **$0 (100% Free)**. Ollama, React Flow, Dexie.js, Vite, and Lucide Icons are open-source.
- **Cloud/Hosting Costs**: **$0**. The system stores data inside your local browser's IndexedDB and calls the AI model on your local machine, bypassing external SaaS subscription costs or usage-based cloud API tokens.
- **Maintenance/Storage**: **$0**. Browser storage manages data allocation automatically, limited only by your disk space.

### Hardware & Resource Allocation
- **Processor & GPU**: Running LLMs locally consumes CPU and GPU memory. The Mistral (7B parameter) model performs best on systems with:
  - A modern processor (Apple Silicon, Intel i5/AMD Ryzen 5 or higher).
  - A dedicated GPU with at least 6GB VRAM (e.g., NVIDIA RTX series) for faster response times.
- **System Memory**: A minimum of **8GB RAM** is required to run Mistral smoothly, though **16GB RAM** is highly recommended to run the local Vite development server and the LLM simultaneously.
