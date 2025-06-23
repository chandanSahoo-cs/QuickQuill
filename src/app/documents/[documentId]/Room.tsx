"use client";

import { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { useParams } from "next/navigation";

export function Room({ children }: { children: ReactNode }) {
    const params = useParams()
    
  return (
    <LiveblocksProvider publicApiKey={"pk_dev_roa7S0PU0dGUjrEY-KS0fI35JZ4YR7b7BOiJxRYxuPrwaxbfIFjRbNUm_unAZFxq"}>
      <RoomProvider id={params.documentId as string}>
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}