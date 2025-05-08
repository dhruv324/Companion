"use client";

import { cn } from "../lib/utils";
import { Sparkles } from "lucide-react";
import { Poppins } from "next/font/google";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { useRouter } from "next/navigation"; // Import the useRouter hook
import { useClerk, UserButton } from "@clerk/nextjs"; // Use the Clerk hook

const font = Poppins({
  weight: "600",
  subsets: ["latin"],
});

export const Navbar = () => {
  const { signOut } = useClerk(); // Access Clerk's signOut method
  const router = useRouter(); // Initialize useRouter hook

  const handleSignOut = async () => {
    await signOut(); // Sign the user out
    router.push("/"); // Redirect to the homepage after sign-out
  };

  return (
    <div
      className="fixed w-full z-50 flex justify-between items-center
       py-2 px-4 border-b border-primary/10 bg-secondary h-16"
    >
      <div className="flex items-center">
        <MobileSidebar />
        <h1
          className={cn(
            "hidden md:block text-xl md:text-3xl font-bold text-primary",
            font.className
          )}
        >
          YourCompanion
        </h1>
      </div>
      <div className="flex items-center gap-x-3">
        <Button variant="default" size="sm">
          Upgrade
          <Sparkles className="h-4 w-4 fill-white text-white" />
        </Button>
        <ModeToggle />
        {/* Custom sign-out button */}
        <Button variant="secondary" size="sm" onClick={handleSignOut}>
          Sign Out
        </Button>
        {/* Optionally keep the UserButton for profile settings */}
        <UserButton />
      </div>
    </div>
  );
};
