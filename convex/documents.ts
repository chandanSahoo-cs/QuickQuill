import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    title: v.optional(v.string()),
    initialContent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Unauthorized");
    }

    const now = new Date().toISOString();

    // Create Doc without currentCommitId

    try {
      const docId = await ctx.db.insert("documents", {
        title: args.title ?? "Untitled Document",
        ownerId: user.subject,
        initialContent: args.initialContent,
        createdAt: now,
        updatedAt: now,
        currentCommitId: undefined,
      });

      if(!docId){
        throw new ConvexError("Failed to create the document")
      }

      const firstCommit = await ctx.db.insert("commits", {
        documentId: docId,
        parentCommitId: undefined,
        content: args.initialContent ?? "",
        message: "Initial commit",
        authorId: user.subject,
        createdAt: now,
      });

      if(!firstCommit){
        throw new ConvexError("Failed to link the document with the first commit")
      }

      const patch = await ctx.db.patch(docId, {
        currentCommitId: firstCommit,
      });

      return docId;
    } catch (error) {
      console.error("Create mutation failed:", error);
      throw new ConvexError("Something went wrong while creating the document.");
    }
  },
});

export const get = query({
  args : {paginationOpts : paginationOptsValidator},
  handler: async (ctx,args) => {
    return await ctx.db.query("documents").paginate(args.paginationOpts);
  },
});
