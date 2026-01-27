'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    FileText,
    Activity,
    User,
    Settings,
    LogOut,
    Moon,
    Sun,
    Upload,
    FileSearch,
    Menu,
    X
} from 'lucide-react';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: FileText, label: 'Compress PDF', href: '/compress-pdf' },
    { icon: FileSearch, label: 'Summarise', href: '/summarise' },
    { icon: Activity, label: 'Activity', href: '/dashboard#activity' },
    { icon: User, label: 'Profile', href: '/dashboard#profile' },
];

export default function Sidebar({
    onSignOut,
    userName,
    userEmail,
    mascotId = 1,
    isDarkMode = true,
    onToggleDarkMode
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const handleNavClick = (href) => {
        if (href.startsWith('/')) {
            router.push(href);
        }
        setIsOpen(false); // Close mobile menu after navigation
    };

    const SidebarContent = () => (
        <>
            {/* Logo Section */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white tracking-wide">DOCFIX</h1>
                {/* Close button - mobile only */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="lg:hidden text-gray-400 hover:text-white"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hidden">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    return (
                        <motion.button
                            key={item.label}
                            onClick={() => handleNavClick(item.href)}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${isActive
                                ? 'bg-gradient-to-r from-purple-600/30 to-purple-500/10 text-white border-l-2 border-purple-500'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </motion.button>
                    );
                })}

                {/* Divider */}
                <div className="my-4 border-t border-white/10" />

                {/* Dark Mode Toggle */}
                <motion.button
                    onClick={onToggleDarkMode}
                    whileHover={{ x: 4 }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all text-left"
                >
                    <div className="flex items-center gap-3">
                        {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                        <span className="font-medium">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
                    </div>
                    {/* Toggle Switch */}
                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-purple-600' : 'bg-gray-600'}`}>
                        <motion.div
                            className="w-4 h-4 bg-white rounded-full"
                            animate={{ x: isDarkMode ? 16 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                    </div>
                </motion.button>

                {/* Settings */}
                <motion.button
                    onClick={() => handleNavClick('/settings')}
                    whileHover={{ x: 4 }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all text-left"
                >
                    <Settings size={20} />
                    <span className="font-medium">Settings</span>
                </motion.button>

                {/* Logout */}
                <motion.button
                    onClick={onSignOut}
                    whileHover={{ x: 4 }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-left"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </motion.button>
            </nav>

            {/* Upload New Project Button */}
            <div className="p-4 border-t border-white/10">
                <motion.button
                    onClick={() => handleNavClick('/compress-pdf')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-xl transition-all"
                >
                    <Upload size={18} />
                    <span className="font-medium">Upload new file</span>
                </motion.button>
            </div>

            {/* User Profile Section */}
            <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-600/30 flex items-center justify-center">
                        <img
                            src={`/mascots/mascot-${mascotId}.svg`}
                            alt="Avatar"
                            className="w-8 h-8"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{userName || 'User'}</p>
                        <p className="text-xs text-gray-400 truncate">{userEmail}</p>
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Hamburger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-40 w-12 h-12 bg-[#1a1625] rounded-xl flex items-center justify-center text-white shadow-lg border border-white/10"
            >
                <Menu size={24} />
            </button>

            {/* Desktop Sidebar - Always visible */}
            <motion.aside
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="hidden lg:flex w-64 h-screen bg-[#1a1625] flex-col fixed left-0 top-0 z-50"
            >
                <SidebarContent />
            </motion.aside>

            {/* Mobile Sidebar - Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="lg:hidden fixed inset-0 bg-black/60 z-40"
                        />

                        {/* Mobile Sidebar */}
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="lg:hidden w-72 h-screen bg-[#1a1625] flex flex-col fixed left-0 top-0 z-50"
                        >
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
