import './App.css'
import { Editor, Preview } from './components/Panes'

function App() {
  return (<>
    <div class="grid grid-cols-2 bg-zinc-900 w-full- h-full text-zinc-100 text-2xl place-content-center justify-center">
      <div>
        <Editor />
      </div>
      <div>
        <Preview />
      </div>
    </div>
  </>)
}



export default App
