export default function Footer() {
    return(
        <>
        

<footer className="bg-white rounded-lg shadow-sm m-4">
    <div className="w-full max-w-screen-xl mx-auto p-4 md:py-8">
        <div className="sm:flex sm:items-center sm:justify-between">
            <a href="https://flowbite.com/" className="flex items-center mb-4 sm:mb-0 space-x-3 rtl:space-x-reverse">
            <h2 className='font-cal font-bold text-xl'>thoughts</h2>
            </a>
            <ul className="flex flex-wrap items-center mb-6 text-sm font-medium text-gray-500 sm:mb-0 dark:text-gray-800">
                <li>
                    <a href="#" className="hover:underline lg:mx-2 me-4 md:me-6">What is Thoughts?</a>
                </li>
                <li>
                    <a href="#" className="hover:underline lg:mx-2 me-4 md:me-6">Why only text?</a>
                </li>
                <li>
                    <a href="#" className="hover:underline lg:mx-2 me-4 md:me-6">How it works?</a>
                </li>
                <li>
                    <a href="#" className="hover:underline">Log in</a>
                </li>
            </ul>
        </div>
        <hr className="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
        <span className="block text-sm text-gray-500 sm:text-center dark:text-gray-400">© 2023 <a href="" className="hover:underline">thoughts™</a>. All Rights Reserved.</span>
    </div>
</footer>
        </>
    )
}