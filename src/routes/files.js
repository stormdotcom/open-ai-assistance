const express = require("express");
const multer = require("multer");
const { uploadFile, deleteFile } = require("../controllers/fileController");
const upload = multer({ dest: "uploads/" });
const router = express.Router({ mergeParams: true });

router.post("/", upload.single("file"), uploadFile);
router.delete("/:fileId", deleteFile);

module.exports = router;
