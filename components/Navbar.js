"use client"
import { motion } from 'framer-motion'
import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

const Navbar = () => {
    const { user, loading } = useAuth()

    
    return (
        <motion.nav className="scrollbar-hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
        >
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                {/* Logo */}
                <Link href="/" className="text-xl font-bold text-blue-600">
                    DocFix
                </Link>

                <div className='flex gap-4 text-white'>
                    <Link href="/" className="text-l font-semibold">
                        Home
                    </Link>
                    <Link href="/compress-pdf" className="text-l font-semibold">
                        Compress PDF
                    </Link>
                </div>

                <div className="flex items-center gap-2">

                    {loading ? (
                        <div className="w-20 h-9 bg-gray-700 rounded animate-pulse"></div>
                    ) : user ? (
                        //if user yes 
                        <Button asChild className='bg-blue-600 text-white hover:bg-blue-700 active:scale-95'>
                            <Link href="/dashboard">Dashboard</Link>
                        </Button>
                    ) : (
                        //if user no
                        <Button asChild className='bg-white text-black hover:bg-gray-200 active:scale-95'>
                            <Link href="/auth">Sign Up</Link>
                        </Button>
                    )}
                </div>
            </div>
        </motion.nav>
    )
}

export default Navbar