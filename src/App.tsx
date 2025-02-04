import "./App.css";
import { Editor, Preview } from "./components/Panes";

function App() {
  return (
    <>
      <div class="grid grid-cols-2 w-screen h-screen text-zinc-100 text-2xl justify-center">
        <Editor />
        <Preview />
      </div>
    </>
  );
}

export default App;
