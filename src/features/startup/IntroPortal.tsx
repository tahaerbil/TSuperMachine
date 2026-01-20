
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/store';
import { LayoutTemplate, MonitorPlay, Hammer, X } from 'lucide-react';
import { TOOL_CONFIG } from '../../config/tools';
import { useTranslation } from 'react-i18next';

export function IntroPortal() {
    const setSingleWidgetMode = useStore((state) => state.setSingleWidgetMode);
    const setAppMode = useStore((state) => state.setAppMode);
    const [showToolGrid, setShowToolGrid] = useState(false);
    const { t } = useTranslation();

    return (
        <div className="w-screen h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black z-0 pointer-events-none" />
            <div className="absolute w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] -top-96 -left-32 animate-pulse" />
            <div className="absolute w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] bottom-0 right-0 animate-pulse delay-1000" />

            {/* Main Content (Hidden when grid is open for cleaner look) */}
            <AnimatePresence>
                {!showToolGrid && (
                    <motion.div
                        className="z-10 flex flex-col items-center space-y-12"
                        exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                        transition={{ duration: 0.3 }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-center"
                        >
                            <h1 className="text-6xl font-light tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                                TSUPERMACHINE <span className="text-xs align-top bg-zinc-800 px-1 rounded text-zinc-400">V2</span>
                            </h1>
                            <p className="text-zinc-500 tracking-widest text-sm uppercase">Select Your Reality</p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-8">
                            {/* Card 1: Construct */}
                            <motion.button
                                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.03)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setAppMode('workspace')}
                                className="group relative flex flex-col items-start p-8 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm transition-colors hover:border-blue-500/30 text-left"
                            >
                                <div className="mb-6 p-4 rounded-full bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                                    <Hammer size={32} />
                                </div>
                                <h3 className="text-2xl font-light mb-2 text-white group-hover:text-blue-200 transition-colors">Construct</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    Full orchestration mode. Nodes, widgets, and logic. The complete engineering suite.
                                </p>
                            </motion.button>

                            {/* Card 2: Draft */}
                            <motion.button
                                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.03)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setAppMode('cad-standalone')}
                                className="group relative flex flex-col items-start p-8 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm transition-colors hover:border-emerald-500/30 text-left"
                            >
                                <div className="mb-6 p-4 rounded-full bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                                    <LayoutTemplate size={32} />
                                </div>
                                <h3 className="text-2xl font-light mb-2 text-white group-hover:text-emerald-200 transition-colors">Draft</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    Active Focus. Pure 2D CAD environment. Maximum performance, zero distractions.
                                </p>
                            </motion.button>
                        </div>

                        {/* Footer */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex gap-4"
                        >
                            <button
                                onClick={() => setShowToolGrid(true)}
                                className="flex items-center gap-2 px-6 py-2 rounded-full border border-white/5 bg-white/5 text-zinc-500 text-sm hover:bg-white/10 hover:text-white transition-colors"
                            >
                                <MonitorPlay size={14} />
                                <span>Single Widget Mode</span>
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tool Selection Grid Overlay */}
            <AnimatePresence>
                {showToolGrid && (
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
                        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 p-8"
                    >
                        <button
                            onClick={() => setShowToolGrid(false)}
                            className="absolute top-8 right-8 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-3xl font-light mb-8 text-white">Select a Tool</h2>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-5xl w-full">
                            {TOOL_CONFIG.map((tool) => (
                                <motion.button
                                    key={tool.type}
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        visible: { opacity: 1, y: 0 }
                                    }}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSingleWidgetMode(tool.type)}
                                    className="flex flex-col items-center justify-center p-6 rounded-xl border border-white/5 bg-white/5 hover:border-white/20 transition-colors gap-3 group"
                                >
                                    <div className="text-zinc-400 group-hover:text-white transition-colors">
                                        <tool.Icon size={32} />
                                    </div>
                                    <span className="text-sm font-light text-zinc-300 group-hover:text-white">{t(tool.labelKey)}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
