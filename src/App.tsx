import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { ProjectManager } from './features/project/ProjectManager';

import { useStore } from './store/store';

function App() {
  const { widgets } = useStore();
  const isAnyWidgetMaximized = widgets.some(w => w.isMaximized);

  return (
    <div className="w-screen h-screen overflow-hidden">
      <ProjectManager />
      <Canvas />
      {!isAnyWidgetMaximized && <Toolbar />}
    </div>
  );
}

export default App;

