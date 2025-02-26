import {
  type ClientMessage,
  parseClientMessage,
  type ServerMessage,
} from "~/bridge";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { addDynamicModule, createViteLoader } from "./vite-loader.ts";

const { viteLoadModule } = await createViteLoader();

class ServerContainer {
  static async handleRequest(
    data: Record<string, string>,
  ): Promise<ServerMessage> {
    const { data: payload, error, success } = parseClientMessage(data);
    if (!success) {
      return { type: "error", error: error.message };
    }
    return ServerContainer.handleClientMessage(payload);
  }

  private static async handleClientMessage(
    payload: ClientMessage,
  ): Promise<ServerMessage> {
    const { id, content } = payload;

    const resolvedModuleId = addDynamicModule(id, content);
    const astroContainer = await AstroContainer.create();

    try {
      const astroSsrModule = await viteLoadModule(resolvedModuleId);
      const html = await astroContainer.renderToString(astroSsrModule.default, {
        partial: false,
      });
      // find a way to collect script and styles
      // const script = await viteLoadModule(
      //   "/@id/virtual:astro-code/module.astro?astro&type=script&index=0&lang.ts",
      // );
      // console.log("Script: ", script);
      return { type: "response", html };
    } catch (e) {
      return {
        type: "error",
        error: `Internal Server Error. Failed to render Astro module.\n\n${e}`,
      };
    }
  }
}
export { ServerContainer };
