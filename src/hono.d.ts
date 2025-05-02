/**
 * Stub module declarations for 'hono' to satisfy TypeScript in absence of installed types.
 */
declare module 'hono' {
  export interface Context<Env = Record<string, any>> {
    req: Request;
    env: Env;
    text(body: string, status?: number): Response;
  }
  export class Hono<Env extends {} = {}> {
    constructor();
    get(path: string, handler: (c: Context) => any): void;
    post(path: string, handler: (c: Context) => any): void;
    fetch(request: Request, env?: Env, ctx?: any): Promise<Response>;
  }
}