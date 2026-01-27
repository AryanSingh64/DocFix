"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from './ui/button'

// Tool data - customize these
const tools = [
    {
        title: "PDF Compressor",
        shortTitle: "Compress",
        description: "Compress PDF files easily.",
        icon: "✂️",
        iconBg: "bg-purple-500",
        cardBg: "bg-purple-50"
    },
    {
        title: "PDF Converter",
        shortTitle: "Convert",
        description: "Convert PDF files easily.",
        icon: "📝",
        iconBg: "bg-green-500",
        cardBg: "bg-green-50"
    },
    {
        title: "Discount Calculator",
        shortTitle: "Calculate",
        description: "Calculate sale price savings instantly.",
        icon: "📅",
        iconBg: "bg-orange-500",
        cardBg: "bg-orange-50"
    },
    {
        title: "Meta Tags Checker",
        shortTitle: "Meta Tags",
        description: "Check your site info from social media.",
        icon: "🔖",
        iconBg: "bg-red-400",
        cardBg: "bg-red-50"
    },
    {
        title: "Merge PDF",
        shortTitle: "Merge",
        description: "Combine multiple PDFs.",
        icon: "💧",
        iconBg: "bg-blue-500",
        cardBg: "bg-blue-50"
    },
    {
        title: "Lock PDF",
        shortTitle: "Lock",
        description: "Password protect PDFs.",
        icon: "🔒",
        iconBg: "bg-yellow-500",
        cardBg: "bg-yellow-50"
    },
    {
        title: "Unlock PDF",
        shortTitle: "Unlock",
        description: "Remove PDF password.",
        icon: "�",
        iconBg: "bg-teal-500",
        cardBg: "bg-teal-50"
    },
    {
        title: "Premium",
        shortTitle: "Premium",
        description: "Get premium features.",
        icon: "⭐",
        iconBg: "bg-amber-500",
        cardBg: "bg-amber-50"
    }
]

// Rotation angles for the fan effect (desktop only)
const rotations = [-10, -5, 0, 5, 10]

// Desktop Card Component (fanned layout)
const ToolCard = ({ tool, index }) => {
    return (
        <motion.div
            className={`cursor-pointer absolute w-48 h-64 rounded-2xl shadow-lg p-4 flex flex-col ${tool.cardBg}`}
            style={{
                left: `${index * 100}px`,
                zIndex: index,
            }}
            initial={{
                opacity: 0,
                y: 50,
                rotate: rotations[index]
            }}
            animate={{
                opacity: 1,
                y: 0,
                rotate: rotations[index]
            }}
            whileHover={{
                y: -20,
                zIndex: 10,
                scale: 1.15,
                rotate: 0,
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)"
            }}
            transition={{
                duration: 0.5,
                delay: index * 0.1,
                type: "spring",
                stiffness: 200
            }}
        >
            {/* Icon */}
            <div className={`w-12 h-12 ${tool.iconBg} rounded-xl flex items-center justify-center text-white text-xl mb-4`}>
                {tool.icon}
            </div>

            {/* Title */}
            <h3 className="font-bold text-gray-800 text-sm mb-2 leading-tight">
                {tool.title}
            </h3>

            {/* Description */}
            <p className="text-gray-500 text-xs leading-relaxed">
                {tool.description}
            </p>

            {/* Arrow Icon - positioned at bottom right */}
            <div className="mt-auto flex justify-end">
                <div className={`w-8 h-8 ${tool.iconBg} rounded-full flex items-center justify-center`}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" />
                    </svg>
                </div>
            </div>
        </motion.div>
    )
}

// Mobile Card Component (grid layout - small icons)
const MobileToolCard = ({ tool, index }) => {
    return (
        <motion.div
            className="cursor-pointer flex flex-col items-center gap-2 p-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.95 }}
        >
            {/* Icon */}
            <div className={`w-12 h-12 ${tool.iconBg} rounded-xl flex items-center justify-center text-white text-lg shadow-md`}>
                {tool.icon}
            </div>

            {/* Short Title */}
            <p className="text-gray-400 text-[10px] text-center font-medium leading-tight">
                {tool.shortTitle}
            </p>
        </motion.div>
    )
}

const ToolsSection = () => {
    return (
        <div className="py-15 relative overflow-hidden bg-[#0F0F0F]">

            <div className='text-white text-center'>
                <h1 className='text-sm border border-gray-300 rounded-full px-4 py-2 inline-block bg-white text-black cursor-pointer    text-sm font-semibold capi     '>Introducting <span className='text-blue-500' >DocFix</span>  &gt;</h1>
                <p className='text-gray-500 text-xs leading-relaxed mt-5 text-sm'>DocFix is a multipurpose PDF tool for all your PDF needs.</p>
            </div>
            {/* Dotted background pattern */}
            <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                    zIndex: 0
                }}
            />

            <div className="container mx-auto px-4 py-10 relative z-10">

                {/* Desktop Cards Container - Fanned layout (hidden on mobile) */}
                <div className="hidden md:flex relative h-80 justify-center items-center mb-12">
                    <div className="relative" style={{ width: '600px', height: '280px' }}>
                        {tools.slice(0, 5).map((tool, index) => (
                            <ToolCard key={index} tool={tool} index={index} />
                        ))}
                    </div>
                </div>

                {/* Mobile Cards Container - Grid layout (hidden on desktop) */}
                <div className="md:hidden mb-8">
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 mx-auto max-w-xs">
                        <div className="grid grid-cols-4 gap-2">
                            {tools.map((tool, index) => (
                                <MobileToolCard key={index} tool={tool} index={index} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <motion.div
                    className="flex justify-center gap-4 flex-wrap"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                >
                    <Button className="bg-gray-900 text-white hover:bg-gray-800 px-6">
                        View all tools
                    </Button>
                    <Button variant="outline" className="border-gray-300 text-black hover:bg-gray-100">
                        Follow us 𝕏
                    </Button>

                </motion.div>
                <p className='text-gray-500 text-xs leading-relaxed mt-5 text-center text-sm'>DocFix is a multipurpose PDF tool for all your PDF needs.</p>
            </div>
        </div>
    )
}

export default ToolsSection
