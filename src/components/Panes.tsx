import { createResource, onMount } from "solid-js";
import { code, setCode } from "../state"
import { mountContainerOnIframe, startDevServer } from "../webcontainer/setup";

function fetchAstroHTML(code: string) {
  return `<h1>Fake Astro HTML</h1>`
}

const Editor = () => {
  return (<textarea onInput={(e) => setCode(e.target.value)}>{code()}</textarea>)
}

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
  })
  return <div><iframe srcdoc={astroHTML()} ref={webContainerIframeRef!} /></div>
}

export { Editor, Preview }
