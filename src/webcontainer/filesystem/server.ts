import {
  type ClientMessage,
  CommunicationPlatform,
  type ServerMessage,
} from "~/bridge";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { addDynamicModule, createViteLoader } from "./vite-loader.ts";

const { viteLoadModule } = await createViteLoader();

class ServerChannel extends CommunicationPlatform<NodeJS.Process> {
  constructor() {
    super(process);
  }

  postMessage(message: ServerMessage) {
    process.stdin.write(JSON.stringify(message));
  }

  async handleIncomingMessage(payload: ClientMessage) {
    const { id, content } = payload;

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
      return this.postMessage({ html });
    } catch (e) {
      console.error(e);
      return this.postMessage({
        error: "Internal Server Error. Failed to render Astro module",
      });
    }
  }
}
export { ServerChannel };
