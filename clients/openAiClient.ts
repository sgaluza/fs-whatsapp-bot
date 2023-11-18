import { OpenAI } from 'openai';

// Load your OpenAI API key from an environment variable or a config file
const openAiApiKey = process.env.OPENAI_API_KEY;

// Initialize the OpenAI client with your API key
const openAiClient = new OpenAI({
    apiKey: openAiApiKey,
});

export { openAiClient };
