import { WebContainer } from "@webcontainer/api";
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

  // await installProcess.exit

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

export { webcontainerInstance, installPackages };
