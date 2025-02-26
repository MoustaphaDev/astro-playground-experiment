import { WebContainer, WebContainerProcess } from "@webcontainer/api";
import snapshot from "virtual:webcontainer-snapshot";

const webcontainerInstance = await WebContainer.boot();

// mount the file system
await webcontainerInstance.mount(snapshot);

async function installPackages() {
  if (!webcontainerInstance) {
    throw new Error("WebContainer instance not found");
  }
  const installProcess = await webcontainerInstance.spawn("pnpm", [
    "install",
  ]);

  installProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        // console.clear();
        console.log(data);
      },
    }),
  );

  const installExitCode = await installProcess.exit;

  if (installExitCode !== 0) {
    throw new Error("Unable to run pnpm install");
  }
}

async function setupRelayProcess() {
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

  return {
    // relayProcess,
    sharedWriter,
    sharedReader,
    waitRelayStart: () => waitRelayStart(sharedReader),
    throwOnExit: () => throwOnExit(relayProcess),
  };
}

async function throwOnExit(relayProcess: WebContainerProcess) {
  const relayExitCode = await relayProcess.exit;
  console.log({ relayExitCode });

  if (relayExitCode !== 0) {
    throw new Error("Relay process exited unexpectedly!");
  }
}

async function waitRelayStart(
  sharedReader: ReadableStreamDefaultReader<string>,
) {
  let isProcessReady = false;
  while (true) {
    const { value, done } = await sharedReader.read();
    if (done) {
      throw new Error("Done before process is ready");
    }

    try {
      const response = JSON.parse(value.trim());
      console.log({ response });
      if (!isProcessReady) {
        isProcessReady = response.type === "ready";
        if (isProcessReady) {
          console.debug({ msg: "received relay start message", value });
          return;
        }
      }
    } catch { }
  }
}

export { installPackages, setupRelayProcess, webcontainerInstance };
