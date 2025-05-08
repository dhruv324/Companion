import { Companion } from "@prisma/client";
import Image from "next/image";
import { Card, CardFooter, CardHeader } from "./ui/card";
import Link from "next/link";
import { MessagesSquare } from "lucide-react";

interface CompanionProps {
  data: (Companion & {
    _count: {
      messages: number;
    };
  })[];
}

export const Companions = ({ data }: CompanionProps) => {
  if (data.length === 0) {
    return (
      <div className="pt-10 flex flex-col items-center justify-center space-y-3">
        <div className="relative w-48 h-48 sm:w-60 sm:h-60">
          <Image fill className="grayscale" alt="Empty" src="/empty.png" />
        </div>
        <p className="mt-4 text-xl sm:text-2xl text-muted-foreground">
          No Companions Found.
          {/* <h3 className="text-sm">(click on create for your 1st companion)</h3> */}
        </p>
        <p className="mt-4 text-sm sm:text-sm text-muted-foreground">
          [Website can be a bit slow due to free database issues , click on create for your 1st companion]
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 pb-10">
      {data.map((item) => (
        <Link href={`/chat/${item.id}`} key={item.id}>
          <Card
            className="bg-primary/10 rounded-xl cursor-pointer
                     hover:opacity-75 transition border-0"
          >
            <CardHeader
              className="flex flex-col items-center justify-center text-center
                        text-muted-foreground"
            >
              <div className="relative w-24 h-24 sm:w-32 sm:h-32">
                <Image
                  src={item.src}
                  fill
                  className="rounded-xl object-cover"
                  alt="Companion"
                />
              </div>
              <p className="font-bold mt-2">{item.name}</p>
              <p className="font-xs text-muted-foreground">{item.description}</p>
            </CardHeader>
            <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
              <p className="lowercase">{`@${item.username}`}</p>
              <div className="flex items-center">
                <MessagesSquare className="w-3 h-3 mr-1" />
                {item._count.messages}
              </div>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
};