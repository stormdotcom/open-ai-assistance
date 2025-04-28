const express = require("express");

const fileRoutes = require("./files.js");
const threadRoutes = require("./threads.js");
const { createAssistance, listAssistances, getAssistance, updateAssistance, deleteAssistance } = require("../controllers/assistanceController.js");
const router = express.Router();

router.post("/", createAssistance);
router.get("/", listAssistances);
router.get("/:assistanceId", getAssistance);
router.put("/:assistanceId", updateAssistance);
router.delete("/:assistanceId", deleteAssistance);

// mount sub‐routers
router.use("/:assistanceId/files", fileRoutes);
router.use("/:assistanceId/threads", threadRoutes);

module.exports = router;
