export default function WordDefinition() {
    return (
        <div className="max-w-2xl lg:ml-20 mx-auto p-6 md:p-8">
          <h1 className="text-4xl font-bold mb-2">writhete</h1>
          <p className="text-gray-500 mb-6">wri·thet · adjective</p>
    
          <p className="text-lg mb-8">
          An individual who pursues writing with discipline and passion, integrating creativity, research, and mindfulness to produce impactful, thoughtful content while maintaining a balanced lifestyle.
          </p>
    
          <div className="mb-8">
  <p className="text-gray-600 mb-4">Similar:</p>
  <div className="flex flex-wrap gap-2 mb-4">
    {[
      "student",
      "blogger",
      "journalist",
      "teacher",
      "novelist",
      "content creator",
    ].map((label) => (
      <button
        key={label}
        className="px-3 py-1 border border-gray-200 rounded-md text-gray-600 hover:bg-gray-800 hover:text-white transition-all duration-300"
      >
        {label}
      </button>
    ))}
  </div>
  <div className="flex flex-wrap gap-2">
    {[
      "researcher",
      "screenwriter",
      "copywriter",
      "editor",
      "marketer",
    ].map((label) => (
      <button
        key={label}
        className="px-3 py-1 border border-gray-200 rounded-md text-gray-600 hover:bg-gray-800 hover:text-white transition-all duration-300"
      >
        {label}
      </button>
    ))}
  </div>
</div>

        </div>
      )
    }