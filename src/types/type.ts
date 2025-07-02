export type ViewMode = "history" | "diff" 

export type EditorJSON = {
  type: 'doc';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any[];
};