'use client';
import { motion } from 'framer-motion';
import { FileText, HardDrive, Star, TrendingUp } from 'lucide-react';

export default function DashboardStats({
    totalDocs = 0,
    storageSaved = 0,
    isPro = false,
    totalCompressions = 0
}) {
    const formatBytes = (bytes) => {
        if (!bytes) return '0 MB';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const stats = [
        {
            label: 'Total Documents',
            value: totalDocs.toLocaleString(),
            icon: FileText,
            gradient: 'from-purple-600 to-purple-400',
            bgGradient: 'from-purple-600/20 to-purple-400/10',
            change: '+12%',
            positive: true
        },
        {
            label: 'Storage Saved',
            value: formatBytes(storageSaved),
            icon: HardDrive,
            gradient: 'from-pink-600 to-pink-400',
            bgGradient: 'from-pink-600/20 to-pink-400/10',
            change: '+8%',
            positive: true
        },
        {
            label: 'Plan Status',
            value: isPro ? 'Pro' : 'Free',
            icon: Star,
            gradient: isPro ? 'from-amber-500 to-orange-400' : 'from-gray-500 to-gray-400',
            bgGradient: isPro ? 'from-amber-500/20 to-orange-400/10' : 'from-gray-500/20 to-gray-400/10',
            badge: isPro ? '⭐ Active' : 'Upgrade',
            positive: isPro
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {stats.map((stat, index) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.bgGradient} border border-white/10 p-6`}
                >
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-10">
                        {/* Icon and Label */}
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-gray-400">{stat.label}</span>
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                                <stat.icon size={20} className="text-white" />
                            </div>
                        </div>

                        {/* Value */}
                        <div className="flex items-end gap-3">
                            <span className="text-3xl font-bold text-white">{stat.value}</span>
                            {stat.change && (
                                <span className={`text-sm font-medium flex items-center gap-1 ${stat.positive ? 'text-green-400' : 'text-red-400'}`}>
                                    <TrendingUp size={14} />
                                    {stat.change}
                                </span>
                            )}
                            {stat.badge && (
                                <span className={`text-xs px-2 py-1 rounded-full ${stat.positive ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                    {stat.badge}
                                </span>
                            )}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
