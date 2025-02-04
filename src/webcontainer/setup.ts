import { WebContainer } from "@webcontainer/api";
import snapshot from "virtual:webcontainer-snapshot";

// Call only once
const webcontainerInstance = await WebContainer.boot();

// mount the file system
await webcontainerInstance.mount(snapshot);

async function startDevServer() {
  const installProcess = await webcontainerInstance.spawn("pnpm", ["install"]);
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

  await webcontainerInstance.spawn("pnpm", ["run", "dev"]);
  console.log("Running dev server");
}

function mountContainerOnIframe(iframeEl: HTMLIFrameElement) {
  let url;
  console.log("Server ready!!");
  webcontainerInstance.on("server-ready", (port, _url) => {
    url = _url;
    console.log(`Server ready at ${_url}`);
    iframeEl.src = _url;
  });
}

export { mountContainerOnIframe, startDevServer };
