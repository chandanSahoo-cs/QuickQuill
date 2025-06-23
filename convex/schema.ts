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
    content: v.string(),
    message: v.optional(v.string()),
    authorId: v.string(),
    createdAt: v.string(),
  }).index("by_document_id", ["documentId"]),
});
