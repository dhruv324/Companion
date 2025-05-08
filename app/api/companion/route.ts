import { NextResponse } from "next/server"; 
import prismadb from "@/lib/prismadb";
import { currentUser } from '@clerk/nextjs/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const user = await currentUser();

        // Log the user information to verify Clerk middleware
        console.log("User fetched by Clerk: ", user);

        // Destructure the request body to get the required fields
        const { src, name, description, instructions, seed, categoryId } = body;
        
        // Check if the user exists and has the necessary fields
        if (!user || !user.id || !user.firstName) {
            console.log("Unauthorized: No user or missing user fields.");
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Validate if the required fields are provided in the request body
        if (!src || !name || !description || !instructions || !seed || !categoryId) {
            console.log("Missing required fields in the request body.");
            return new NextResponse("Missing Required Fields", { status: 400 });
        }

        // Create the companion in the database
        const companion = await prismadb.companion.create({
            data: {
                categoryId,
                userId: user.id,
                username: user.firstName,
                src,
                name,
                description,
                instructions,
                seed,
            }
        });

        // Return the created companion data as JSON
        return NextResponse.json(companion);

    } catch (error) {
        console.log("[COMPANION_POST] Internal server error: ", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
