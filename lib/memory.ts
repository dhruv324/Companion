import { Redis } from "@upstash/redis";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";

export type CompanionKey = {
    companionName: string;
    modelName: string;
    userId: string;
};

export class MemoryManager {
    private static instance: MemoryManager;
    private history: Redis;
    private vectorDBClient: Pinecone;

    private constructor() {
        this.history = Redis.fromEnv();
        this.vectorDBClient = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY!,
        });
    }

    public async vectorSearch(
        recentChatHistory: string,
        companionFileName: string,
    ) {
        const pineconeIndex = this.vectorDBClient.Index(process.env.PINECONE_INDEX!);

        const vectorStore = await PineconeStore.fromExistingIndex(
            new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY! }),
            { pineconeIndex }
        );

        const similarDocs = await vectorStore.similaritySearch(recentChatHistory, 3, { filename: companionFileName })
            .catch((err: any) => {
                console.log("Failed to get vector search results", err);
            });

        return similarDocs;
    }

    public static async getInstance(): Promise<MemoryManager> {
        if (!MemoryManager.instance) {
            MemoryManager.instance = new MemoryManager();
        }
        return MemoryManager.instance;
    }

    private generateRedisCompanionKey(companionKey: CompanionKey): string {
        return `${companionKey.companionName}-${companionKey.modelName}-${companionKey.userId}`;
    }

    public async writeToHistory(text: string, companionKey: CompanionKey) {
        if (!companionKey || typeof companionKey.userId === "undefined") {
            console.log("Companion key set incorrectly");
            return "";
        }

        const key = this.generateRedisCompanionKey(companionKey);
        const result = await this.history.zadd(key, {
            score: Date.now(),
            member: text,
        });

        // Keep only the last 20 messages in Redis
        const count = await this.history.zcard(key);
        if (count > 20) {
            await this.history.zremrangebyrank(key, 0, count - 21);
        }

        return result;
    }

    public async readLatestHistory(companionKey: CompanionKey): Promise<string> {
        if (!companionKey || typeof companionKey.userId === "undefined") {
            console.log("Companion key set incorrectly");
            return "";
        }

        const key = this.generateRedisCompanionKey(companionKey);
        let result = await this.history.zrange(key, 0, Date.now(), {
            byScore: true,
        });

        // Limit to last 10 messages for better context management
        result = result.slice(-10).reverse();
        const recentChats = result.reverse().join("\n");
        return recentChats;
    }

    public async seedChatHistory(
        seedContent: string,
        delimiter: string = "\n",
        companionKey: CompanionKey
    ) {
        const key = this.generateRedisCompanionKey(companionKey);
        
        // Clear existing history before seeding
        await this.history.del(key);

        const content = seedContent.split(delimiter);
        let counter = 0;

        for (const line of content) {
            if (line.trim()) {  // Only add non-empty lines
                await this.history.zadd(key, { score: counter, member: line });
                counter += 1;
            }
        }
    }
}