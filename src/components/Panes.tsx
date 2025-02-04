import { createResource, onMount } from "solid-js";
import { code, setCode } from "../state";
import { mountContainerOnIframe, startDevServer } from "../webcontainer/setup";

function fetchAstroHTML(code: string) {
  return `<h1>Fake Astro HTML</h1>`;
}

const Editor = () => {
  return (
    <textarea
      class="bg-purple-800 outline-none"
      onInput={(e) => setCode(e.target.value)}
    >
      {code()}
    </textarea>
  );
};

const Preview = () => {
  const [astroHTML] = createResource(code, fetchAstroHTML);
  let webContainerIframeRef: HTMLIFrameElement | null;
  onMount(async () => {
    try {
      await startDevServer();
      mountContainerOnIframe(webContainerIframeRef!);
    } catch (e) {
      console.error(e);
      console.error("Failed to start dev server");
    }
  });
  return (
    <iframe
      class="w-full h-full"
      srcdoc={astroHTML()}
      ref={webContainerIframeRef!}
    />
  );
};

export { Editor, Preview };
