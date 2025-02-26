import { createServer, type Plugin } from "vite";
import { getViteConfig } from "astro/config";
import flru from "flru";

const createViteLoader = async () => {
  const configFn = getViteConfig({
    plugins: [virtualAstroCodePlugin()],
    server: {
      hmr: true,
    },
  }, {
    devToolbar: {
      enabled: false,
    },
    logLevel: "silent",
  });
  const config = await configFn({
    command: "serve",
    mode: "",
    isSsrBuild: true,
    isPreview: false,
  });
  const viteDevServer = await createServer(config);
  // to get around https://github.com/vitejs/vite/issues/3798
  await viteDevServer.pluginContainer.buildStart({});

  return {
    async viteLoadModule(url: string) {
      // const moduleInfo = viteDevServer.pluginContainer.getModuleInfo(url);
      // console.log("Module Info: ", moduleInfo);

      // gymnastics to ensure that we always
      // refetch the module and avoid caching
      // there could be a better way to do this
      const maybeCachedModule = viteDevServer.moduleGraph.getModuleById(url);
      return (async () => {
        if (maybeCachedModule) {
          await viteDevServer.reloadModule(maybeCachedModule);
        }
        const a = maybeCachedModule?.ssrModule ??
          viteDevServer.ssrLoadModule(url);
        // const moduleInfo = viteDevServer.pluginContainer.getModuleInfo(url);
        // console.log("Module Info: ", moduleInfo);
        return a;
      })();
    },
  };
};

// think through caching later
// using an lru cache may be
// premature optimization
// also would not using an async store
// lead to unexpected results?
const dynamicModules = flru<string>(10);

/**
 * @returns An object containing the resolved module ID of the dynamic module
 */
export function addDynamicModule(id: string, content: string) {
  const resolvedModuleId = `${ASTRO_CODE_VIRTUAL_PREFIX}/${id}`;
  dynamicModules.set(resolvedModuleId, content);
  return resolvedModuleId;
}

const ASTRO_CODE_VIRTUAL_PREFIX = "virtual:astro-code";
function virtualAstroCodePlugin(): Plugin {
  return {
    name: "virtual-astro-code",
    resolveId(id) {
      if (isAstroCodeVirtualModule(id)) {
        return id;
      }
    },
    load(id) {
      if (isAstroCodeVirtualModule(id)) {
        const moduleContent = dynamicModules.get(id);
        return moduleContent ?? "<h1>Loading...</h1>";
      }
    },
  };
}

function isAstroCodeVirtualModule(id: string) {
  return id.startsWith(ASTRO_CODE_VIRTUAL_PREFIX) && id.endsWith(".astro");
}

export { createViteLoader };
