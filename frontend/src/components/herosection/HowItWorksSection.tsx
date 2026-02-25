import React from 'react';
import { Link } from 'react-router-dom';

const HowItWorksSection: React.FC = () => {
  return (
    <div className="bg-gray-50 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-sm sm:text-base font-semibold leading-7 text-blue-600">Simple Process</h2>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
            How It Works
          </p>
          <p className="mt-4 sm:mt-6 text-base leading-7 text-gray-600 sm:text-lg sm:leading-8 px-4">
            From search to celebration - streamline your event venue booking in just a few simple steps
          </p>
        </div>

        <div className="mx-auto mt-12 sm:mt-16 lg:mt-20 xl:mt-24 max-w-2xl sm:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-6 gap-y-12 sm:gap-x-8 sm:gap-y-16 lg:max-w-none lg:grid-cols-3">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center px-4">
              <div className="mb-4 sm:mb-6 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <svg className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </div>
              <dt className="text-sm sm:text-base font-semibold leading-6 sm:leading-7 text-gray-900">
                1. Search & Filter
              </dt>
              <dd className="mt-3 sm:mt-4 flex flex-auto flex-col text-sm sm:text-base leading-6 sm:leading-7 text-gray-600">
                <p className="flex-auto">
                  Browse through our extensive database of restaurants and venues. 
                  Use advanced filters to find spaces that match your event requirements 
                  - capacity, location, cuisine type, amenities, and more.
                </p>
              </dd>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center px-4">
              <div className="mb-4 sm:mb-6 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <svg className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5" />
                </svg>
              </div>
              <dt className="text-sm sm:text-base font-semibold leading-6 sm:leading-7 text-gray-900">
                2. Book Instantly
              </dt>
              <dd className="mt-3 sm:mt-4 flex flex-auto flex-col text-sm sm:text-base leading-6 sm:leading-7 text-gray-600">
                <p className="flex-auto">
                  Select your preferred venue and time slot. Our real-time availability 
                  system ensures accurate booking information. Complete your reservation 
                  with secure online payment processing.
                </p>
              </dd>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center px-4">
              <div className="mb-4 sm:mb-6 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <svg className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <dt className="text-sm sm:text-base font-semibold leading-6 sm:leading-7 text-gray-900">
                3. Enjoy Your Event
              </dt>
              <dd className="mt-3 sm:mt-4 flex flex-auto flex-col text-sm sm:text-base leading-6 sm:leading-7 text-gray-600">
                <p className="flex-auto">
                  Receive instant confirmation and manage your booking through our platform. 
                  Coordinate with the restaurant for any special requirements and enjoy 
                  a seamless event experience.
                </p>
              </dd>
            </div>
          </dl>
        </div>

        {/* Call to Action */}
        <div className="mt-12 sm:mt-16 text-center px-4">
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
            Ready to transform how you book event spaces?
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
            <Link
              to="/discover"
              className="w-full sm:w-auto rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 sm:px-8 text-sm sm:text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              Start Booking Events
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto rounded-lg border-2 border-blue-500 bg-white px-6 py-3 sm:px-8 text-sm sm:text-base font-semibold text-blue-600 hover:bg-blue-50 transition-colors duration-200"
            >
              Join as Restaurant Partner
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksSection;
