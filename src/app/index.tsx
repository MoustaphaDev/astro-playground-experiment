/* @refresh reload */
import { render } from "solid-js/web";
import App from "./App";
import { installPackages, webcontainerInstance } from "~/webcontainer/setup";
// import { startDevServer } from "./setup-webcontainer";
import { readJSONChunks } from "@jsnix/utils/ipc";
// import { withNewline } from "../webcontainer/utils";

async function getIO() {
  await installPackages();
  const relayProcess = await webcontainerInstance.spawn("pnpm", [
    "run",
    "jsnix",
  ], {
    output: true,
  });
  const sharedWriter = relayProcess.input.getWriter();
  const sharedReader = relayProcess.output.getReader();

  await sharedWriter.ready;

  let isProcessReady = false;

  while (true) {
    const { value, done } = await sharedReader.read();
    if (done) {
      throw new Error("Done before process is ready");
    }

    // await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      const response = JSON.parse(value.trim());
      console.log({ response });
      if (!isProcessReady) {
        isProcessReady = response.type === "ready";
        if (isProcessReady) {
          console.log("Process is ready");
          console.debug({ msg: "received relay start message", value });
          return { sharedWriter, sharedReader };
        }
      }
    } catch { }
  }
}

async function* handleRequest(
  reader: ReadableStreamDefaultReader<string>,
  resolversContainer: { resolvers: PromiseWithResolvers<void> },
) {
  for await (const json of readJSONChunks(reader)) {
    if (json?.type === "response") {
      resolversContainer.resolvers.resolve();
      yield json;
    }
  }
}

// async function jsnixTest() {
//   const { sharedWriter, sharedReader } = await getIO();
//   await sharedWriter.ready;
//
//   const resolversContainer = { resolvers: Promise.withResolvers<void>() };
//
//   (async function () {
//     for await (
//       const response of handleRequest(sharedReader, resolversContainer)
//     ) {
//       console.log({ response });
//     }
//   })();
//
//   while (true) {
//     sharedWriter.write(withNewline(JSON.stringify({ message: "hello" })));
//     // TODO: implement request timeout
//     console.log("Sent message");
//     // lock until the response is received
//     const response = await resolversContainer.resolvers.promise;
//     resolversContainer.resolvers = Promise.withResolvers<void>();
//     console.log("Received response");
//     await new Promise((resolve) => setTimeout(resolve, 2000));
//   }
// }

// startDevServer();
// test();
// jsnixTest();
const root = document.getElementById("root");
render(() => <App />, root!);
