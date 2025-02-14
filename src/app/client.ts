import type { WebContainerProcess } from "@webcontainer/api";
import {
  type ClientMessage,
  CommunicationPlatform,
  parseServerMessage,
  type ServerMessage,
} from "~/bridge";

function createEveryOtherAndSkipFirst(fn: (...args: any[]) => void) {
  const disable = true;
  if (disable) return fn;

  let count = 0;
  return function (...args: any[]) {
    count++;
    if (count % 2 === 0 && count !== 1) {
      fn(...args);
    }
  };
}
export class Client extends CommunicationPlatform<WebContainerProcess> {
  // it's safe to use this property when
  // the lock is resolved
  #latestResponse: ServerMessage | undefined;
  #stdinWriter = this.process.input.getWriter();
  #resolvers = Promise.withResolvers<void>();
  get #lock() {
    return this.#resolvers.promise;
  }
  constructor(process: WebContainerProcess) {
    super(process);

    const responseStream = new WritableStream({
      write: createEveryOtherAndSkipFirst((data: any) => {
        console.log({ data });
        let response;
        try {
          response = JSON.parse(data) as Record<string, any>;
        } catch (e) {
          return;
        }

        const parsedMessage = parseServerMessage(response);

        if (!parsedMessage.success) {
          console.log("Failure to parse response");
          console.log({ unparsedResponse: response });
          // just silence errors for now
          return;
        }

        this.#latestResponse = parsedMessage.data;
        console.log("internal unlocking of lock");
        this.#resolvers.resolve();
        this.#resolvers = Promise.withResolvers();
      }),
    });

    this.process.stderr.pipeTo(
      responseStream,
    );
  }

  async postMessage(message: ClientMessage): Promise<ServerMessage> {
    this.#stdinWriter.write(JSON.stringify(message));

    console.log("Triggering lock");
    await this.#lock;
    console.log("Unlocking lock");
    const response = this.#latestResponse;

    if (response === undefined) {
      return { error: "No message received, probably a bug" };
    }
    console.log({ response: response.html });

    return response;
  }
}

let client: Client;

async function initializeClient(
  webcontainerProcess: WebContainerProcess,
): Promise<Client> {
  client = new Client(webcontainerProcess);
  await warmupViteLoader();
  return client;
}

async function warmupViteLoader() {
  const content = `<h1>Hello World</h1>`;
  const id = "hello-world.astro";

  console.info("Warming up vite loader and endpoint");

  performance.mark("start");
  const { error } = await client.postMessage({ content, id });
  if (error) {
    console.error(error);
    console.error("Failed to warmup vite loader");
  }
  performance.mark("end");

  const warmupMeasurement = performance.measure("warmup", "start", "end");

  console.info(`Warmup done in ${warmupMeasurement.duration}ms`);
}

export { client, initializeClient };
