# LLM Integration TODOs for RexxJS

This document tracks the major online and offline LLMs to integrate into Rexx via the `ADDRESS` and `CHECKPOINT` mechanisms. It also includes future directions and architectural notes.

---

## ✅ Online APIs (Priority Targets)

These vendors have distinct APIs and features that justify dedicated Rexx bindings.

### 1. **OpenAI**

* Models: GPT‑4 Turbo, GPT‑4o, GPT‑5 (future)
* Features: Function calling, embeddings, fine-tuning, streaming
* TODO: Create `ADDRESS OPENAI` handler with support for chat + function-calls

### 2. **Anthropic (Claude)**

* Models: Claude 3.5 Sonnet, Claude 4.1, Claude 3 Opus (Bedrock)
* Features: Long context (>200k tokens), enterprise compliance
* TODO: Finalize current `ADDRESS CLAUDE` implementation

### 3. **Google DeepMind (Gemini)**

* Models: Gemini 1.5 Pro, Gemini 2.0 Pro/Flash, Gemini 2.5 Pro
* Features: Multimodal, long context, integration via Vertex AI
* TODO: Implement `ADDRESS GEMINI` binding (browser + Node variants)

### 4. **Meta (LLaMA 3 API)**

* Models: 405B, 70B, 8B (context 128k)
* Features: Open model family, available via APIs and Hugging Face
* TODO: `ADDRESS LLAMA3` targeting API-hosted variants

### 5. **Cohere (Command R)**

* Models: Command R+, Command R+ (fine-tuned)
* Features: Optimized for RAG, enterprise chat
* TODO: `ADDRESS COHERE`

### 6. **Alibaba (Qwen)**

* Models: Qwen-1.5, successors
* Features: Multilingual, good in reasoning tasks
* TODO: `ADDRESS QWEN`

### 7. **xAI (Grok)**

* Models: Grok‑3, Grok‑5
* Features: Integrated with X (Twitter) ecosystem
* TODO: `ADDRESS GROK`

### 8. **DeepSeek**

* Models: DeepSeek R1, V3
* Features: Open‑source and API accessible
* TODO: `ADDRESS DEEPSEEK`

### 9. **Aggregator APIs**

* Platforms: OpenRouter, Mistral, TogetherAI, HuggingFace Inference, NVIDIA NIM, Groq
* Features: Unified access to multiple models
* TODO: One generic `ADDRESS LLM-HUB` handler with routing support

---

## 🖥️ Offline / Local Models (Future TODOs)

These models can be integrated via local runners (LLaMA.cpp, Ollama, LM Studio, GPT4ALL). Hardware may currently be limiting.

* **Falcon 3** (1B–10B)
* **Gemma 2/3** (Google open models)
* **Phi‑3/4** (Microsoft small LLMs)
* **BLOOM** (176B multilingual)
* **DBRX** (Databricks MoE, 132B)
* **LLaMA 3** (Meta open release)
* **Vicuna**
* **StableLM**
* **OpenAssistant / Pythia**
* **Dolly**

### Local Runners / Tools

* **LLaMA.cpp** — C++ runtime
* **Ollama** — Local model orchestrator
* **GPT4ALL** — Desktop client
* **LM Studio** — Developer IDE integration
* **AMD Gaia** — Open-source runtime for any PC

---

## 🚧 Future Directions

1. **Standardize Rexx Bindings**

   * Common metadata schema for `ADDRESS_*` handlers
   * Consistent `STATUS`, `CHAT`, `START`, `END` verbs

2. **CHECKPOINT Integration**

   * Extend CHECKPOINT to cover tool-calls (structured callbacks)
   * Allow Rexx to act as *both client and collaborator*

3. **Streaming & Progress**

   * Map API streaming tokens → Rexx progress messages
   * Enable partial updates in busy loops

4. **Authentication Abstraction**

   * Unified handling of API keys (env, config, window globals)

5. **Multi-modal Support**

   * Image input/output, audio transcription
   * Extend CHECKPOINT JSON for media payloads

6. **Hybrid Execution**

   * Smart fallback: use local models first, API if unavailable

7. **Benchmarking / Cost Tracking**

   * Record tokens, latency, costs per session

---

## 📝 Next Steps

* [ ] Finish OpenAI binding (`ADDRESS OPENAI`)
* [ ] Add Gemini & LLaMA3 bindings
* [ ] Draft aggregator handler (`ADDRESS LLM-HUB`)
* [ ] Extend CHECKPOINT handler to NodeJS transport (EventEmitter/WebSocket)
* [ ] Create demo Rexx scripts for each binding
* [ ] Plan offline integration stubs with Ollama / llama.cpp
