require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const assistanceRoutes = require("./routes/assistances");

const app = express();
app.use(bodyParser.json());

app.use("/assistances", assistanceRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🚀 Server listening on http://localhost:${port}`));
