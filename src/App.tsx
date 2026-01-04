import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { ProjectController } from './features/project';

import { useStore } from './store/store';

function App() {
  const { widgets } = useStore();
  const isAnyWidgetMaximized = widgets.some(w => w.isMaximized);

  return (
    <div className="w-screen h-screen overflow-hidden">
      <ProjectController />
      <Canvas />
      {!isAnyWidgetMaximized && <Toolbar />}
    </div>
  );
}

export default App;

