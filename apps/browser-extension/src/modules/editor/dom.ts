export function isTextNode(node: Node | null): node is Text {
  return node?.nodeType === Node.TEXT_NODE;
}

export function firstInnerLeafNode(node: Node, filterFn: (node: Node) => boolean = () => true): Node | null {
  const results = flattenToLeafNodes(node).filter(filterFn);
  return results[0] ?? null;
}

export function flattenToLeafNodes(root: Node) {
  const hierarchicalArray = expandRecursive(root);

  const flatArray = [hierarchicalArray].flat(Infinity) as Node[];

  return flatArray;
}

function expandRecursive(node: Node): Node | any[] {
  if (node.childNodes.length) {
    return [...node.childNodes].map(expandRecursive);
  } else {
    return node;
  }
}
