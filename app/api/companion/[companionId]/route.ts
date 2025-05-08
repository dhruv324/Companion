import { NextResponse } from "next/server"; 
import prismadb from "@/lib/prismadb";
import { auth, currentUser } from '@clerk/nextjs/server';

export async function PATCH(
    req: Request,
    {params} : { params : {companionId:string}}

) {
    try {
        const body = await req.json();
        const user = await currentUser();

        // Log the user information to verify Clerk middleware
        console.log("User fetched by Clerk: ", user);

        // Destructure the request body to get the required fields
        const { src, name, description, instructions, seed, categoryId } = body;

        if (!params.companionId){
            return new NextResponse("Unauthorized" , {status: 401});
        }
        
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
        const companion = await prismadb.companion.update({
            where:  {
                id : params.companionId,
                userId: user.id,
            },
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
        console.log("[COMPANION_PATCH] Internal server error: ", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE (
    request: Request,
    {params} : { params : {companionId:string}}

){
    try {  
        const {userId} = auth();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
  const companion = await prismadb.companion.delete({
    where : {
        userId,
        id: params.companionId,
    }
  });

  return NextResponse.json(companion);
        
    } catch (error) {
        console.log("[COMPANION_DELETE]  ", error);
        return new NextResponse("Internal Server Error", { status: 500 });
        
    }
}