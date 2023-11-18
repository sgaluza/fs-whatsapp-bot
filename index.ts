import * as dotenv from 'dotenv';
dotenv.config();

import Fastify from 'fastify';
import formbody  from '@fastify/formbody';
import OpenAI from 'openai';

import { getDatabase, openAiClient, User } from './clients'; // Import Twilio and OpenAI clients

const fastify = Fastify({ logger: true });
fastify.register(formbody);

let db = null;

fastify.post('/whatsapp', async (request, reply) => {

    const assistantIdToUse = process.env.OPENAI_ASSISTANT; // Replace with your assistant ID
    const modelToUse = "gpt-4-1106-preview"; // Specify the model you want to use

    const {Body: message, WaId: whatsappId} = request.body as any; 

    const threadId = await User.findThreadIdByWhatsappId(whatsappId);

    if(!threadId) {
        const threadsApi = new OpenAI.Beta.Threads(openAiClient);
        
        const thread = await threadsApi.create();
        await User.createUser(whatsappId, thread.id);
    }

    reply.status(200).send('Message processed');
});

const moderateMessageWithOpenAI = async (message: string): Promise<boolean> => {
    return true;
};

const publishAd = (message: string) => {
    // Ad publishing logic
};

const start = async () => {
    try {
        db = getDatabase()
        await fastify.listen({ host: (process.env.HOST || '0.0.0.0'), port: +(process.env.PORT || 3000) });
        console.log(`Server running...`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
