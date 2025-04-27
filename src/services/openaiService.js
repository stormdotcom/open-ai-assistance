// OpenAI service configuration
const OpenAI = require("openai");

// Instantiate OpenAI client; it reads API key from process.env.OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

module.exports = { openai };
