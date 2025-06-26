"use client";

import { FullScreenLoader } from "@/components/FullScreenLoader";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import { useParams } from "next/navigation";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getDocuments, getUser } from "./action";
import { Id } from "../../../../convex/_generated/dataModel";
import { LEFT_MARGIN_DEFAULT, RIGHT_MARGIN_DEFAULT } from "@/constants/margin";

type User = { id: string; name: string; avatar: string; color:string};

export function Room({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const fetchUsers = useCallback(
    () => async () => {
      console.log("Hello");
      try {
        const list = await getUser();
        setUsers(list || []);
      } catch (error) {
        console.log(error);
      }
    },
    []
  );

  useEffect(() => {
    fetchUsers()();
  }, [fetchUsers]);
  const params = useParams();
  return (
    <LiveblocksProvider
      throttle={16}
      authEndpoint={async () => {
        const endpoint = "/api/liveblocks-auth";
        const room = params.documentId as string;
        const response = await fetch(endpoint, {
          method: "POST",
          body: JSON.stringify({ room }),
        });

        return await response.json();
      }}
      resolveUsers={({ userIds }) => {
        return userIds.map(
          (userId) => users.find((user) => user.id === userId) ?? undefined
        );
      }}
      resolveMentionSuggestions={({ text }) => {
        let filteredUser = users;

        if (text) {
          filteredUser = users.filter((user) =>
            user.name.toLowerCase().includes(text.toLowerCase())
          );
        }

        return filteredUser.map((user) => user.id);
      }}
      resolveRoomsInfo={async({roomIds}) =>{
        const documents = await getDocuments(roomIds as Id<"documents">[]);
        return documents?.map((document)=>({
          id: document.id,
          name: document.name,
        }))
      }}>
      <RoomProvider id={params.documentId as string} initialStorage={{leftMargin:LEFT_MARGIN_DEFAULT, rightMargin:RIGHT_MARGIN_DEFAULT}}>
        <ClientSideSuspense fallback={<FullScreenLoader />}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
