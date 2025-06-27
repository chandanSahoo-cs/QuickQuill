"use server";

import CustomClaims from "@/types/custom-claims";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

// const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!)
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function getDocuments(ids: Id<"documents">[]) {
  return await convex.query(api.documents.getByIds, { documentIds: ids });
}

export async function getUser() {
  try {
    const { sessionClaims } = await auth();
    const clerk = await clerkClient();

    const response = await clerk.users.getUserList({
      organizationId: [(sessionClaims as CustomClaims)?.o?.id as string],
    });

    if (!response) {
      throw new Error("Failed to fetch user details");
    }

    const users = response.data.map((user) => ({
      id: user.id,
      name:
        user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Anonymous",
      avatar: user.imageUrl,
      color: "",
    }));

    return users;
  } catch (error) {
    console.error(error);
  }
}
