import { createServer, type Plugin } from "vite";
import { getViteConfig } from "astro/config";
import flru from "flru"

const createViteServer = async () => {
  const configFn = getViteConfig({
    plugins: [virtualAstroCodePlugin()],
    server: {
      hmr: true
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
  return createServer(config)
};

// think through caching later
// using an lru cache may be
// premature optimization
const dynamicModules = flru<string>(1)

/**
  * @returns An object containing the resolved module ID of the dynamic module
  */
export function addDynamicModule(id: string, content: string) {
  const resolvedModuleId = `${ASTRO_CODE_VIRTUAL_PREFIX}/${id}`
  dynamicModules.set(resolvedModuleId, content)
  return resolvedModuleId
}

export const ASTRO_CODE_VIRTUAL_PREFIX = 'virtual:astro-code'
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
        const moduleContent = dynamicModules.get(id)
        return moduleContent || 'export default {}'
      }
    },
  };
}

function isAstroCodeVirtualModule(id: string) {
  return id.startsWith(ASTRO_CODE_VIRTUAL_PREFIX) && id.endsWith('.astro')
}

export { createViteServer };
