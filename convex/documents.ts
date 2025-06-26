import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
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

    const organizationId = (user.organization_id ?? undefined) as
      | string
      | undefined;

    // Create Doc without currentCommitId

    try {
      const docId = await ctx.db.insert("documents", {
        title: args.title ?? "Untitled Document",
        ownerId: user.subject,
        organizationId: organizationId,
        initialContent: args.initialContent,
        createdAt: now,
        updatedAt: now,
        currentCommitId: undefined,
      });

      if (!docId) {
        throw new ConvexError("Failed to create the document");
      }

      // TODO: Add admins
      const firstCommit = await ctx.db.insert("commits", {
        documentId: docId,
        parentCommitId: undefined,
        content: args.initialContent ?? "",
        message: "Initial commit",
        authorId: user.subject,
        createdAt: now,
      });

      if (!firstCommit) {
        throw new ConvexError(
          "Failed to link the document with the first commit"
        );
      }

      const patch = await ctx.db.patch(docId, {
        currentCommitId: firstCommit,
      });

      return docId;
    } catch (error) {
      console.error("Create mutation failed:", error);
      throw new ConvexError(
        "Something went wrong while creating the document."
      );
    }
  },
});

export const get = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
  },
  handler: async (ctx, { paginationOpts, search }) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Unauthorized");
    }

    const organizationId = (user.organization_id ?? undefined) as
      | string
      | undefined;

    try {
      if (search && organizationId) {
        return await ctx.db
          .query("documents")
          .withSearchIndex("search_title", (q) =>
            q.search("title", search).eq("organizationId", organizationId)
          )
          .paginate(paginationOpts);
      }

      if (search) {
        return await ctx.db
          .query("documents")
          .withSearchIndex("search_title", (q) =>
            q.search("title", search).eq("ownerId", user.subject)
          )
          .paginate(paginationOpts);
      }

      if (organizationId) {
        return await ctx.db
          .query("documents")
          .withIndex("by_organization_id", (q) =>
            q.eq("organizationId", organizationId)
          )
          .order("desc")
          .paginate(paginationOpts);
      }

      return await ctx.db
        .query("documents")
        .withIndex("by_owner_id", (q) => q.eq("ownerId", user.subject))
        .order("desc")
        .paginate(paginationOpts);
    } catch (error) {
      console.error("documents.get failed:", error);
      throw new ConvexError("Failed to fetch documents");
    }
  },
});
export const removeById = mutation({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Unauthorized");
    }

    const document = await ctx.db.get(args.documentId);

    if (!document) {
      throw new ConvexError("Document not found.");
    }

    if (document.ownerId !== user.subject) {
      throw new ConvexError(
        "You do not have permission to delete this document."
      );
    }

    try {
      // 1. Delete all commits linked to this document
      const commits = await ctx.db
        .query("commits")
        .withIndex("by_document_id", (q) => q.eq("documentId", args.documentId))
        .collect();

      for (const commit of commits) {
        await ctx.db.delete(commit._id);
      }

      // 2. Delete the document itself
      await ctx.db.delete(args.documentId);

      return { success: true };
    } catch (error) {
      console.error("removeById failed:", error);
      throw new ConvexError("Failed to delete document and its commits.");
    }
  },
});

export const renameById = mutation({
  args: {
    documentId: v.id("documents"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Unauthorized");
    }

    const document = await ctx.db.get(args.documentId);

    if (!document) {
      throw new ConvexError("Document not found.");
    }

    if (document.ownerId !== user.subject) {
      throw new ConvexError(
        "You do not have permission to rename this document."
      );
    }

    const trimmedTitle = args.title.trim();

    if (!trimmedTitle) {
      throw new ConvexError("Title cannot be empty");
    }

    try {
      return await ctx.db.patch(args.documentId, {
        title: args.title,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("removeById failed:", error);
      throw new ConvexError("Failed to rename document.");
    }
  },
});

export const getById = query({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, { documentId }) => {
    try {
      const document = await ctx.db.get(documentId);
      if (!document) {
        throw new ConvexError("Document not found");
      }
      return document;
    } catch (error) {
      console.error("Document not found");
    }
  },
});

export const getByIds = query({
  args: { documentIds: v.array(v.id("documents")) },
  handler: async (ctx, { documentIds }) => {
    const documents = [];
    try {
      for (const id of documentIds) {
        const document = await ctx.db.get(id);
        if (document) {
          documents.push({ id: document._id, name: document.title });
        } else {
          documents.push({ id, name: "[Removed]" });
        }
      }

      return documents;
    } catch (error) {
      console.error("Failed to fetch documents");
    }
  },
});
