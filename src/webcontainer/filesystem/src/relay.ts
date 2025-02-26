import { readJSONChunks } from "@jsnix/utils/ipc";
import { withNewline } from "./utils";
import type { ReadableStream, WritableStream } from "node:stream/web";
import type { RequestHandler } from "./types";

export class Relay {
  input: ReadableStream;
  output: WritableStream;

  constructor(input: ReadableStream, output: WritableStream) {
    this.input = input;
    this.output = output;
  }
  async start({ requestHandler }: { requestHandler: RequestHandler }) {
    const writer = this.output.getWriter();
    await writer.ready;
    await writer.write(withNewline(JSON.stringify({ type: "ready" })));

    // every iteration in this loop
    // comes from a request from the client
    // via writing to the input stream
    for await (const json of readJSONChunks(this.input.getReader())) {
      const response = await requestHandler(json);
      const serializedResponse = JSON.stringify(response);
      await writer.write(withNewline(serializedResponse));
    }
  }
}
