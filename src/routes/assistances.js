const express = require("express");

const fileRoutes = require("./files.js");
const threadRoutes = require("./threads.js");
const { createAssistance, listAssistances, getAssistance, updateAssistance, deleteAssistance } = require("../controllers/assistanceController.js");
const router = express.Router();

// router.post("/", createAssistance);
router.get("/", listAssistances);
router.get("/:assistantId", getAssistance);
router.put("/:assistantId", updateAssistance);
router.delete("/:assistantId", deleteAssistance);

// mount sub‐routers
router.use("/:assistantId/files", fileRoutes);
router.use("/:assistantId/threads", threadRoutes);

module.exports = router;
