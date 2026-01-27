'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const MASCOTS = [1, 2, 3, 4, 5, 6];

export default function MascotAvatar({
    mascotId = 1,
    size = 'md',
    onSelect,
    editable = false
}) {
    const [showPicker, setShowPicker] = useState(false);
    const containerRef = useRef(null);

    const sizeClasses = {
        sm: 'w-10 h-10',
        md: 'w-16 h-16',
        lg: 'w-24 h-24',
        xl: 'w-32 h-32'
    };

    const imgSizes = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-20 h-20',
        xl: 'w-28 h-28'
    };

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowPicker(false);
            }
        };

        if (showPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showPicker]);

    const handleSelect = (id) => {
        if (onSelect) {
            onSelect(id);
        }
        setShowPicker(false);
    };

    return (
        <div className="relative" ref={containerRef}>
            {/* Main Avatar */}
            <motion.button
                onClick={() => editable && setShowPicker(!showPicker)}
                whileHover={editable ? { scale: 1.05 } : {}}
                whileTap={editable ? { scale: 0.95 } : {}}
                className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center overflow-hidden ${editable ? 'cursor-pointer ring-2 ring-purple-500/50 hover:ring-purple-400' : ''}`}
            >
                <img
                    src={`/mascots/mascot-${mascotId}.svg`}
                    alt="Avatar"
                    className={imgSizes[size]}
                />
            </motion.button>

            {/* Edit Badge */}
            {editable && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs border-2 border-[#13111a]">
                    ✎
                </div>
            )}

            {/* Mascot Picker Modal - Fixed positioning */}
            <AnimatePresence>
                {showPicker && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="fixed sm:absolute top-1/2 left-1/2 sm:top-full sm:left-auto sm:right-0 sm:translate-x-0 -translate-x-1/2 -translate-y-1/2 sm:translate-y-0 sm:mt-2 z-[100] bg-[#252132] rounded-2xl p-4 shadow-2xl border border-purple-500/20 w-[200px]"
                    >
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-sm font-medium text-white">Choose Avatar</p>
                            <button
                                onClick={() => setShowPicker(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {MASCOTS.map((id) => (
                                <motion.button
                                    key={id}
                                    onClick={() => handleSelect(id)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${mascotId === id
                                            ? 'bg-purple-600 ring-2 ring-purple-400'
                                            : 'bg-white/10 hover:bg-white/20'
                                        }`}
                                >
                                    <img
                                        src={`/mascots/mascot-${id}.svg`}
                                        alt={`Mascot ${id}`}
                                        className="w-8 h-8"
                                    />
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
