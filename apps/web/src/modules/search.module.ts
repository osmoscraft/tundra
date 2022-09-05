export interface ISearchModule {
  updateIndex(indexItems: any[]): void;
  search(query: string): any[];
}

export class SearchModule implements ISearchModule {
  updateIndex(indexItems: any[]): void {}

  search(query: string): any[] {
    return [];
  }
}
