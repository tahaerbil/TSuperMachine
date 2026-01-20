
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useStore } from '../store/store';
import { WidgetContent } from '../core/widgets';

export function SingleWidgetLayout() {
    const setAppMode = useStore(state => state.setAppMode);
    const activeType = useStore(state => state.activeSingleWidgetType);

    return (
        <motion.div
            key="single-widget"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-screen h-screen overflow-hidden bg-zinc-950 relative flex items-center justify-center"
        >
            {/* Floating Back Navigation */}
            <div className="absolute top-16 left-4 z-50">
                <button
                    onClick={() => setAppMode('intro')}
                    className="p-2 rounded-full bg-black/50 hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition-colors border border-white/5 backdrop-blur-md group"
                    title="Back to Portal"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>
            </div>

            {/* Content Container */}
            <div className="w-full h-full p-4 md:p-8 flex flex-col">
                {activeType ? (
                    <div className="flex-1 w-full h-full relative rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 shadow-2xl">
                        <WidgetContent
                            widget={{
                                id: 'single-mode-widget',
                                type: activeType,
                                title: activeType, // Default title to type
                                position: { x: 0, y: 0 },
                                size: { width: 100, height: 100 },
                                data: {},
                                isMaximized: true,
                                zIndex: 1
                            }}
                        />
                    </div>
                ) : (
                    <div className="text-zinc-500">No tool selected.</div>
                )}
            </div>
        </motion.div>
    );
}
