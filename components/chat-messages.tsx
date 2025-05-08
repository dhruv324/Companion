"use client";
import { Companion } from "@prisma/client";
import { ChatMessage, ChatMessageProps } from "./chat-message";
import { ElementRef, useEffect, useRef, useState } from "react";

interface ChatMessagesProps {
  messages: ChatMessageProps[];
  isLoading: boolean;
  companion: Companion;
}

export const ChatMessages = ({
  messages = [],
  isLoading,
  companion,
}: ChatMessagesProps) => {
  const scrollRef = useRef<ElementRef<"div">>(null);
  const [fakeLoading, setFakeLoading] = useState(
    messages.length === 0 ? true : false
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFakeLoading(false);
    }, 1000);
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    scrollRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Get the last message from the AI to display loading within it
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const lastMessageIsFromUser = lastMessage?.role === "user";

  return (
    <div className="flex-1 overflow-y-auto pr-4 mb-4 pb-[80px]">
      <div className="space-y-4">
        {/* Initial greeting message with fake loading */}
        <ChatMessage
          isLoading={fakeLoading}
          src={companion.src}
          role="system"
          content={`Hello, I am ${companion.name}, ${companion.description}`}
        />

        {/* Display all messages except potentially the last one */}
        {messages.map((message, index) => (
          <ChatMessage
            key={`${message.content}-${index}`} // Use index to make key more unique
            src={companion.src}
            role={message.role}
            content={message.content}
            isLoading={isLoading && index === messages.length - 1 && !lastMessageIsFromUser}
          />
        ))}

        {/* Only show a separate loading message if the last message was from the user */}
        {isLoading && lastMessageIsFromUser && (
          <ChatMessage 
            role="system"
            src={companion.src}
            isLoading={true} 
          />
        )}
        
        <div ref={scrollRef} />
      </div>
    </div>
  );
};

export default ChatMessages;