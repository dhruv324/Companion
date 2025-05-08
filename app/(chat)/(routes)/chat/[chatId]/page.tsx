import prismadb from "@/lib/prismadb";
// import { auth } from "@clerk/nextjs";
import { RedirectToSignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import ChatClient from "./components/client";
import { auth } from "@clerk/nextjs/server";

interface ChatIdPageProps {
    params: {
        chatId: string;
    }
}

const ChatIdPage = async({
    params
}: ChatIdPageProps) => {
    const { userId } = auth();

    if (!userId) {
        // Use the component-based redirect instead of the deprecated function
        return <RedirectToSignIn />;
    }

    const companion = await prismadb.companion.findUnique({
        where: {
            id: params.chatId,
        },
        include: {
            messages: {
                orderBy: {
                    createdAt: "asc"
                },
                where: {
                    userId
                }
            },
            _count: {
                select: {
                    messages: true
                }
            }
        }
    });

    if (!companion) {
        return redirect("/");
    }

    return (
        <div>
            <ChatClient companion={companion} />
        </div>
    );
}
 
export default ChatIdPage;