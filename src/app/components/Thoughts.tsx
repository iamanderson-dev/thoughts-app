import Image from "next/image"
import Link from "next/link"



export default function Thoughts() {
  return (
    <div className="bg-[#f9f6f2] min-h-screen">
      {/* Section 1: Find the right donors */}
      <section id="what-is-thoughts"  className="py-12 md:py-16 lg:py-20 px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 lg:gap-16">
          {/* Left side with image and notification */}
          <div className="relative w-full md:w-1/2 lg:w-5/12">
            <div className="rounded-3xl overflow-hidden">
              <Image
                src="/images/medium-shot-man-with-backpack.jpg"
                alt=""
                width={400}
                height={20}
                className="w-full h-auto"
              />
            </div>

            {/* Notification box */}
            <div className="absolute top-4 md:top-8 right-0 md:-right-12 bg-white p-4 rounded-lg shadow-md max-w-[250px]">
              <div className="flex justify-between items-start">
                <div className="text-dark text-xs font-medium">PROFILE ALERT</div>
                <div className="bg-[#DB9B78FF] rounded-full p-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#000000"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-bell"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-medium mt-2">Rachel Lyons:</h3>
              <p className="text-lg font-medium">You have one new follower!</p>
              <Link href="#" className="text-sm text-dark mt-3 inline-flex items-center">
                View Details
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-1"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right side with text */}
          <div className="w-full md:w-1/2 lg:w-7/12 mt-12 md:mt-0">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium mb-6 leading-tight">
            What is Thoughts?
            </h2>
            <p className="text-lg md:text-xl text-gray-800 leading-relaxed">
            Thoughts is a space to share meaningful ideas and connect through reflection. Post your thoughts, follow others, and see what resonates—all without the noise.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Grow giving year after year */}
      <section id="why-only-texts" className="py-12 md:py-16 lg:py-20 px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start gap-8 md:gap-12 lg:gap-16">
          {/* Left side with profile card and image */}
          <div className="w-full md:w-1/2 lg:w-5/12">
          

            {/* Image with notification */}
            <div className="relative">
              <div className="rounded-3xl overflow-hidden">
                <Image
                  src="/images/Quote.png"
                  alt=""
                  width={500}
                  height={400}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>

          {/* Right side with text */}
          <div className="w-full md:w-1/2 lg:w-7/12 mt-12 md:mt-0">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium mb-6 leading-tight">
            Why only text?
            </h2>
            <p className="text-lg md:text-xl text-gray-800 leading-relaxed">
            Because words matter. Text keeps things clear, personal, and distraction-free—helping you connect deeply and intentionally, one thought at a time.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Build genuine relationships */}
      <section id="how-it-works" className="py-12 md:py-16 lg:py-20 px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row-reverse items-center gap-8 md:gap-12 lg:gap-16">
          {/* Right side with image and task card */}
          <div className="relative w-full md:w-1/2 lg:w-5/12">
            <div className="rounded-3xl overflow-hidden">
              <Image
                src="/images/Howitworks.png"
                alt=""
                width={500}
                height={600}
                className="w-full h-auto"
              />
            </div>

            {/* Task card */}
        
          </div>

          {/* Left side with text */}
          <div className="w-full md:w-1/2 lg:w-7/12 mt-12 md:mt-0">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium mb-6 leading-tight">
            How it works
            </h2>
            <p className="text-lg md:text-xl text-gray-800 leading-relaxed">
            Upload your thoughts — short, meaningful messages.

Follow others whose thoughts resonate with you.

Track impact by seeing who connects with your ideas.

Simple. Quiet. Intentional.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
