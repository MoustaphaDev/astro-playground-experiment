import { join as pathJoin, resolve as pathResolve } from "node:path";
import { readdirSync, readFileSync } from "node:fs";
import type { FileSystemTree } from "@webcontainer/api";
import type { Plugin } from "vite";

const VIRTUAL_MODULE_ID = "virtual:webcontainer-snapshot";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;

export default function pluginSnapshot(): Plugin {
  const rootRelativeSnapshotUrl = "./src/webcontainer/filesystem";
  let snapshot: FileSystemTree;

  return {
    name: "webcontainer-snapshot",
    async configResolved(config) {
      const snapshotUrl = pathResolve(config.root, rootRelativeSnapshotUrl);
      snapshot = dirToFileSystemTree(snapshotUrl);

      console.log("Snapshot: ", snapshot);
    },
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
    },
    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        return `\
export default ${JSON.stringify(snapshot)}\
`;
      }
    },
  };
}

function dirToFileSystemTree(dirPath: string) {
  const entries = readdirSync(dirPath, { withFileTypes: true });
  const tree: FileSystemTree = {};

  entries.forEach((entry) => {
    // Skip node_modules directories
    if (
      entry.isDirectory() &&
      (entry.name === "node_modules" || entry.name === ".astro")
    ) {
      return;
    }

    const fullPath = pathJoin(dirPath, entry.name);

    if (entry.isDirectory()) {
      tree[entry.name] = {
        directory: dirToFileSystemTree(fullPath),
      };
    } else if (entry.isFile()) {
      tree[entry.name] = {
        file: {
          contents: readFileSync(fullPath, "utf-8"),
        },
      };
    }
  });

  return tree;
}
