declare global {
  interface Document {
    _tinykb: {
      isHistoryDirty?: boolean;
    };
  }
}

export default {};
