import { useNavigate } from 'react-router-dom';

export default function MainText() {
  const navigate = useNavigate();
  return (
    <div className="bg-gradient-to-b from-white via-blue-50/30 to-white">
      <div className="relative isolate px-4 pt-16 sm:px-6 lg:px-8">
        {/* Enhanced gradient background for mobile */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-20 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        >
          <div
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
            className="relative left-[calc(50%-8rem)] aspect-[1155/678] w-[28rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#3b82f6] via-[#60a5fa] to-[#2563eb] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] sm:opacity-20"
          />
        </div>

        {/* Secondary mobile gradient blob */}
        <div
          aria-hidden="true"
          className="absolute right-0 top-32 -z-10 transform-gpu overflow-hidden blur-3xl sm:hidden"
        >
          <div className="aspect-square w-48 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 opacity-20" />
        </div>

        <div className="mx-auto max-w-4xl py-8 px-2 sm:py-16 md:py-24 lg:py-32">
          <div className="text-center">
            {/* Badge - enhanced for mobile */}

            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.1]">
              Transform How You
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 pb-1">
                Reserve Event Spaces
              </span>
            </h1>

            <p className="mt-6 text-base leading-7 text-gray-600 sm:mt-6 sm:text-lg sm:leading-8 lg:text-xl lg:leading-9 max-w-3xl mx-auto px-2">
              Whether you're organizing business meetings, celebrations, or company parties,
              find and reserve the perfect restaurant venue effortlessly.
            </p>

            {/* Dual CTA Buttons - improved mobile touch targets */}
            <div className="mt-10 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-4 px-2">
              <a
                href="#"
                className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 px-8 py-4 sm:px-8 sm:py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                Find Event Venues
              </a>
              <button
                onClick={() => navigate('/discover')}
                className="w-full sm:w-auto rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-8 py-4 sm:px-8 sm:py-3 text-base font-semibold text-gray-900 shadow-sm hover:bg-white hover:border-gray-300 transition-all duration-300 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
              >
                List Your Restaurant
              </button>
            </div>

            {/* Trust indicators - pill-style badges on mobile */}
            <div className="mt-12 sm:mt-12 text-center">
              <p className="text-xs sm:text-sm text-gray-500 mb-4 px-4">
                Trusted by event organizers and restaurants
              </p>
              <div className="flex justify-center items-center gap-3 sm:gap-6 lg:gap-8 overflow-x-auto pb-2 px-4 sm:overflow-visible">
                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border border-gray-100 whitespace-nowrap">
                  <span className="text-lg sm:text-2xl">🏢</span>
                  <span className="text-sm font-semibold text-gray-700">500+ Venues</span>
                </div>
                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border border-gray-100 whitespace-nowrap">
                  <span className="text-lg sm:text-2xl">🎪</span>
                  <span className="text-sm font-semibold text-gray-700">10K+ Events</span>
                </div>
                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border border-gray-100 whitespace-nowrap">
                  <span className="text-lg sm:text-2xl">⭐</span>
                  <span className="text-sm font-semibold text-gray-700">4.9/5 Rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 lg:pb-24">
          <div className="mx-auto max-w-2xl lg:text-center mb-12 sm:mb-16">
            <h2 className="text-sm sm:text-base font-semibold leading-7 text-blue-600">Everything you need</h2>
            <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
              Streamlined venue booking for every occasion
            </p>
            <p className="mt-4 sm:mt-6 text-base leading-7 text-gray-600 sm:text-lg sm:leading-8 px-4">
              Our platform bridges the gap between event organizers and restaurants, 
              making venue reservation fast, efficient, and hassle-free.
            </p>
          </div>

          <div className="mx-auto max-w-2xl sm:max-w-none">
            <div className="grid max-w-xl grid-cols-1 gap-x-6 gap-y-8 sm:gap-x-8 sm:gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              {/* For Event Organizers */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl p-6 sm:p-8">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
For Restaurants                  For Event Organizers
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-200 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-medium text-gray-900">Advanced Search & Filtering</h4>
                      <p className="text-xs sm:text-sm text-gray-600">Find venues by capacity, cuisine, location, and amenities</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-200 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-medium text-gray-900">Instant Booking & Confirmation</h4>
                      <p className="text-xs sm:text-sm text-gray-600">Skip lengthy negotiations and book venues immediately</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-200 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-medium text-gray-900">Secure Online Payments</h4>
                      <p className="text-xs sm:text-sm text-gray-600">Handle deposits and payments securely through our platform</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* For Restaurants */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-6 sm:p-8">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
                  For Restaurants
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-medium text-gray-900">Maximize Space Utilization</h4>
                      <p className="text-xs sm:text-sm text-gray-600">Fill empty slots and increase revenue during off-peak hours</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-medium text-gray-900">Comprehensive Reservation Management</h4>
                      <p className="text-xs sm:text-sm text-gray-600">Track bookings, manage availability, and handle cancellations</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-medium text-gray-900">Direct Access to Event Market</h4>
                      <p className="text-xs sm:text-sm text-gray-600">Connect with corporate clients and event organizers easily</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        >
          <div
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#3b82f6] to-[#2563eb] opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
          />
        </div>
      </div>
    </div>
  );
}
