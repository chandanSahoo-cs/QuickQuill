import { hashContent } from "@/lib/hash";
import { parseEditorContentToBlocks } from "@/lib/parse-editor-content";
import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { Id } from "./_generated/dataModel";
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

// export const commitDoc = mutation({
//   args: {
//     documentId: v.id("documents"),
//     content: v.optional(v.string()),
//   },
//   handler: async (ctx, args) => {
//     const user = await ctx.auth.getUserIdentity();

//     if (!user) {
//       throw new ConvexError("Unauthorized");
//     }

//     const document = await ctx.db.get(args.documentId);

//     if (!document) {
//       throw new ConvexError("Document not found");
//     }

//     const content = args.content || "";
//     const hashedContent = await hashContent(content);

//     const now = new Date().toISOString();
//     const formattedNow = new Intl.DateTimeFormat("en-IN", {
//       dateStyle: "long",
//       timeStyle: "short",
//     }).format(new Date());

//     try {
//       const count = await ctx.db
//         .query("commits")
//         .withIndex("by_document_id", (q) => q.eq("documentId", args.documentId))
//         .collect();

//       const newCommitNumber = count.length + 1;

//       const currentCommitId = document.currentCommitId;

//       if (!currentCommitId) {
//         throw new ConvexError("Current commit Id not found");
//       }
//       const currentCommit = await ctx.db.get(currentCommitId);

//       if (!currentCommit) {
//         throw new ConvexError("Current commit not found");
//       }

//       if (currentCommit.contentHash === hashedContent) {
//         throw new ConvexError("No new changes");
//       }

//       const newCommit = await ctx.db.insert("commits", {
//         documentId: args.documentId,
//         parentCommitId: document.currentCommitId,
//         content: content,
//         name: `${document.title} | Commit: ${formattedNow}`,
//         contentHash: hashedContent,
//         commitNumber: newCommitNumber,
//         authorId: user.name ??  user.email ?? "Anonymous",
//         createdAt: now,
//         updatedAt: now,
//       });

//       await ctx.db.patch(args.documentId, {
//         currentCommitId: newCommit,
//       });

//       return newCommit;
//     } catch (error) {
//       console.error("Failed to create commit: ", error);
//       throw new ConvexError("Failed to create commit");
//     }
//   },
// });

function arraysEqual<T>(a: T[], b: T[]) {
  return (
    a.length === b.length && a.every((value, index) => value === b[index])
  );
}

export const commitDoc = mutation({
  args: {
    documentId: v.id("documents"),
    content: v.optional(v.any()),
  },
  handler: async (ctx, { documentId, content }) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new ConvexError("Unauthorized");
    // throw new ConvexError("Test 1");

    const document = await ctx.db.get(documentId);
    if (!document) throw new ConvexError("Document not found");

    const defaultJson = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { lineHeight: "normal", textAlign: "left" },
        },
      ],
    };
    const editorJson = content || defaultJson;

    const blocks = parseEditorContentToBlocks(editorJson);
    const now = new Date().toISOString();

    const blobIds: Id<"blobs">[] = [];

    for (const block of blocks) {
      const blockData = JSON.stringify(block.content);
      const hash = await hashContent(blockData);

      const existingBlob = await ctx.db
        .query("blobs")
        .withIndex("by_document_and_hash", (q) =>
          q.eq("documentId", documentId).eq("hash", hash)
        )
        .first();

      if (existingBlob) {
        blobIds.push(existingBlob._id);
      } else {
        const newBlobId = await ctx.db.insert("blobs", {
          documentId,
          content: blockData,
          hash,
          createdAt: now,
        });
        blobIds.push(newBlobId);
      }
    }

    const treeId = await ctx.db.insert("trees", {
      documentId,
      blobIds,
      createdAt: now,
    });

    const formattedNow = new Intl.DateTimeFormat("en-IN", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date());

    const currentCommitId = document.currentCommitId;
    if (!currentCommitId) throw new ConvexError("Current commitId missing");

    const currentCommit = await ctx.db.get(currentCommitId);
    if (!currentCommit) throw new ConvexError("Current commit not found");

    const currentTree = await ctx.db.get(currentCommit.treeId);
    const previouseBlobIds = currentTree?.blobIds ?? [];

    const isSame = arraysEqual(previouseBlobIds,blobIds)

    if(isSame){
      console.error("Nothing to change")
      throw new ConvexError("Nothing to change")
    }

    const commitCount = await ctx.db
      .query("commits")
      .withIndex("by_document_id", (q) => q.eq("documentId", documentId))
      .collect();

    const newCommit = await ctx.db.insert("commits", {
      documentId,
      parentCommitId: currentCommitId,
      treeId,
      name: `${document.title} | Commit: ${formattedNow}`,
      commitNumber: commitCount.length + 1,
      authorId: user.name ?? user.email ?? "Anonymous",
      createdAt: now,
      updatedAt: now,
    });

    if(!newCommit){
      throw new ConvexError(
        "Failed to link the document with the new commit"
      )
    }

    await ctx.db.patch(documentId, {
      currentCommitId: newCommit,
    });

    return newCommit;
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

// check for user
//get commit tree
//get blobids from commit tree
//get all those blob and content

export const getContentByCommitId = query({
  args :{
    commitId: v.id("commits")
  },
  handler: async(ctx,{commitId}) =>{
    const user = await ctx.auth.getUserIdentity();
    if(!user){
      throw new ConvexError("Unauthorized")
    }

    try {
      const commit = await ctx.db.get(commitId);

      if(!commit){
        throw new ConvexError("Commit doesn't exist");
      }

      const tree = await ctx.db.get(commit.treeId);

      if(!tree){
        throw new ConvexError("Commit tree doesn't exist")
      }

      const blobIds = tree.blobIds;

      const blobs = await Promise.all(
        blobIds.map((id)=>ctx.db.get(id))
      )

      if(blobs.some((b)=>b===null)){
        throw new ConvexError("One or more blobs are missing");
      }

      const content = blobs.map((blob)=>JSON.parse(blob!.content))

      const reconstructDoc = {
        type: "doc",
        content,
      }

      if(!reconstructDoc){
        return "Hello";
      }

      return reconstructDoc;
    } catch (error) {
      console.error("Failed to get commit content")
      throw new ConvexError("Failed to get commit content")
    }
  }
})

// export const getCommit = query({
//   args: {
//     commitId: v.id("commits"),
//   },
//   handler: async (ctx, { commitId }) => {
//     const user = await ctx.auth.getUserIdentity();
//     if (!user) {
//       throw new ConvexError("Unauthorized");
//     }
//     try {
//       const commit = await ctx.db.get(commitId);
//       if (!commit) {
//         throw new ConvexError("Commit not found");
//       }
//       return commit;
//     } catch (error) {
//       console.error("Commit not found");
//       throw new ConvexError("Commit not found");
//     }
//   },
// });

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
