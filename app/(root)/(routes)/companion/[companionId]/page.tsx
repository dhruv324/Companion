import prismadb from "@/lib/prismadb";
import { CompanionForm } from "./components/companion-form";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

interface CompanionIdPageProps {
  params: {
    companionId: string;
  };
}

const CompanionIdPage = async ({
  params
}: CompanionIdPageProps) => {
  
  const { userId } = auth();

  if (!userId) {
    // Redirect to your specific sign-in URL
    redirect("/sign-in"); // Change this to your actual sign-in route
  }

  const companion = await prismadb.companion.findUnique({
    where: {
      id: params.companionId,
      userId,
    },
  });

  const categories = await prismadb.category.findMany();

  return (
    <div>
      <CompanionForm 
        initialData={companion}
        categories={categories}
      />
    </div>
  );
}

export default CompanionIdPage;
