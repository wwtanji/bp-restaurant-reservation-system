import React from 'react';
import { Link } from 'react-router-dom';

const STEPS = [
  {
    number: '1',
    title: 'Search & Filter',
    description:
      'Browse restaurants by cuisine, location, availability, and more. Find the perfect spot for any occasion.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
    ),
  },
  {
    number: '2',
    title: 'Book Instantly',
    description:
      'Select your date, time, and party size. Our real-time system confirms your reservation immediately.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5" />
      </svg>
    ),
  },
  {
    number: '3',
    title: 'Enjoy Your Meal',
    description:
      'Show up and enjoy. Manage your bookings, get reminders, and leave reviews — all from your account.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
];

const HowItWorksSection: React.FC = () => {
  return (
    <div className="bg-ot-athens-gray py-16 sm:py-20">
      <div className="max-w-ot mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ot-charade">
            How It Works
          </h2>
          <p className="mt-3 text-sm sm:text-base text-ot-pale-sky max-w-xl mx-auto">
            From search to celebration — book your table in three simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {STEPS.map(step => (
            <div key={step.number} className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-ot-red text-white flex items-center justify-center">
                {step.icon}
              </div>
              <h3 className="text-base font-bold text-ot-charade mb-2">
                {step.number}. {step.title}
              </h3>
              <p className="text-sm text-ot-pale-sky leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/search"
            className="inline-block bg-ot-red hover:bg-ot-red-dark text-white font-bold text-sm px-8 py-3 rounded-ot-btn transition-colors"
          >
            Start Booking
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksSection;
