
"use client"

import React from 'react'
import { Button } from './ui/button'
import { motion } from 'framer-motion'

const Hero = () => {
  return (
    <div className='flex justify-center items-center'>
      <div className='text-center max-w-lg mt-30 flex gap-5 flex-col'>

        <motion.h1
          className='text-5xl font-bold'
          initial={{ opacity: 0, y: 20 }}    // Start: invisible, 20px below
          animate={{ opacity: 1, y: 0 }}     // End: visible, normal position
          transition={{ duration: 0.6 }}     // Takes 0.6 seconds
        >
          Your All-in-one Online <br />
          <span className='text-blue-500'>PDF Tools</span>
        </motion.h1>

        <motion.p
          className='text-gray-500'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Stirling makes reading, editing, and creating PDFs fast and seamless.
        </motion.p>

        <motion.div
          className='flex gap-5 justify-center'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button className="text-black bg-white hover:bg-gray-300 cursor-pointer p-5">
              Get Started
            </Button>
          </motion.div>

          <motion.div
            className="rounded-md"
            initial={{ boxShadow: "0 0 0px rgba(59, 130, 246, 0)" }}
            whileHover={{
              boxShadow: [
                "0 0 5px rgba(59, 130, 246, 0.4)",
                "0 0 20px rgba(59, 130, 246, 0.8)",
                "0 0 5px rgba(59, 130, 246, 0.4)"
              ]
            }}
            whileTap={{ scale: 0.95 }}
            transition={{
              boxShadow: {
                duration: 1.5,
                // repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          >
            <Button className="cursor-pointer border border-blue-500/50 bg-transparent hover:bg-blue-500/10 p-5">
              Watch Demo
            </Button>
          </motion.div>
        </motion.div>

      </div>
    </div>
  )
}

export default Hero