type TextNode = { text: string; node: any; blockIndex: number };

function extractTextNodes(doc: any): TextNode[] {
  const nodes: TextNode[] = [];

  doc.content?.forEach((block: any, i: number) => {
    block.content?.forEach((child: any) => {
      if (child.type === "text") {
        nodes.push({ text: child.text, node: child, blockIndex: i });
      }
    });
  });

  return nodes;
}

function lcs(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp;
}

export function applyDiffHighlight(currentDoc: any, commitDoc: any) {
  const currentTextNodes = extractTextNodes(currentDoc);
  const commitTextNodes = extractTextNodes(commitDoc);

  const currentWords = currentTextNodes.map((n) => n.text);
  const commitWords = commitTextNodes.map((n) => n.text);

  const dp = lcs(currentWords, commitWords);

  const m = currentWords.length;
  const n = commitWords.length;

  let i = m,
    j = n;
  const additions: number[] = [];
  const deletions: number[] = [];

  while (i > 0 && j > 0) {
    if (currentWords[i - 1] === commitWords[j - 1]) {
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      deletions.push(i - 1);
      i--;
    } else {
      additions.push(j - 1);
      j--;
    }
  }

  while (i > 0) deletions.push(--i);
  while (j > 0) additions.push(--j);

  const addedDoc = JSON.parse(JSON.stringify(commitDoc));
  const modifiedDoc = JSON.parse(JSON.stringify(currentDoc));

  additions.forEach((idx) => {
    const { node, blockIndex } = commitTextNodes[idx];
    node.marks = [
      ...(node.marks || []),
      { type: "highlight", attrs: { color: "#7CFF8C" } }, // green
    ];
    addedDoc.content[blockIndex].content = commitDoc.content[
      blockIndex
    ].content.map((c: any) => (c.text === node.text ? node : c));
  });

  deletions.forEach((idx) => {
    const { node, blockIndex } = currentTextNodes[idx];
    node.marks = [
      ...(node.marks || []),
      { type: "highlight", attrs: { color: "#FF7C7C" } }, // red
    ];
    modifiedDoc.content[blockIndex].content = currentDoc.content[
      blockIndex
    ].content.map((c: any) => (c.text === node.text ? node : c));
  });

  // console.log("Current",currentTextNodes)
  // console.log("Commit",commitTextNodes);

  return { modified: modifiedDoc, added: addedDoc };
}
