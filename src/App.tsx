import { AnimatePresence } from 'framer-motion';
import { useStore } from './store/store';
import { IntroPortal } from './features/startup/IntroPortal';
import { WorkspaceLayout } from './layouts/WorkspaceLayout';
import { CadStandaloneLayout } from './layouts/CadStandaloneLayout';
import { SingleWidgetLayout } from './layouts/SingleWidgetLayout';

function App() {
  const appMode = useStore((state) => state.appMode);

  return (
    <AnimatePresence mode="wait">
      {appMode === 'intro' && <IntroPortal key="intro" />}
      {appMode === 'workspace' && <WorkspaceLayout key="workspace" />}
      {appMode === 'cad-standalone' && <CadStandaloneLayout key="cad-standalone" />}
      {appMode === 'single-widget' && <SingleWidgetLayout key="single-widget" />}
    </AnimatePresence>
  );
}

export default App;

