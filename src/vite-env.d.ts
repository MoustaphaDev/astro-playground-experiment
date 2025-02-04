/// <reference types="vite/client" />

declare module "virtual:webcontainer-snapshot" {
  const snapshot: import("@webcontainer/api").FileSystemTree;
  export default snapshot;
}
