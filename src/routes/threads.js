const express = require("express");
const {
  createThread,
  listThreads,
  addMessage,
  listMessages,
  getMessage,
  modifyMessage,
  deleteThreadApi,
  runThread,
  runThreadSync,
  createThreadAndRun,
  listRuns,
  askAI,

  postRun,
  pollRunThread
} = require("../controllers/threadController");
const router = express.Router({ mergeParams: true });

// Base routes
router.post("/", createThread);
router.get("/", listThreads);

// Ask AI routes (must be before threadId routes)
router.get("/ask", askAI);
router.post("/ask", askAI);

// Thread-specific routes
router.get("/:threadId/messages", listMessages);

router.post("/:threadId/runs", postRun);
router.get("/:threadId/runs/:runId", pollRunThread);

router.post("/:threadId/messages", addMessage);
router.get("/:threadId/messages/:messageId", getMessage);
router.post("/:threadId/messages/:messageId", modifyMessage);
router.delete("/:threadId", deleteThreadApi);
router.post("/:threadId/run", runThread);
router.post("/:threadId/run/sync", runThreadSync);
router.post("/run", createThreadAndRun);
router.get("/:threadId/runs", listRuns);

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('Thread route error:', err);
  res.status(err.status || 500).json({
    error: err.message,
    details: err.stack
  });
});

module.exports = router;
