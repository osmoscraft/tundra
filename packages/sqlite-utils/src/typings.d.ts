declare namespace Sqlite3 {
  export interface ApiIndex {
    capi: CApi;
    oo1: OO1;
    opfs: any;
  }

  export interface CApi {
    sqlite3_libversion(): string;
  }

  export interface OO1 {
    OpfsDb: DB;
  }

  export interface DB {
    new (path: string, flags?: string): DB;
    exec: DbExec;
    prepare: (sql: string) => Statement;
    selectArray: (sql: string, bind?: Bind) => any[] | undefined;
    selectArrays: (sql: string, bind?: Bind) => any[][];
    selectObject: <T>(sql: string, bind?: Bind) => T | undefined;
    selectObjects: <T>(sql: string, bind?: Bind) => T[];
    selectValue: (sql: string, bind?: Bind) => any | undefined;
    selectValues: (sql: string, bind?: Bind) => any[];
    transaction: (...args: [qualifier: string, callback: () => any] | [callback: () => any]) => void;
    // transaction: (qualifier: string, callback: () => any) => void;
    close: () => void;
  }

  export interface DbExec {
    (config: ExecConfig): any;
    (sql: string, config?: ExecConfig): any;
  }

  export interface ExecConfig {
    sql?: string;
    /**
     * a single value valid as an argument for `Stmt.bind()`. This is only applied to the first non-empty statement in the SQL which has any bindable parameters.
     */
    bind?: Bind;
    saveSql?: any[]; // TODO refine typing
    returnValue?: "this" | "resultRows" | "saveSql";
    callback?: (result: any) => any; // TODO refine typing
    columnNames?: string[];
    resultRows?: any[]; // TODO refine typing
    /**
     * specifies the type of he callback's first argument. It may be any of:
     * - A string describing what type of argument should be passed as the first argument to the callback:
     *   - `array` (the default) causes the results of stmt.get([]) to be passed to the callback and/or appended to resultRows.
     * - `object` causes the results of stmt.get(Object.create(null)) to be passed to the callback and/or appended to resultRows. Achtung: an SQL result may have multiple columns with identical names. In that case, the right-most column will be the one set in this object!
     *   - `stmt` causes the current Stmt to be passed to the callback, but this mode will trigger an exception if resultRows is an array because appending the statement to the array would be downright unhelpful.
     * - An integer, indicating a zero-based column in the result row. Only that one single value will be passed on.
     * - A string with a minimum length of 2 and leading character of $ will fetch the row as an object, extract that one field, and pass that field's value to the callback. Note that these keys are case-sensitive so must match the case used in the SQL. e.g. "select a A from t" with a rowMode of '$A' would work but '$a' would not. A reference to a column not in the result set will trigger an exception on the first row (as the check is not performed until rows are fetched).
     */
    rowMode?: "array" | "object" | "stmt" | number | string;
  }

  export type Bind = BindValue | Record<string, BindValue> | BindValue[];

  export type BindValue = null | undefined | number | boolean | string | Uint8Array | Int8Array | ArrayBuffer;

  export interface Statement {
    bind: StmtBinder;
    get: StmtGetter;
    step: () => boolean;
    stepFinalize: () => boolean;
    stepReset: () => Statement;
    finalize: () => void;
    clearBindings: () => void;
    reset(alsoClearBinds?: boolean): () => Statement;
  }

  export interface StmtBinder {
    (value: BindValue | Record<string, BindValue> | BindValue[]): void;
    (index: number, value: BindValue): void;
    (name: string, value: BindValue): void;
  }

  export interface StmtGetter {
    (index: number): any;
    (array: any[]): any[];
    (obj: Record<string, any>): Record<string, any>;
  }
}
