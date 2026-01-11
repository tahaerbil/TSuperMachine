import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { TabBar } from './components/workspace';
import { ProjectController } from './features/project';

import { useStore } from './store/store';

function App() {
  const { widgets } = useStore();
  const isAnyWidgetMaximized = widgets.some(w => w.isMaximized);

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col">
      <TabBar />
      <div className="flex-1 relative overflow-hidden">
        <ProjectController />
        <Canvas />
        {!isAnyWidgetMaximized && <Toolbar />}
      </div>
    </div>
  );
}

export default App;

