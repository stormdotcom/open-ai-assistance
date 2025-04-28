require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const assistanceRoutes = require("./routes/assistances");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: "http://localhost:5174" }));
app.use(morgan("dev"));

app.use("/assistances", assistanceRoutes);

// 404 not found handler
app.use((req, res, next) => {
  res.status(404).json({ error: "Not Found" });
});

// global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🚀 Server listening on http://localhost:${port}`));
