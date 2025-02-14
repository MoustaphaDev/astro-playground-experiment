import { initializeClient } from "./client";
import { installPackages, webcontainerInstance } from "~/webcontainer/setup";

export async function startDevServer() {
  await installPackages();

  const communicationProcess = await webcontainerInstance.spawn("pnpm", [
    "run",
    "dev",
  ], { output: true });

  // communicationProcess.output.pipeTo(
  //   new WritableStream({
  //     write(data) {
  //       // console.clear();
  //       console.log(data);
  //     },
  //   }),
  // );

  initializeClient(communicationProcess);

  const devExitCode = await communicationProcess.exit;

  if (devExitCode !== 0) {
    throw new Error("Unable to run pnpm run dev");
  }
  console.info("Running dev server!!");
}
