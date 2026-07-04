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
- **Deleting Cards**: Click the **More (three-dots)** icon on any card to open a dropdown menu with edit and delete options, preventing layout clutter.
- **Distraction-Free Mode**: Click the toggle tabs on the edges of the left sidebar to collapse it. A minimal header will slide down from the top center containing user credentials, active AI status, configuration, and log out options.

---

## 🚀 Phase 3 Supercharged Features

### 1. 📄 Document Uploads & Client-Side PDF Parsing
- **Local Parsing**: Click the **Upload Doc** button in the left panel to import local `.txt`, `.md`, or `.pdf` files.
- **Client-Side Extraction**: High-performance text parsing is handled completely inside the browser using `pdfjs-dist` connected to a public CDN worker.
- **AI Auto-Summarization**: When a file is loaded, the local/cloud LLM is pinged in the background to analyze the content, auto-generating a 1-sentence summary and 3-5 relevant keyword tags for the node.

### 2. 🎥 YouTube Integration & Watch Modals
- **Auto-Conversion**: Paste a YouTube video URL into a bookmark card. The system automatically extracts the video ID and upgrades the node to a `youtubeCard` node.
- **HQ Clipart Thumbnail**: Renders the video's official high-resolution clipart cover thumbnail.
- **Interactive Player**: Click the play overlay to launch a beautiful, frosted-glass centered iframe player modal to watch the video directly on the canvas without leaving the application.

### 3. 🧠 Local Canvas RAG (Retrieval-Augmented Generation)
- **Tokenization & TF-IDF**: A local, client-side RAG engine (`ragService.ts`) indexes note text, bookmark descriptions, and document contents.
- **Dynamic Context Injection**: When asking questions in the AI Assistant chat, the system calculates term frequencies and retrieves the top 3 matching chunks, injecting them as source citations into the LLM system prompt.

### 4. 💬 Floating Resizable Chat Window
- **Launcher Orb**: The AI companion collapses into a floating, pulsing violet bubble launcher in the bottom-right corner.
- **Interactive Resize**: Click to expand it into a window. Hover over the top-left corner and drag to resize the chat window dynamically.
- **Dockable Layout**: Dock the drawer back into a full-height right sidebar configuration at any time.

### 5. 🔍 Coordinate Animations & Search Regrouping
- **Glide Transitions**: Type tags or keywords in the chat panel's built-in search bar. All matching nodes glide smoothly to a central grid coordinate system using React Flow transitions.
- **Visual Focus**: Unrelated cards and frames fade to a locked, faint opacity (`0.15`), and group frames are hidden. Clearing the search query glides cards back to their exact starting positions.

### 6. 🫧 Organic SVG Bubble Clusters & Tag Wordclouds
- **Wavy SVG Borders**: Group frames computed boundaries are wrapped in wavy organic SVG paths that adapt to enclosing child coordinates.
- **Visual Wordcloud**: Shows a tag cloud at the top edge of the group bubble representing the most frequent keywords in the group, sized relative to their prominence.

