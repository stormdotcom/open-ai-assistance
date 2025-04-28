# API Endpoints

This service integrates with the OpenAI Assistants API to manage intelligent agents, their files (vector store), and conversation threads.

## Assistants

### Create an Assistant

POST `/assistances`

**Request body**  

```json
{
  "name": "string",
  "instructions": "string (optional)"
}
```

**Response (201 Created)**  

```json
{
  "id": "assistant-id",
  "object": "assistant",
  "name": "string",
  "instructions": "string",
  "model": "gpto",
  // ... other OpenAI assistant metadata ...
}
```

### List All Assistants

GET `/assistances`

**Response (200 OK)**  

```json
[
  {
    "id": "assistant-id",
    "object": "assistant",
    "name": "string",
    "instructions": "string",
    "model": "gpto",
    // ...
  },
  ...
]
```

### Retrieve an Assistant

GET `/assistances/:assistantId`

**Response (200 OK)**  

```json
{
  "id": "assistant-id",
  "object": "assistant",
  "name": "string",
  "instructions": "string",
  "model": "gpto",
  // ...
}
```

### Update an Assistant

PUT `/assistances/:assistantId`

**Request body**  

```json
{
  "name": "string (optional)",
  "instructions": "string (optional)",
  "add_files": [{ "file_id": "string" }],    // optional
  "remove_files": ["string"]                // optional
}
```

**Response (200 OK)**  

```json
{
  "id": "assistant-id",
  "object": "assistant",
  "name": "string",
  "instructions": "string",
  "model": "gpto",
  // ...
}
```

### Delete an Assistant

DELETE `/assistances/:assistantId`

**Response (204 No Content)**

---

## Files

Files uploaded under an assistant are ingested into a single OpenAI Vector Store per assistant for semantic retrieval.

### Get Vector Store IDs

GET `/assistances/:assistantId/files`
**Response (200 OK)**

```json
{ "vectorStoreIds": ["string"] }
```

### Upload a File

POST `/assistances/:assistantId/files`  
**Form Data**  

- `file`: file to upload (PDF, DOCX, TXT; max 5 MB)

**Response (201 Created)**  

```json
{
  "vectorStoreId": "string",
  "file": {
    "id": "string",
    "originalName": "string",
    "mimetype": "string",
    "size": 12345
  }
}
```

### Delete a File

DELETE `/assistances/:assistantId/files/:fileId`

**Response (200 OK)**  

```json
{
  "id": "file-id",
  "deleted": true
}
```

---

## Threads

Conversations under an assistant are organized in threads.

### Create a Thread

POST `/assistances/:assistantId/threads`

**Response (201 Created)**  

```json
{
  "id": "thread-id",
  "messages": []
}
```

### List Threads

GET `/assistances/:assistantId/threads`

**Response (200 OK)**  

```json
[
  {
    "id": "thread-id",
    "messages": []
  },
  ...
]
```

### Add a Message

POST `/assistances/:assistantId/threads/:threadId/messages`

**Request body**  

```json
{
  "role": "user" | "assistant",
  "content": "string"
}
```

**Response (201 Created)**  

```json
{
  "id": "message-id",
  "thread_id": "thread-id",
  "role": "user" | "assistant",
  "content": "string",
  "created_at": 1616161616
}
```

### Run a Thread

POST `/assistances/:assistantId/threads/:threadId/run`

**Response (200 OK)**  

```json
{
  "id": "message-id",
  "thread_id": "thread-id",
  "role": "assistant",
  "content": "string",
  "created_at": 1616161616
}

```

### Run a Thread (Streaming)

POST `/assistances/:assistantId/threads/:threadId/run` (with streaming)

This endpoint streams the assistant's reply in real time using Server-Sent Events (SSE).

**Response (streaming, text/event-stream)**

Each event contains a chunk of the assistant's reply:

```
data: { "id": "message-id", "content": "partial or full content..." }

```

**How to use:**
- Set the `Accept` header to `text/event-stream` (or use an SSE-compatible client).
- Listen for `data:` events and concatenate the `content` fields to reconstruct the full reply.

**Example (curl):**
```sh
curl -N -H "Accept: text/event-stream" -X POST http://localhost:3000/assistances/asst_xxx/threads/thread_xxx/run
```
