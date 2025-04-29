const express = require("express");

const fileRoutes = require("./files.js");
const threadRoutes = require("./threads.js");
const { createAssistance, listAssistances, getAssistanceById, updateAssistance, deleteAssistance } = require("../controllers/assistanceController.js");
const router = express.Router();

router.post("/", createAssistance);
router.get("/", listAssistances);
router.get("/:assistantId", getAssistanceById);
router.put("/:assistantId", updateAssistance);
router.delete("/:assistantId", deleteAssistance);

// mount sub‐routers
router.use("/files", fileRoutes);
router.use("/threads", threadRoutes);

module.exports = router;
