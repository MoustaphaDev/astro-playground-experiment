/* @refresh reload */
import { render } from "solid-js/web";
import App from "./App";
import { installPackages, webcontainerInstance } from "~/webcontainer/setup";
import { startDevServer } from "./setup-webcontainer";

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

// When writing to input:
const streamWriter = createEveryOtherAndSkipFirst(
  function write(data: any) {
    // when writing to stdin, it's actually
    // piped to stdout so what's written gets
    // displayed in the terminal, i think.
    // So the actual output stream starts after
    // the first chunk is received
    console.log({ data });
    const response = data.toString() as string;
    try {
      const message = JSON.parse(response);
      if ("message" in message) {
        console.log({ trueOutput: response });
      }
    } catch {}
  },
);

async function test() {
  await installPackages();
  const devProcess = await webcontainerInstance.spawn("pnpm", ["run", "some"], {
    stderr: true,
  });

  const responseStream = new WritableStream({
    write: streamWriter,
  });

  devProcess.stderr.pipeTo(responseStream);

  // const readable = new ReadableStream({
  //   async start(controller) {
  //     const payload = JSON.stringify({
  //       id: "file.astro",
  //       content: "hey there!!!",
  //     });
  //     while (true) {
  //       await new Promise((resolve) => setTimeout(resolve, 1000));
  //       controller.enqueue(payload);
  //     }
  //   },
  // });
  //
  // readable.pipeTo(devProcess.input);

  const writer = devProcess.input.getWriter();
  let count = 0;
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const payload = JSON.stringify({
      id: "file.astro",
      content: `hey there!!! - ${count++}`,
    });
    writer.write(payload);
  }

  if (await devProcess.exit !== 0) {
    throw new Error("Failed to start dev server");
  }
}

// startDevServer();
test();
const root = document.getElementById("root");
render(() => <App />, root!);
