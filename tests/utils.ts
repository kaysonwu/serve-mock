import { ServerResponse } from 'http';

export interface Response {
  content: any;
  headers: Record<string, number | string | string[]>;
}

export function createServerResponse(done: (res: Response) => void) {
  let res: Partial<Response> = {};  

  return {
    write(chunk: any) {
      res.content = chunk;
    },
    setHeader(name: string, value: number | string | string[]) {
      res.headers = { ...res.headers, [name]: value };
    },
    end() {
      done(res as Response);
    },
  } as ServerResponse;
}
