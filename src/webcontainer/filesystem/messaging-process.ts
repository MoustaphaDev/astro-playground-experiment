import { ServerChannel } from "./server.ts";
import { parseClientMessage } from "~/bridge";

const serverChannel = new ServerChannel();

process.stdin.on("data", async (data) => {
  let clientMessage;

  try {
    clientMessage = JSON.parse(data.toString());
  } catch (e) {
    return serverChannel.postMessage({ error: (e as Error).message });
  }

  const { data: payload, error, success } = parseClientMessage(clientMessage);
  if (!success) {
    return serverChannel.postMessage({ error: error.message });
  }
  await serverChannel.handleIncomingMessage(payload);
});

// keep the process runnnig forever
// await new Promise(() => { });
