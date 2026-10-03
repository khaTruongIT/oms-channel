declare module "papaparse" {
  export interface ParseError {
    message: string;
  }

  export interface ParseMeta {
    fields?: string[];
  }

  export interface ParseResult<T> {
    data: T[];
    errors: ParseError[];
    meta: ParseMeta;
  }

  export interface ParseConfig<T> {
    header?: boolean;
    skipEmptyLines?: boolean;
    complete?: (results: ParseResult<T>) => void;
    error?: (error: Error) => void;
  }

  const Papa: {
    parse<T>(file: File, config: ParseConfig<T>): void;
  };

  export default Papa;
}

