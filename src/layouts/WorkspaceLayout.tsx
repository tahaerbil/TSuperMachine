
import { Canvas } from '../components/Canvas';
import { Toolbar } from '../components/Toolbar';
import { TabBar } from '../components/workspace';
import { ProjectController } from '../features/project';
import { useStore } from '../store/store';
import { motion } from 'framer-motion';

export function WorkspaceLayout() {
    const { widgets } = useStore();
    const isAnyWidgetMaximized = widgets.some(w => w.isMaximized);

    return (
        <motion.div
            key="workspace"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-screen h-screen overflow-hidden flex flex-col bg-zinc-900"
        >
            <TabBar />
            <div className="flex-1 relative overflow-hidden">
                <ProjectController />
                <Canvas />
                {!isAnyWidgetMaximized && <Toolbar />}
            </div>
        </motion.div>
    );
}
