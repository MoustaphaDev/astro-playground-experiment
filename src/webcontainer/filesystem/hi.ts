import { stderr, stdin } from "node:process";

let count = 0;

stdin.on("data", (data) => {
  count++;
  stderr.write(data);
});

while (true) {
  const payload = JSON.stringify({ html: `<h1>Hey there - ${count}</h1>` });
  await new Promise((resolve) => setTimeout(resolve, 1000));
  stdin.push("Fake client message");
}
