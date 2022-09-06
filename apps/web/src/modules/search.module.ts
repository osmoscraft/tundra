export interface ISearchModule {
  updateIndex(indexItems: any[]): void;
  search(query: string): any[];
  clear(): Promise<void>;
}

export class SearchModule implements ISearchModule {
  updateIndex(indexItems: any[]): void {}

  search(query: string): any[] {
    return [];
  }

  clear(): Promise<void> {}
}
