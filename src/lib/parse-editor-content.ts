// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseEditorContentToBlocks(doc: any){
  if (!doc || !Array.isArray(doc.content)) return [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  return doc.content.map((node:any) => {
    return {
      content: node,
    };
  });
}
