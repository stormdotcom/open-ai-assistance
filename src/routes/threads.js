const express = require("express");
const {
  createThread,
  listThreads,
  addMessage,
  runThread,
  runThreadStream
} = require("../controllers/threadController");
const router = express.Router({ mergeParams: true });

router.post("/", createThread);
router.get("/", listThreads);
router.post("/:threadId/messages", addMessage);
router.post("/:threadId/run", runThread);

module.exports = router;
