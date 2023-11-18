import * as dotenv from 'dotenv';
dotenv.config();

import Fastify from 'fastify';
import formbody  from '@fastify/formbody';
import OpenAI from 'openai';

import { getDatabase, openAiClient, User, twilioClient } from './clients'; // Import Twilio and OpenAI clients

const fastify = Fastify({ logger: true });
fastify.register(formbody);

let db = null;

fastify.post('/whatsapp', async (request, reply) => {

    const assistantIdToUse = process.env.OPENAI_ASSISTANT; // Replace with your assistant ID
    const modelToUse = "gpt-4-1106-preview"; // Specify the model you want to use

    const {Body: message, WaId: whatsappId, From: from } = request.body as any; 

    let threadId = await User.findThreadIdByWhatsappId(whatsappId);
    const threadsApi = new OpenAI.Beta.Threads(openAiClient);

    if(!threadId) {
        const thread = await threadsApi.create();
        threadId = thread.id;
        await User.createUser(whatsappId, thread.id);
    }


    

    if(threadId) {

        const sendReply = async (threadId: string) => {
            const allMessages = await threadsApi.messages.list(threadId);
            const message = (allMessages.data[0].content[0] as any)['text'].value;
            console.log(message);
            await twilioClient.messages.create({
                body: message,
                to: from,
                from: 'whatsapp:+14155238886'
            })
        }

        const waitRunForStatus = async(run: OpenAI.Beta.Threads.Runs.Run, statuses: string[]) => {

            while(statuses.indexOf(run.status) == -1) {
                run = await threadsApi.runs.retrieve(
                    threadId as string,
                    run.id
                  );
            }
            return run;
        }

        const handleApproval = async (run: OpenAI.Beta.Threads.Runs.Run) => {

            console.log('FUNCTION!!!')

            await threadsApi.runs.submitToolOutputs(run.thread_id, run.id, {
                tool_outputs: [{tool_call_id: run.required_action?.submit_tool_outputs.tool_calls[0].id, output: 'Sent to moderator.'}]
            });
            run = await waitRunForStatus(run, ['completed']);
            
            await threadsApi.messages.create(run.thread_id, {
                role: 'user',
                content: 'Now create in English the whole advertisement please and write it as plain text'
            });

            run = await threadsApi.runs.create(run.thread_id, {
                assistant_id: process.env.OPENAI_ASSISTANT as string
            });
            run = await waitRunForStatus(run, ['completed']);
            await sendReply(run.thread_id);
        }

        const runsRunnning = await threadsApi.runs.list(threadId);
        if(runsRunnning?.data?.length && runsRunnning.data[0].status == 'requires_action') {
            const run = runsRunnning.data[0];
            await handleApproval(run);
        } else {
            await threadsApi.messages.create(threadId, {
                role: 'user',
                content: message
            });
            let run = await threadsApi.runs.create(threadId, {
                assistant_id: process.env.OPENAI_ASSISTANT as string
            });
            
    
           
            run = await waitRunForStatus(run, ['completed', 'requires_action']);

            if(run.status == 'requires_action') {
                await handleApproval(run);
            }
            else {
                await sendReply(threadId);
            }
            
        }
    } else {
        reply.status(200).send('Message processed');
    }
});


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
