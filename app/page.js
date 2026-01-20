import React from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import ToolsSection from '@/components/ToolsSection'
const homePage = () => {
  return (
    <>
      <div className='bg-[#0F0F0F] h-screen text-white'>
        <Navbar />
        <Hero />
        <ToolsSection />
      </div>
    </>
  )
}

export default homePage