import React from 'react'
import Link from 'next/link'
const homePage = () => {
  return (
    <>
      <h1 className='text-red-600' >HomePage</h1>
      <Link href="/compress-pdf" className='border-2 border-solid p-2'>compress pdf</Link>
    </>
  )
}

export default homePage