"use client";

import { ChatRequestOptions } from "ai";
import { ChangeEvent, FormEvent } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { SendHorizonal } from "lucide-react";

interface ChatFormProps {
  input: string;
  handleInputChange: (
    e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>
  ) => void;
  onSubmit: (
    e: FormEvent<HTMLFormElement>,
    chatRequestOptions?: ChatRequestOptions | undefined
  ) => void;
  isLoading: boolean;
}

export const ChatForm = ({
  input,
  handleInputChange,
  onSubmit,
  isLoading,
}: ChatFormProps) => {
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Clear input immediately
    const changeEvent = {
      target: { value: "" }
    } as ChangeEvent<HTMLInputElement>;
    handleInputChange(changeEvent);

    // Submit the form
    onSubmit(e);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#262626] z-50">
      <div className="max-w-4xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="py-4 px-4"
        >
          <div className="flex items-center gap-x-2">
            <Input
              disabled={isLoading}
              value={input}
              onChange={handleInputChange}
              placeholder="Type a message here.."
              className="rounded-3xl pl-4 bg-zinc-900 h-14 text-zinc-200 placeholder:text-zinc-400 focus:ring-1 focus:ring-zinc-600 border-zinc-700"
            />
            <Button 
              type="submit"
              className="hover:bg-zinc-900 h-12 w-12 rounded-full border border-zinc-700 transition-colors duration-200" 
              disabled={isLoading} 
              variant="ghost"
            >
              <SendHorizonal className="h-6 w-6 text-zinc-300" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatForm;