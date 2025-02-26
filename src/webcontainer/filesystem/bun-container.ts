import { spawn } from "bun";

const childProcess = spawn(["bun", "./jsnix-test.ts"], {
  stdin: "pipe",
  stdout: "pipe",
});

const decoder = new TextDecoder();

childProcess.stdout.pipeTo(
  new WritableStream({
    write(data) {
      console.log(decoder.decode(data));
    },
  }),
);

while (true) {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  childProcess.stdin.write(
    JSON.stringify({
      type: "request",
      id: "file.astro",
      content: "<h1>Loading...</h1>",
    }),
  );
}
