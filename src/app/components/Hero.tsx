"use client";

import Image from "next/image"



import { motion } from "framer-motion";

const MotionImage = motion(Image);


  


export default function Hero() {
  return (
    <div className="overflow-hidden mb-0 bg-white py-12 my-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
          <div className="lg:pt-4 lg:pr-8">
            <div className="lg:max-w-lg">
              <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-black sm:text-7xl">
              Think deeper. Share simply.
              </p>
             {/* Short text for small screens */}
<p className="block sm:hidden mt-2 text-lg/8 text-gray-600">
  Reflect and share simply.
</p>

{/* Full text for larger screens */}
<p className="hidden sm:block mt-2 text-lg/8 text-gray-600">
  Write. Reflect. Connect. One sentence at a time.
</p>  
<div className='mt-3'>
<button
  type="button"
  className="text-white bg-gradient-to-r from-[#000000] to-[#434343] hover:bg-gradient-to-r hover:from-[#2c2c2c] hover:to-[#565656] focus:outline-none focus:ring-4 focus:ring-gray-800 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 border-3 border-white"
>
  Get started
</button>







<button
  type="button"
  className="py-2.5 px-5 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-transparent rounded-full border border-black hover:bg-gray-100 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700"

>
  Learn more
</button>
</div>


            </div>
          </div>
          <div className="flex flex-row items-center justify-center gap-4 flex-wrap sm:gap-6 mt-6">
          <img src="/images/Insights.svg" alt="Illustration 1 verified" data-test="check" className="w-20 sm:w-32" />
  <img src="/images/Thoughts.svg" alt="Illustration 2" className="w-20 sm:w-32" />
  <img src="/images/You.svg" alt="Illustration 3" className="w-20 sm:w-32" />
</div>


        </div>
        <div className="container lg:mt-10 lg:py-10 mx-auto p-4">
        <div className="max-w-4xl mx-auto">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="h-auto w-full rounded-lg shadow-xl dark:shadow-gray-800"
      >
        <MotionImage
          src="/images/visual.png"
          width={1200}
          height={800}
          alt="Image description"
          className="rounded-lg"
          priority
        />
      </motion.div>
    </div>
    </div>
      </div>
    </div>
  )
}
