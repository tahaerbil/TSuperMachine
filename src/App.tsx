import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';

function App() {
  return (
    <div className="w-screen h-screen overflow-hidden">
      <Canvas />
      <Toolbar />
    </div>
  );
}

export default App;

