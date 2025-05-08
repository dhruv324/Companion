import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { MemoryManager } from "@/lib/memory";
import { rateLimit } from "@/lib/rate-limit";
import prismadb from "@/lib/prismadb";

export async function POST(
    request: Request,
    { params }: { params: { chatId: string } }
) {
    try {
        const { prompt } = await request.json();
        const user = await currentUser();

        if (!user || !user.firstName || !user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const identifier = `${request.url}-${user.id}`;
        const { success } = await rateLimit(identifier);

        if (!success) {
            return new NextResponse("Rate limit exceeded", { status: 429 });
        }

        // Save user message
        const companion = await prismadb.companion.update({
            where: {
                id: params.chatId,
            },
            data: {
                messages: {
                    create: {
                        content: prompt,
                        role: "user",
                        userId: user.id,
                    }
                }
            }
        });

        if (!companion) {
            return new NextResponse("Companion Not Found", { status: 404 });
        }

        const name = companion.id;
        const companion_file_name = `${name}.txt`;

        const companionKey = {
            companionName: name,
            userId: user.id,
            modelName: "llama4-scout-17b-instruct",
        };

        const memoryManager = await MemoryManager.getInstance();

        const records = await memoryManager.readLatestHistory(companionKey);

        if (records.length === 0) {
            await memoryManager.seedChatHistory(companion.seed, "\n\n", companionKey);
        }

        await memoryManager.writeToHistory(`User: ${prompt}\n`, companionKey);

        const recentChatHistory = await memoryManager.readLatestHistory(companionKey);
        const similarDocs = await memoryManager.vectorSearch(recentChatHistory, companion_file_name);

        let relevantHistory = "";
        if (similarDocs && similarDocs.length !== 0) {
            relevantHistory = similarDocs.map((doc) => doc.pageContent).join("\n");
        }

        // Full response to store after completion
        let fullResponse = "";
        
        // Process the response server-side and only send one complete message
        const query = `
Instructions for response format (STRICTLY FOLLOW THESE):
1. Write in a natural, conversational style that feels human.
2. Use a mix of sentence lengths, including some with commas, for natural flow.
3. Maintain the character's personality through word choice and speaking style.
4. Be friendly, engaging, and sound like a real person chatting.
5. Use casual language with contractions (I'm, don't, it's, etc.).
6. Include occasional filler words (well, you know, honestly) for authenticity.
7. Express enthusiasm and emotion where appropriate.
8. Keep responses concise but natural - about 2-4 sentences per message.
9. Only respond to the last message in a complete thought.
10. Use emojis very sparingly (maximum 1 per message) if appropriate.
11. Avoid repetitive answers or phrasing.
12. Respond in a way that encourages continued conversation.
13. Keep the overall tone warm and approachable.
14. Match the user's level of formality and energy.

Character Background:
${companion.instructions}

Relevant Past Context (for reference only):
${relevantHistory}

Most Recent Messages:
${recentChatHistory.split('\n').slice(-2).join('\n')}

Current user message to respond to:
User: ${prompt}

${companion.name}: 
`;

        try {
            // Groq fetch API call
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "meta-llama/llama-4-scout-17b-16e-instruct",
                    messages: [
                        {
                            role: "system",
                            content: query
                        }
                    ],
                    temperature: 0.3,
                    top_p: 0.8,
                    stream: true,
                    max_tokens: 2048,
                    frequency_penalty: 0.5,
                    presence_penalty: 1.2
                })
            });

            if (!response.ok) {
                throw new Error(`Groq API error: ${response.status}`);
            }

            if (!response.body) {
                throw new Error("No response body");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            // Collect the entire response first
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split("\n");
                
                for (const line of lines) {
                    if (line.startsWith("data:") && line !== "data: [DONE]") {
                        try {
                            const data = JSON.parse(line.substring(5));
                            if (data.choices[0]?.delta?.content) {
                                fullResponse += data.choices[0].delta.content;
                            }
                        } catch (e) {
                            console.error("Error parsing SSE data:", e);
                        }
                    }
                }
            }

            // Save AI response to database (no longer removing commas)
            await prismadb.companion.update({
                where: {
                    id: params.chatId
                },
                data: {
                    messages: {
                        create: {
                            content: fullResponse,
                            role: "system",
                            userId: user.id
                        }
                    }
                }
            });
            
            // Return the complete message
            return new NextResponse(fullResponse);

        } catch (error) {
            console.error("Error during model call:", error);
            return new NextResponse("Error generating response", { status: 500 });
        }

    } catch (error) {
        console.error("[CHAT_POST] Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}