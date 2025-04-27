# API Endpoints

## POST /assistances  
Create a new assistance.  
**Request body**  
```json
{ "name": "string" }
```  
**Response (201 Created)**  
```json
{
  "id": "uuid",
  "name": "string",
  "files": [],
  "threads": {}
}
```

## GET /assistances  
List all assistances.  
**Response (200 OK)**  
```json
[
  {
    "id": "uuid",
    "name": "string",
    "files": [],
    "threads": {}
  },
  ...
]
```

## POST /assistances/:assistanceId/files  
Upload a file to an assistance.  
**Response (201 Created)**  
```json
{
  "id": "file-id",
  "object": "file",
  "bytes": 12345,
  "created_at": 1616161616,
  "filename": "example.txt",
  // ...other OpenAI file metadata
}
```

## DELETE /assistances/:assistanceId/files/:fileId  
Remove a file from an assistance.  
**Response (200 OK)**  
```json
{
  "id": "file-id",
  "deleted": true
}
```

## POST /assistances/:assistanceId/threads  
Create a new thread under an assistance.  
**Response (201 Created)**  
```json
{
  "id": "thread-id",
  "messages": []
}
```

## GET /assistances/:assistanceId/threads  
List all threads for an assistance.  
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

## POST /assistances/:assistanceId/threads/:threadId/messages  
Add a message to a thread.  
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
  "role": "user" | "assistant",
  "content": "string"
}
```

## POST /assistances/:assistanceId/threads/:threadId/run  
Send all messages in a thread to OpenAI and receive an assistant reply.  
**Response (200 OK)**  
```json
{
  "role": "assistant",
  "content": "string"
}
