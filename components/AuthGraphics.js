'use client';
import { motion } from 'framer-motion';

export default function AuthGraphics() {
    return (
        <div className="relative w-full h-full bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 overflow-hidden">
            {/* Animated geometric shapes */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0"
            >
                {/* Large diagonal shape */}
                <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-purple-500/30 rotate-45 rounded-3xl" />
                <div className="absolute right-10 bottom-40 w-64 h-64 bg-cyan-400/20 rotate-12 rounded-3xl" />

                {/* Floating circles */}
                <motion.div
                    animate={{ y: [0, -20, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-20 right-40 w-20 h-20 bg-white/10 rounded-full backdrop-blur-sm"
                />
                <motion.div
                    animate={{ y: [0, 20, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-32 left-20 w-12 h-12 bg-cyan-300/30 rounded-full"
                />
            </motion.div>

            {/* Floating Card 1 - Inbox Stats */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="absolute top-24 right-24 bg-white rounded-2xl p-5 shadow-2xl shadow-blue-900/20"
            >
                <p className="text-xs font-medium text-orange-500 mb-1">Inbox</p>
                <p className="text-3xl font-bold text-gray-900">176,18</p>
                <div className="mt-4 flex items-end gap-1">
                    <div className="relative">
                        <svg className="w-24 h-12" viewBox="0 0 100 50">
                            <path
                                d="M 0 40 Q 25 10, 50 30 T 100 20"
                                fill="none"
                                stroke="url(#gradient)"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#fbbf24" />
                                    <stop offset="100%" stopColor="#f97316" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute -top-1 right-0 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white">45</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Floating Card 2 - Social Icon */}
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="absolute top-20 right-8 w-14 h-14 bg-gradient-to-br from-pink-500 to-orange-400 rounded-xl flex items-center justify-center shadow-xl"
            >
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
            </motion.div>

            {/* Floating Card 3 - PDF Icon */}
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="absolute top-48 right-4 w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-xl"
            >
                <img className='w-8' src="/pdf.svg" alt="" />
            </motion.div>

            {/* Floating Card 4 - Security Card */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="absolute bottom-32 right-20 bg-white rounded-2xl p-5 shadow-2xl shadow-blue-900/20 max-w-[200px]"
            >
                <div className="flex items-start gap-3 mb-3">
                    <div className="space-y-1.5">
                        <div className="w-20 h-2 bg-blue-500 rounded-full" />
                        <div className="w-14 h-2 bg-blue-300 rounded-full" />
                    </div>
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-orange-500">
                            <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
                        </svg>
                    </div>
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Your data, your rules</h3>
                <p className="text-xs text-gray-500">Your data belongs to you, and our encryption ensures that</p>
            </motion.div>

            {/* Language Selector (positioned at bottom left of main container) */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="absolute bottom-8 left-8 flex items-center gap-2 text-white/80 text-sm"
            >
                <span className="text-lg">🇬🇧</span>
                <span>ENG</span>
                <span className="text-xs">∧</span>
            </motion.div>
        </div>
    );
}
