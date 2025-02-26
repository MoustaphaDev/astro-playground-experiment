import { Readable } from "node:stream";
import { Relay } from "./src/relay";
import { ServerContainer } from "./src/server";

try {
  const input = Readable.toWeb(process.stdin);
  const output = new WritableStream({
    write(chunk) {
      process.stdout.write(chunk, "utf8");
    },
  });
  const relay = new Relay(input, output);
  await relay.start({ requestHandler: ServerContainer.handleRequest });
  process.exit(0);
} catch (err: any) {
  console.error(err);
  process.exit(1);
}
