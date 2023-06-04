export function getChunkReducer(chunkSize: number) {
  return <T>(chunks: T[][], item: T) => {
    const lastChunk = chunks[chunks.length - 1];
    if (!lastChunk || lastChunk.length === chunkSize) {
      chunks.push([item]);
    } else {
      lastChunk.push(item);
    }
    return chunks;
  };
}
