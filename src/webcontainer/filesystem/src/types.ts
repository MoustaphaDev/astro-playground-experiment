export type RequestHandler = (
  request: any,
) => Promise<{ [key: string]: any }>;
