import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { addDynamicModule, createViteLoader } from "./vite-loader";
import { Elysia, t } from "elysia";
import { node } from "@elysiajs/node";
import { cors } from "@elysiajs/cors";
import type { Server } from "elysia/universal";

const { viteLoadModule } = await createViteLoader();

// don't use node adapter when using bun
const app = new Elysia({ adapter: process.isBun ? undefined : node() })
  .use(cors())
  .post("/astro_renderer", async ({ body, error }) => {
    const { id, content } = body;

    const resolvedModuleId = addDynamicModule(id, content);

    const astroSsrModule = await viteLoadModule(resolvedModuleId);

    const astroContainer = await AstroContainer.create();
    try {
      const html = await astroContainer.renderToString(astroSsrModule.default, {
        partial: false,
      });
      // find a way to collect script and styles
      // const script = await viteLoadModule(
      //   "/@id/virtual:astro-code/module.astro?astro&type=script&index=0&lang.ts",
      // );
      // console.log("Script: ", script);
      return new Response(html, { headers: { "Content-Type": "text/html" } });
    } catch (e) {
      console.error(e);
      return error(500, "Internal Server Error. Failed to render Astro module");
    }
  }, {
    body: t.Object({
      id: t.String(),
      content: t.String(),
    }),
  });

app.listen({ port: 8000 }, warmupViteLoaderAndEndpoint);

async function warmupViteLoaderAndEndpoint(server: Server) {
  const content = `<h1>Hello World</h1>`;
  const id = "hello-world.astro";

  const url = new URL(`http://${server.url.host}/astro_renderer`);

  const request = new Request(url, {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, id }),
    method: "POST",
  });

  console.info("Warming up vite loader and endpoint");

  performance.mark("start");
  const response = await app.handle(request);
  if (response.status !== 200) {
    console.error(await response.text());
    console.error("Failed to warmup vite loader and endpoint");
  }
  performance.mark("end");

  const warmupMeasurement = performance.measure("warmup", "start", "end");

  console.info(`Warmup done in ${warmupMeasurement.duration}ms`);
}

type App = typeof app;

export { type App };
