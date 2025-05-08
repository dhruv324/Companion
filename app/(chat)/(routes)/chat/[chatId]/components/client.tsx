"use client"

import { useChat } from "ai/react";  
import ChatHeader from "@/components/chat-header";
import { Companion, Message } from "@prisma/client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import ChatForm from "@/components/chat-form";
import ChatMessages from "@/components/chat-messages";
import { ChatMessageProps } from "@/components/chat-message";

interface ChatClientProps {
    companion: Companion & {
        messages: Message[];
        _count: {
            messages: number;
        }
    }
}

export const ChatClient = ({
    companion
}: ChatClientProps) => {
    const router = useRouter();
    const [messages, setMessages] = useState<ChatMessageProps[]>(companion.messages);
    const [isMessageLoading, setIsMessageLoading] = useState(false);

    const {
        input,
        isLoading,
        handleInputChange,
        setInput,
    } = useChat({
        api: `/api/chat/${companion.id}`,
        onResponse: (response) => {
            console.log('Starting response:', response);
        },
        onFinish: (message) => {
            setMessages((current) => {
                // Remove the loading message and add the final message
                const messagesWithoutLoading = current.filter(msg => !msg.isLoading);
                return [...messagesWithoutLoading, {
                    role: "system",
                    content: message.content,
                }];
            });
            setInput("");
            setIsMessageLoading(false);
            router.refresh();
        },
    });

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!input.trim()) return;

        try {
            // Add user message immediately
            const userMessage: ChatMessageProps = {
                role: "user",
                content: input,
            };
            
            // Add loading message
            const loadingMessage: ChatMessageProps = {
                role: "system",
                content: "",
                isLoading: true,
            };

            setMessages((current) => [...current, userMessage, loadingMessage]);
            setIsMessageLoading(true);

            // Make API call
            const response = await fetch(`/api/chat/${companion.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: input
                })
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            // Handle streaming response
            const reader = response.body?.getReader();
            if (!reader) return;

            let systemMessageContent = '';
            
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    
                    if (done) break;
                    
                    // Decode and accumulate the chunks
                    const text = new TextDecoder().decode(value);
                    systemMessageContent += text;
                    
                    // Update the messages with the accumulated content
                    setMessages((current) => {
                        // Remove any existing loading or system messages
                        const previousMessages = current.filter(msg => 
                            !msg.isLoading && 
                            (msg.role !== "system" || msg.content !== systemMessageContent)
                        );
                        
                        // Add the current system message and a new loading message
                        return [...previousMessages, 
                            {
                                role: "system",
                                content: systemMessageContent
                            },
                            {
                                role: "system",
                                content: "",
                                isLoading: true
                            }
                        ];
                    });
                }
            } finally {
                reader.releaseLock();
                // Remove the final loading message
                setMessages((current) => current.filter(msg => !msg.isLoading));
                setIsMessageLoading(false);
            }

            // Refresh the router after completion
            router.refresh();
            setInput("");

        } catch (error) {
            console.error("Error sending message:", error);
            setIsMessageLoading(false);
            // Remove loading message on error
            setMessages((current) => current.filter(msg => !msg.isLoading));
        }
    }

    return (
        <div className="flex flex-col h-screen">
            <div className="flex-1 flex flex-col p-4">
                <ChatHeader companion={companion} />
                <ChatMessages
                    companion={companion}
                    isLoading={isMessageLoading}
                    messages={messages}
                />
                <ChatForm
                    isLoading={isLoading || isMessageLoading}
                    input={input}
                    handleInputChange={handleInputChange}
                    onSubmit={onSubmit}
                />
            </div>
        </div>
    );
}

export default ChatClient;