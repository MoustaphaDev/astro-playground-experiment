import { createResource, type ResourceFetcher } from "solid-js";
import { code, setCode } from "../state";
import { client } from "~/app/client";

const fetchAstroHTML =
  (async function (code: string, { value: previousValue }) {
    if (!client) {
      return "<h1>Loading...</h1>";
    }
    const { html, error } = await client.postMessage({
      id: "module.astro",
      content: code,
    });

    if (!error) {
      return html ?? "<h1>Loading...</h1>";
    }
    return previousValue ?? "<h1>Loading...</h1>";
    // return `<h1>Fake Astro HTML</h1>`;
  }) satisfies ResourceFetcher<string, string>;

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
  let webContainerIframeRef: HTMLIFrameElement | undefined;
  return (
    // TODO: doesn't need to be an iframe i think
    <iframe
      class="w-full h-full"
      srcdoc={astroHTML()}
      ref={webContainerIframeRef!}
    />
  );
};

export { Editor, Preview };
