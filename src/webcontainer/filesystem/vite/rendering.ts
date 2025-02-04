import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { addDynamicModule, createViteServer } from "./config";
import { Elysia, t } from "elysia"
import { node } from "@elysiajs/node"
import type { Server } from "elysia/universal";

const viteServer = await createViteServer();

// don't use node adapter when using bun
const app = new Elysia({ adapter: process.isBun ? undefined : node() })
  .post('/astro-renderer', async (request) => {

    const { id, content } = request.body

    const resolvedModuleId = addDynamicModule(id, content)

    const maybeCachedModule = viteServer.moduleGraph.getModuleById(resolvedModuleId)
    const astroSsrModule = await (async () => {
      if (maybeCachedModule) {
        await viteServer.reloadModule(maybeCachedModule);
      }
      return maybeCachedModule?.ssrModule ?? viteServer.ssrLoadModule(resolvedModuleId);
    })()

    const astroContainer = await AstroContainer.create();
    try {
      const html = await astroContainer.renderToString(astroSsrModule.default, { partial: false });
      return new Response(html, { headers: { 'Content-Type': 'text/html' } });
    } catch (e) {
      console.error(e);
      return new Response('Internal Server Error. Failed to render Astro module', { status: 500 });
    }

  }, {
    body: t.Object({
      id: t.String(),
      content: t.String()
    }),
  })

async function warmupViteLoaderAndEndpoint(server: Server) {
  const content = `<h1>Hello World</h1>`
  const id = 'hello-world.astro'

  const url = new URL(`http://${server.url.host}/astro-renderer`)

  const request = new Request(url, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, id }),
    method: "POST",
  });

  console.log("Warming up vite loader and endpoint")

  performance.mark("start")
  await app.handle(request)
  performance.mark("end")

  const warmupMeasurement = performance.measure("warmup", "start", "end")

  console.log(`Warmup done in ${warmupMeasurement.duration}ms`)
}

app.listen({ port: 8000 }, warmupViteLoaderAndEndpoint)
