# AI Chat App with PDF Upload & RAG Integration

A conversational AI application built with modern tooling, designed to provide seamless interaction with the OpenAI GPT-4.5 model, along with contextual Q&A over uploaded PDFs using a RAG (Retrieval-Augmented Generation) pipeline.

---

## 🚀 Features

- **OpenAI ChatGPT-4.5 (gpt-4o)** – Harnesses the power of the latest OpenAI model for fast and intelligent chat responses.
- **TypeScript & Cursor-Powered Development** – Developed using [Cursor](https://www.cursor.sh/) with TypeScript for maintainable and robust code.
- **PDF Upload with Smart Q&A** – Upload any PDF and instantly query its content using natural language.
- **Automated n8n Integration** – Triggers a backend n8n workflow that:
  - Extracts text from the uploaded PDF
  - Generates semantic embeddings using OpenAI’s `text-embedding-3-small` model
  - Uploads the embeddings to a **Pinecone** vector database
- **RAG (Retrieval-Augmented Generation)** – User queries are enriched with context retrieved from the PDF embeddings in Pinecone, providing accurate, document-aware answers.

---

## 🛠 Tech Stack

| Technology     | Description                             |
|----------------|-----------------------------------------|
| **Cursor**     | AI-assisted code editor used for development |
| **TypeScript** | Strongly typed JavaScript for reliability |
| **OpenAI API** | Chat and embedding models (`gpt-4o`, `text-embedding-3-small`) |
| **n8n**        | Open-source workflow automation used for handling PDF uploads |
| **Pinecone**   | Vector database for storing and querying document embeddings |

---

## 📦 Installation

> Prerequisites:
> - Node.js
> - API keys for OpenAI and Pinecone
> - n8n instance running
> - `.env` file with appropriate configuration

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-chat-rag-app.git
cd ai-chat-rag-app

# Install dependencies
npm install

# Run the development server
npm run dev
