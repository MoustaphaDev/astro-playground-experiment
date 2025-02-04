import type { Plugin } from 'vite'
import { snapshot } from '@webcontainer/snapshot';
import { resolve as pathResolve } from 'node:path'


const VIRTUAL_MODULE_ID = 'virtual:webcontainer-snapshot'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

export default function pluginSnapshot(): Plugin {
  const rootRelativeSnapshotUrl = "./src/webcontainer/filesystem"
  let snapshotBuffer: Buffer | undefined;

  return {
    name: 'webcontainer-snapshot',
    async configResolved(config) {
      const snapshotUrl = pathResolve(config.root, rootRelativeSnapshotUrl)
      snapshotBuffer = await snapshot(snapshotUrl)

    },
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID
      }
    },
    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        const serializedSnapshot = snapshotBuffer!.toString('base64');
        return `\
${base64ToArrayBuffer.toString()};
export default base64ToArrayBuffer("${serializedSnapshot}");`
      }
    }
  }
}

function base64ToArrayBuffer(base64String: string) {
  // 1. Decode base64 to a binary string
  const binaryString = atob(base64String);

  // 2. Create a Uint8Array to hold the raw bytes
  const bytes = new Uint8Array(binaryString.length);

  // 3. Convert each character to its byte value
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // 4. Return the underlying ArrayBuffer
  return bytes.buffer;
}
