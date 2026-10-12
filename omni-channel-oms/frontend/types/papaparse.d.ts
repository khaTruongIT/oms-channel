declare module "papaparse" {
  export interface ParseError {
    message: string;
    row?: number;
    code?: string;
  }

  export interface ParseMeta {
    fields?: string[];
    delimiter?: string;
    linebreak?: string;
    aborted?: boolean;
    truncated?: boolean;
    cursor?: number;
  }

  export interface ParseResult<T> {
    data: T[];
    errors: ParseError[];
    meta: ParseMeta;
  }

  export interface ParseConfig<T> {
    header?: boolean;
    skipEmptyLines?: boolean | "greedy";
    transformHeader?: (header: string, index?: number) => string;
    transform?: (value: string, field?: string | number) => any;
    complete?: (results: ParseResult<T>) => void;
    error?: (error: Error) => void;
  }

  const Papa: {
    parse<T>(file: File, config: ParseConfig<T>): void;
    parse<T>(csvString: string, config?: ParseConfig<T>): ParseResult<T>;
  };

  export default Papa;
}
