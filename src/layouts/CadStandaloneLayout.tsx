
import { CAD2DWidget } from '../features/cad-2d';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useStore } from '../store/store';

export function CadStandaloneLayout() {
    const setAppMode = useStore(state => state.setAppMode);

    return (
        <motion.div
            key="cad"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-screen h-screen overflow-hidden bg-black relative"
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

            {/* Fullscreen CAD Instance - No Wrapper, No Resizing */}
            <CAD2DWidget
                id="standalone-cad"
                isMaximized={true} // Force maximized styling internally if prop exists
            />
        </motion.div>
    );
}
