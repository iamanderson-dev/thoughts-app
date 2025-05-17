'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react'
import {
  ArrowPathIcon,
  Bars3Icon,
  ChartPieIcon,
  CursorArrowRaysIcon,
  FingerPrintIcon,
  SquaresPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { ChevronDownIcon, PhoneIcon, PlayCircleIcon } from '@heroicons/react/20/solid'
import { Poppins } from 'next/font/google'
import { motion } from 'framer-motion'
import Link from 'next/link'



const poppins = Poppins({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'], // Choose the weights you want
  });

const products = [
  { name: 'Analytics', description: 'Get a better understanding of your traffic', href: '#', icon: ChartPieIcon },
  { name: 'Engagement', description: 'Speak directly to your customers', href: '#', icon: CursorArrowRaysIcon },
  { name: 'Security', description: "Your customers' data will be safe and secure", href: '#', icon: FingerPrintIcon },
  { name: 'Integrations', description: 'Connect with third-party tools', href: '#', icon: SquaresPlusIcon },
  { name: 'Automations', description: 'Build strategic funnels that will convert', href: '#', icon: ArrowPathIcon },
]
const callsToAction = [
  { name: 'Watch demo', href: '#', icon: PlayCircleIcon },
  { name: 'Contact sales', href: '#', icon: PhoneIcon },
]

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-transparent py-4 flex justify-center">
      {/* Mobile nav: only visible on small screens */}
      <div className="w-full max-w-xs sm:max-w-lg bg-white border border-gray-200 shadow rounded-full flex items-center px-4 py-2 mx-2 sm:hidden">
        <div className="flex flex-1">
          <a href="#" className="-m-1.5 p-1.5">
            <h2 className='font-cal font-bold text-xl'>thoughts</h2>
          </a>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
        >
          <span className="sr-only">Open main menu</span>
          <Bars3Icon aria-hidden="true" className="size-6" />
        </button>
      </div>
      {/* Desktop nav: only visible on md and up */}
      <nav
        aria-label="Global"
        className={`hidden sm:flex justify-between items-center mx-auto w-full max-w-7xl px-6 py-4 ${poppins.className}`}

      >
        {/* Left: Logo */}
        <div className="justify-self-start">
          <a href="#" className="-m-1.5 p-1.5">
            <h2 className="font-cal font-bold text-xl">thoughts</h2>
          </a>
        </div>
        {/* Center: Nav links */}
        <div className="flex justify-center items-center space-x-4">
  <motion.a
    href="#what-is-thoughts"
    whileHover={{ scale: 1.2 }}
    whileTap={{ scale: 0.8 }}
    className="text-sm font-normal text-gray-800"
  >
    What is <span className='italic'>Thoughts?</span>
  </motion.a>
  <motion.a
    href="#why-only-texts"
    whileHover={{ scale: 1.2 }}
    whileTap={{ scale: 0.8 }}
    className="text-sm font-normal text-gray-800"
  >
    Why only text?
  </motion.a>
  <motion.a
    href="#how-it-works"
    whileHover={{ scale: 1.2 }}
    whileTap={{ scale: 0.8 }}
    className="text-sm font-normal text-gray-800"
  >
    How it works?
  </motion.a>
</div>


        {/* Right: Log in */}
        <div className="justify-self-end">
          <Link href="/authentication/login" className="text-sm/6 font-semibold text-gray-900">
            Log in <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </nav>
      <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="sm:hidden">
        <div className="fixed inset-0 z-10" />
        <DialogPanel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <a href="#" className="-m-1.5 p-1.5">
              <h2 className='font-cal font-bold text-xl'>thoughts</h2>
            </a>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon aria-hidden="true" className="size-6" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
            <div className="space-y-2 py-6">
  <a
    href="#what-is-thoughts"
    onClick={() => setMobileMenuOpen(false)}
    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-normal text-gray-800 hover:bg-gray-50"
  >
    What is Thoughts?
  </a>
  <a
    href="#why-only-texts"
    onClick={() => setMobileMenuOpen(false)}
    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-normal text-gray-800 hover:bg-gray-50"
  >
    Why only texts?
  </a>
  <a
    href="#how-it-works"
    onClick={() => setMobileMenuOpen(false)}
    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-normal text-gray-800 hover:bg-gray-50"
  >
    How it works?
  </a>
</div>
<div className="py-6">
  <Link
    href="/authentication/login"
    onClick={() => setMobileMenuOpen(false)}
    className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
  >
    Log in
  </Link>
</div>

            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  )
}
