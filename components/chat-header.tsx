"use client";

import axios from "axios";
import { Companion, Message } from "@prisma/client";
import { Button } from "./ui/button";
import {
  ChevronLeft,
  Edit2,
  MessagesSquare,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { BotAvatar } from "./bot-avatar";
import { useUser } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface ChatHeaderProps {
  companion: Companion & {
    messages: Message[];
    _count: {
      messages: number;
    };
  };
}

const ChatHeader = ({ companion }: ChatHeaderProps) => {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();

  const onDelete = async () => {
    try {
      await axios.delete(`/api/companion/${companion.id}`);
      
      toast({
        description: "Success",
      });

      router.refresh();
      router.push("/");
    } catch (error) {
      toast({
        description: "Failed to delete companion",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex bg-[#1e1e21]  w-full justify-between items-center border-b border-primary/20 pb-6 px-2 sm:px-4">
      <div className="flex mt-4 items-center gap-x-2 overflow-hidden">
        <Button 
          onClick={() => router.back()} 
          size="icon" 
          variant="ghost"
          className="hidden sm:flex"
        >
          <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
        </Button>
        
        <div className="flex items-center gap-2">
          <BotAvatar src={companion.src} />
          
          <div className="flex flex-col gap-y-1 overflow-hidden">
            <div className="flex items-center gap-x-2">
              <p className="font-bold text-sm sm:text-base truncate">
                {companion.name}
              </p>
              
              <div className="flex items-center text-xs text-muted-foreground">
                <MessagesSquare className="w-3 h-3 mr-1 hidden sm:block" />
                <span className="hidden sm:block">{companion._count.messages}</span>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-none">
              Created by {companion.username}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-x-2">
        <div className="flex sm:hidden items-center text-xs text-muted-foreground">
          <MessagesSquare className="w-3 h-3 mr-1" />
          {companion._count.messages}
        </div>
        
        {user?.id === companion.userId && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() => router.push(`/companion/${companion.id}`)}
                className="cursor-pointer"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onDelete}
                className="cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;