import { isTextNode } from "./dom";

export interface SeekInput {
  source: Node;
  offset?: number;
  seek?: number;
  root?: Node | null;
}

export interface SeekOutput {
  node: Text;
  offset: number;
}

// TODO rewrite this with built-in DOM TreeWalker
export function seek(input: SeekInput): SeekOutput | null {
  const { source, offset = 0, seek = 0, root = null } = input;

  let targetNode = null;
  let targetOffset = null;
  let currentNode: Node | null = source;
  const offsetFromSourceNodeStartEdge = offset + seek;
  let remainingDistance = Math.abs(offsetFromSourceNodeStartEdge);

  const onVisit = (node: Node) => {
    if (isTextNode(node)) {
      if (node.length >= remainingDistance) {
        return true;
      } else {
        remainingDistance = remainingDistance - node.length;
      }
    }
  };

  if (offsetFromSourceNodeStartEdge >= 0) {
    while (currentNode && !targetNode) {
      const foundNode = depthVisitLeafNodesForward(currentNode, onVisit);
      if (foundNode) {
        targetNode = foundNode as Text;
        targetOffset = remainingDistance;
        break;
      } else if (currentNode === root) {
        break;
      } else {
        currentNode = getClosestNextNode(currentNode, root);
      }
    }
  } else {
    currentNode = getClosestPreviousNode(source, root);

    while (currentNode && !targetNode) {
      const foundNode = depthVisitLeafNodesBackward(currentNode, onVisit);
      if (foundNode) {
        targetNode = foundNode as Text;
        targetOffset = targetNode.length - remainingDistance;
        break;
      } else if (currentNode === root) {
        break;
      } else {
        currentNode = getClosestPreviousNode(currentNode, root);
      }
    }
  }

  if (targetNode) {
    return {
      node: targetNode,
      offset: targetOffset!,
    };
  } else {
    return null;
  }
}

/**
 * @param onVisit return `true` to stop visiting more nodes
 */
export function depthVisitLeafNodesForward(node: Node, onVisit: (node: Node) => void | true): Node | null {
  if (!node.hasChildNodes()) {
    if (onVisit(node)) return node;
  } else {
    // search child
    let foundNode = depthVisitLeafNodesForward(node.firstChild!, onVisit);
    if (foundNode) return foundNode;
  }

  // search sibling
  if (node.nextSibling) {
    const foundNode = depthVisitLeafNodesForward(node.nextSibling, onVisit);
    if (foundNode) return foundNode;
  }

  return null;
}

/**
 * Get next sibling from the current node or from a nearest parent
 */
export function getClosestNextNode(sourceNode: Node | null, rootNode?: Node | null): Node | null {
  if (!sourceNode) return null;
  if (sourceNode === rootNode) return null;

  if (sourceNode.nextSibling) {
    return sourceNode.nextSibling;
  } else {
    return getClosestNextNode(sourceNode.parentNode, rootNode);
  }
}

/**
 * Get next sibling from the current node or from a nearest parent
 */
export function getClosestPreviousNode(sourceNode: Node | null, rootNode?: Node | null): Node | null {
  if (!sourceNode) return null;
  if (sourceNode === rootNode) return null;

  if (sourceNode.previousSibling) {
    return sourceNode.previousSibling;
  } else {
    return getClosestPreviousNode(sourceNode.parentNode, rootNode);
  }
}

/**
 * @param onVisit return `true` to stop visiting more nodes
 */
export function depthVisitLeafNodesBackward(node: Node, onVisit: (node: Node) => void | true): Node | null {
  if (!node.hasChildNodes()) {
    if (onVisit(node)) return node;
  } else {
    // search child
    const foundNode = depthVisitLeafNodesBackward(node.lastChild!, onVisit);
    if (foundNode) return foundNode;
  }

  // search sibling
  if (node.previousSibling) {
    const foundNode = depthVisitLeafNodesBackward(node.previousSibling, onVisit);
    if (foundNode) return foundNode;
  }

  return null;
}
