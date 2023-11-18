import { Document, connect } from 'camo';

export class Advertisement extends Document<{
    id: string
    name: string,
    description: string
    photo: string,
    price: number,
    currency: string,
    contact: string
}> {
    constructor() {
        super();
    }
}

export class User extends Document<{
    _id: string,
    threadId: string,
    createOn: Date
}> {
    constructor() {
        super();
        this.schema({
            whatsappId: {
                type: String,
                required: true,
            },
            threadId: {
                type: String,
                required: true,
            },
            createdOn: {
                type: Date,
                required: true
            }
        });
    }

    static async findThreadIdByWhatsappId(whatsappId: string): Promise<string | null> {
        const user = await this.findOne({ whatsappId: whatsappId });
        if (user) {
            return user.threadId as string;
        } else {
            return null;
        }
    }

    static async createUser(whatsappId: string, threadId: string) {
        const user = await this.create({ whatsappId, threadId, createdOn: new Date() });
        await user.save();
    }

}

export async function getDatabase() {
    return await connect(process.env.MONGOURL as string)
} 
