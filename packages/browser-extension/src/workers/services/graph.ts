export interface GraphConfig {}

export interface GraphNode {
  id: string;
  title: string;
  url: string;
}

export interface RequestWriteDetails {
  id: string;
  content: string;
}

export class Graph extends EventTarget {
  constructor(private config: GraphConfig) {
    super();
  }

  readNode() {}

  deleteNode() {}

  writeNode(node: GraphNode) {
    const content = JSON.stringify(node);
    this.dispatchEvent(
      new CustomEvent("request-write", {
        detail: {
          id: node.id,
          content,
        },
      })
    );
  }

  listNodes() {}

  searchNodes() {}

  parseNode(id: string, content: string): GraphNode {
    return {
      id,
      title: "Mock",
      url: "https://bing.com",
    };
  }
}
