const express = require("express");
const {
  createThread,
  listThreads,
  addMessage,
  listMessages,
  runThread,
  runThreadSync,
  deleteMessage
} = require("../controllers/threadController");
const router = express.Router({ mergeParams: true });

router.post("/", createThread);
router.get("/", listThreads);
router.get("/:threadId/messages", listMessages);
router.post("/:threadId/messages", addMessage);
router.delete("/:threadId/messages/:messageId", deleteMessage);
router.post("/:threadId/run", runThread);
router.post("/:threadId/run/sync", runThreadSync);

module.exports = router;
