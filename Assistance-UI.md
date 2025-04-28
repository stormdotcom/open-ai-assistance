# Assistance UI Documentation

This document describes how to build a React + Tailwind UI for interacting with the Assistance API.

## Features
- **Text input** for user queries
- **File upload** (PDF, DOCX, TXT)
- **View previous conversations** (threads/messages)
- **Start new conversation/thread**
- **Ask AI** button to send a message
- **See uploaded files** and delete files

**API Base URL:** `http://localhost:4444`

---

## 1. Assistance Selection & Thread Management

- **List Assistants:**
  - `GET /assistances`
  - Response:
    ```json
    [
      { "id": "asst_xxx", "name": "My Assistant", ... }
    ]
    ```
- **List Threads:**
  - `GET /assistances/:assistantId/threads`
  - Response:
    ```json
    [
      { "id": "thread-abc", "messages": [] }
    ]
    ```
- **Start New Thread:**
  - `POST /assistances/:assistantId/threads`
  - Response:
    ```json
    { "id": "thread-abc", "messages": [] }
    ```

---

## 2. Conversation UI

- **List Messages in a Thread:**
  - `GET /assistances/:assistantId/threads/:threadId/messages`
  - Response:
    ```json
    [
      { "id": "msg-1", "role": "user", "content": "Hi" },
      { "id": "msg-2", "role": "assistant", "content": "Hello!" }
    ]
    ```
- **Send Message (Ask AI):**
  - `POST /assistances/:assistantId/threads/:threadId/messages`
  - Request body:
    ```json
    { "role": "user", "content": "What is in my docs?" }
    ```
  - Response:
    ```json
    { "id": "msg-3", "role": "user", "content": "What is in my docs?" }
    ```
- **Run Thread (Get AI Response):**
  - `POST /assistances/:assistantId/threads/:threadId/run`
  - Request body:
    ```json
    { "role": "user", "content": "What is in my docs?" }
    ```
  - Response:
    ```json
    { "id": "msg-4", "role": "assistant", "content": "Here is what I found..." }
    ```

---

## 3. File Upload & Management

- **List Files:**
  - `GET /assistances/:assistantId/files`
  - Response:
    ```json
    {
      "assistant_id": "asst_xxx",
      "vector_store_ids": ["vs_..."],
      "files": [
        { "id": "file-abc", "filename": "doc.pdf", "size": 12345 }
      ]
    }
    ```
- **Upload File:**
  - `POST /assistances/:assistantId/files` (form-data, field: `file`)
  - Response:
    ```json
    {
      "vectorStoreId": "vs_...",
      "file": { "id": "file-abc", "originalName": "doc.pdf", "size": 12345 }
    }
    ```
- **Delete File:**
  - `DELETE /assistances/:assistantId/files/:fileId`
  - Response:
    ```json
    { "id": "file-abc", "deleted": true }
    ```

---

## 4. UI Structure (React + Tailwind)

- **Sidebar:**
  - List assistants
  - List threads for selected assistant
  - Button: Start new thread
- **Main Panel:**
  - Conversation view (messages)
  - Text input for user message
  - Button: Ask AI
  - File upload button (accepts PDF, DOCX, TXT)
  - List of uploaded files (with delete option)

---

## 5. Example Component Structure

- `<AssistanceSidebar />` — assistants, threads, new thread
- `<Conversation />` — messages, input, ask AI
- `<FileUpload />` — upload, list, delete files

---

## 6. Example: Fetching Files

```js
fetch(`${baseUrl}/assistances/${assistantId}/files`)
  .then(res => res.json())
  .then(data => setFiles(data.files));
```

---

## 7. Tailwind UI Tips
- Use `flex`, `gap`, `rounded`, `shadow`, `bg-gray-100`, etc. for layout.
- Use `overflow-y-auto` for scrollable message lists.
- Use `input`, `button`, and `form` classes for controls.
- Use `accept=".pdf,.docx,.txt"` on file input.

---

## 8. Quick Start

1. Clone the repo and install dependencies.
2. Set `baseUrl` to `http://localhost:4444` in your React app.
3. Use the above endpoints to build your UI.
4. Style with Tailwind for a modern look.

---

**This doc is a starting point. Expand as you build!** 
