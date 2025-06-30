import { createHash } from "crypto";

export function hashContent(content: string): string {
  if (content ===null || content === undefined) {
    throw new Error("Invalid content: got null or undefined.");
  }
  return createHash("sha1").update(content, "utf8").digest("hex");
}
