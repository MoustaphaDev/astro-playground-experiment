import { readJSONChunks } from "@jsnix/utils/ipc";
import {
  type ClientMessage,
  parseServerMessage,
  type ServerMessage,
} from "~/bridge";
import { setupRelayProcess } from "./setup";
import { withNewline } from "./filesystem/src/utils";

async function hookRequestHandler(
  reader: ReadableStreamDefaultReader<string>,
  resolversContainer: {
    resolvers: PromiseWithResolvers<ServerMessage>;
  },
) {
  for await (const json of readJSONChunks(reader)) {
    if (json?.type === "response") {
      const parsedMessage = parseServerMessage(json);
      if (!parsedMessage.success) {
        console.log("Failure to parse response");
        // just silence errors for now
        continue;
      }
      resolversContainer.resolvers.resolve(parsedMessage.data);
      resolversContainer.resolvers = Promise.withResolvers<ServerMessage>();
    } else {
      console.log("Unknown message type");
    }
  }
}

export class Client {
  private resolversContainer = {
    resolvers: Promise.withResolvers<ServerMessage>(),
  };

  private sharedWriter: WritableStreamDefaultWriter<string> | undefined;
  // private sharedReader: ReadableStreamDefaultReader<string> | undefined;

  private constructor() { }

  static async create(): Promise<Client> {
    const {
      sharedReader,
      sharedWriter,
      waitRelayStart,
      throwOnExit,
    } = await setupRelayProcess();

    throwOnExit();

    // Doesn't need to be blocking
    await waitRelayStart();

    const client = new Client();

    // client.sharedReader = sharedReader;
    client.sharedWriter = sharedWriter;
    client.resolversContainer = {
      resolvers: Promise.withResolvers<ServerMessage>(),
    };

    // Doesn't need to be blocking either
    hookRequestHandler(sharedReader, client.resolversContainer);

    return client;
  }

  async postMessage(message: ClientMessage): Promise<ServerMessage> {
    if (!this.sharedWriter) {
      return { type: "error", error: "No shared writer available" };
    }
    this.sharedWriter.write(withNewline(JSON.stringify(message)));
    console.log("Triggering lock");
    const response = await this.resolversContainer.resolvers.promise;
    console.log("Unlocking lock");

    console.log({ response: response.html ?? response.error });

    return response;
  }
}

let client = await Client.create();
await warmupViteLoader();

async function warmupViteLoader() {
  const content = `<h1>Hello World</h1>`;
  const id = "hello-world.astro";

  console.info("Warming up vite loader and endpoint");

  performance.mark("start");
  let { error, html } = await client.postMessage({ content, id });
  if (error) {
    console.error(error);
    console.error("Failed to warmup vite loader");
  }
  console.log({ html });

  ({ error, html } = await client.postMessage({
    content: `---\nconst val = "<h1>From CLI!!</h1>"\n---\n
<Fragment set:html=\{val\} />`,
    id: "some.astro",
  }));
  if (error) {
    console.error(error);
    console.error("Failed to warmup vite loader");
  }
  console.log({ html });

  performance.mark("end");

  const warmupMeasurement = performance.measure("warmup", "start", "end");

  console.info(`Warmup done in ${warmupMeasurement.duration}ms`);
}

export { client };
