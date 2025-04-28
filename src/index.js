require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");
const assistanceRoutes = require("./routes/assistances");
const filesRoutes = require("./routes/files");
const cors = require("cors");

const app = express();

// Rate limiting middleware: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(limiter);
app.use(bodyParser.json());
app.use(cors({ origin: "http://localhost:5173" }));
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
