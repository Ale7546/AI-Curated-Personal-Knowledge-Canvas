# AI-Curated Personal Knowledge Canvas

An infinite, visually rich personal knowledge workspace where users can map notes, links, and images, with assistance from a local or cloud-hosted AI for tag extraction, auto-clustering, semantic connection suggestions, and visual organization.

The workspace is designed to run **offline-first and locally** to guarantee privacy, utilizing IndexedDB for persistent storage of your canvas notes, edges, and user sessions.

---

## 🛠️ Getting Started (Local Development)

To run the application locally on your machine, follow these steps:

1. **Clone or open the project folder** in your terminal.
2. **Install the dependencies**:
   ```bash
   npm install
   ```
3. **Launch the development server**:
   ```bash
   npm run dev
   ```
4. **Open your browser** and navigate to **`http://localhost:5173`**.
5. Register a new account on the local Login screen.
6. Configure your preferred AI brain in the onboarding modal.

---

## 🐳 Docker Ollama Setup

If you wish to run a private, fully offline AI model on your machine using Docker, follow these instructions:

1. **Launch the Ollama container** (this exposes port `11434` and mounts a persistent volume for your downloaded models):
   ```bash
   docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
   ```
2. **Download and run the Mistral model** inside the container:
   ```bash
   docker exec -it ollama ollama run mistral
   ```
3. Once the download completes, keep the container running in the background. The canvas application will communicate with it via Vite's local dev proxy.

---

## 🔮 Hybrid LLM Settings

The application supports multiple AI providers. You can change your active provider anytime by clicking **AI Config** at the bottom of the left sidebar:

- **Local Ollama**: Connects to your Docker or native Ollama instance. Uses the `mistral` model by default (you can specify other downloaded models in the settings). The settings modal pings the endpoint in real time to verify that Ollama is online.
- **Google Gemini API**: Connects to cloud-hosted Gemini models. Paste your Gemini API key (e.g., from Google AI Studio). The recommended model is `gemini-1.5-flash` for high-speed, cost-free interactions under the standard developer tier.
- **OpenAI API**: Connects to OpenAI chat models. Paste your OpenAI developer API key. The recommended model is `gpt-4o-mini` for highly cost-effective and smart semantic tags and connections.

*Note: All API keys and endpoints are stored locally in your browser's IndexedDB and are never sent to external servers.*

---

## 🎮 Keyboard & Canvas Shortcuts

- **Creating Connection Lines**: Click and drag from any of the colored circular handles (Top, Bottom, Left, or Right) of a node card to another node card's handle to link them manually.
- **Visual Connection Suggestions**: Click **Analyze Canvas** in the left sidebar to suggest new semantic links. AI-proposed edges appear as dashed, pulsing purple lines. Hovering over a suggestion displays the AI's reason. Click `[ ✅ Connect ]` to save the suggestion permanently or `[ ❌ Dismiss ]` to discard it.
- **Grouping Cards**: Drag any node card inside a resizable **Group Frame**. Sub-nodes automatically nest, staying relative to the group layout and moving with the parent container.
- **Editing Card Details**: Click the **Edit (Pencil)** icon on any node card to modify its title, URL, description, or tags. Click `Save` to commit changes to IndexedDB, or `Cancel` to discard.
- **Auto-Generating Tags**: Click the **🔮 Sparkle** icon inside any note's edit view to let the selected LLM automatically scan the note text and generate relevant category hashtags.
- **Deleting Cards**: Click the **Delete (Trashcan)** icon on any card to remove it and any of its connected link lines from the canvas workspace.
- **Distraction-Free Mode**: Click the toggle tabs on the edges of the left and right sidebars to collapse them. A minimal header will slide down from the top center containing user information, AI status, configuration, and log out options.
