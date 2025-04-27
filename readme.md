POST /assistances → create a new “assistance”

GET /assistances → list all assistances

POST /assistances/:assistanceId/files → upload a file to that assistance

DELETE /assistances/:assistanceId/files/:fileId → remove a file

POST /assistances/:assistanceId/threads → create a new thread in that assistance

GET /assistances/:assistanceId/threads → list threads

POST /assistances/:assistanceId/threads/:threadId/messages → add a message (role+content)

POST /assistances/:assistanceId/threads/:threadId/run → send all messages to OpenAI and 