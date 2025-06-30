import { hashContent } from "@/lib/hash";
import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Take id of the document
// Find that document
// Take title,currentCommitId and authorId from the document
// Take content from editor.html
// check if it matches lastcommits content hash
// hash the content
// parentCommitId = currentCommitId
// create the commit
// change the currentCommitId to id of the new commit

export const commitDoc = mutation({
  args: {
    documentId: v.id("documents"),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new ConvexError("Unauthorized");
    }

    const document = await ctx.db.get(args.documentId);

    if (!document) {
      throw new ConvexError("Document not found");
    }

    const content = args.content || "";
    const hashedContent = hashContent(content);

    const now = new Date().toISOString();
    const formattedNow = new Intl.DateTimeFormat("en-IN", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date());

    try {
      const count = await ctx.db
        .query("commits")
        .withIndex("by_document_id", (q) => q.eq("documentId", args.documentId))
        .collect();

      const newCommitNumber = count.length + 1;

      const currentCommitId = document.currentCommitId;

      if (!currentCommitId) {
        throw new ConvexError("Current commit Id not found");
      }
      const currentCommit = await ctx.db.get(currentCommitId);

      if (!currentCommit) {
        throw new ConvexError("Current commit not found");
      }

      if (currentCommit.contentHash === hashedContent) {
        throw new ConvexError("No new changes");
      }

      const newCommit = await ctx.db.insert("commits", {
        documentId: args.documentId,
        parentCommitId: document.currentCommitId,
        content: content,
        name: `${document.title} | commit: ${formattedNow}`,
        contentHash: hashedContent,
        commitNumber: newCommitNumber,
        authorId: user.subject,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.patch(args.documentId, {
        currentCommitId: newCommit,
      });

      return newCommit;
    } catch (error) {
      console.error("Failed to create commit: ", error);
      throw new ConvexError("Failed to create commit");
    }
  },
});

// get document id
// search for all commits related to that id via pagination

export const getPaginatedCommit = query({
  args: {
    documentId: v.id("documents"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { documentId, paginationOpts }) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Unauthorized");
    }

    const document = await ctx.db.get(documentId);

    if (!document) {
      throw new ConvexError("Document not found.");
    }

    if (document.ownerId !== user.subject) {
      throw new ConvexError(
        "You do not have permission to delete this document."
      );
    }

    try {
      return await ctx.db
        .query("commits")
        .withIndex("by_document_id", (q) => q.eq("documentId", documentId))
        .order("desc")
        .paginate(paginationOpts);
    } catch (error) {
      console.error("Failed to fetch document commits:", error);
      throw new ConvexError("Failed to fetch documents");
    }
  },
});

export const getCommit = query({
  args: {
    commitId: v.id("commits"),
  },
  handler: async (ctx, { commitId }) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Unauthorized");
    }
    try {
      const commit = await ctx.db.get(commitId);
      if (!commit) {
        throw new ConvexError("Commit not found");
      }
      return commit;
    } catch (error) {
      console.error("Commit not found");
      throw new ConvexError("Commit not found");
    }
  },
});

export const renameCommit = mutation({
  args: {
    newCommitName: v.string(),
    commitId: v.id("commits"),
  },
  handler: async (ctx, { newCommitName, commitId }) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Unauthorized");
    }

    const commit = await ctx.db.get(commitId);

    if (!commit) {
      throw new ConvexError("Commit not found");
    }

    const trimmedName = newCommitName.trim();

    if (!trimmedName) {
      throw new ConvexError("Commit name cannot be empty");
    }

    try {
      return await ctx.db.patch(commitId, {
        name: trimmedName,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to rename commit:", error);
      throw new ConvexError("Failed to rename commit");
    }
  },
});

export const restoreCommit = mutation({
  args: {
    documentId: v.id("documents"),
    commitId: v.id("commits"),
  },
  handler: async (ctx, { documentId, commitId }) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new ConvexError("Unauthorized");
    }

    try {
      const document = await ctx.db.get(documentId);
      if (!document) {
        throw new ConvexError("Document not found");
      }

      const commit = await ctx.db.get(commitId);
      if (!commit) {
        throw new ConvexError("Commit not found");
      }

      if (documentId !== commit.documentId) {
        throw new ConvexError(
          "This commit does not belong to the given document"
        );
      }

      return await ctx.db.patch(documentId, {
        currentCommitId: commitId,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to restore commit");
      throw new ConvexError("Failed to restore commit");
    }
  },
});
