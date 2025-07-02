import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  documents: defineTable({
    title: v.string(),
    initialContent: v.optional(v.string()),
    ownerId: v.string(),
    roomId: v.optional(v.string()),
    organizationId: v.optional(v.string()),

    //VCS-specific
    currentCommitId: v.optional(v.id("commits")),
    rootCommitId: v.optional(v.id("commits")),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_owner_id", ["ownerId"])
    .index("by_organization_id", ["organizationId"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["ownerId", "organizationId"],
    }),

  commits: defineTable({
    documentId: v.id("documents"),
    parentCommitId: v.optional(v.id("commits")),
    treeId: v.id("trees"),
    name: v.string(),
    authorId: v.string(),
    createdAt: v.string(),
    updatedAt:v.string(),
    commitNumber: v.optional(v.number()),
  }).index("by_document_id", ["documentId"]),

  blobs: defineTable({
    hash: v.string(),
    documentId: v.id("documents"),
    content: v.string(),
    createdAt: v.string()
  }).index("by_document_and_hash",["documentId","hash"]),

  trees : defineTable({
    documentId: v.id("documents"),
    blobIds: v.array(v.id("blobs")),
    createdAt: v.string(),
  }).index("by_document_id",["documentId"])
});
