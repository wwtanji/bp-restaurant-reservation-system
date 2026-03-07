import React from 'react';
import womenCookImage from '../../assets/photos/women-cook.jpg';

const JoinComponent: React.FC = () => {
  return (
    <div
      className="relative min-h-[50vh] flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${womenCookImage})` }}
    >
      <div className="absolute inset-0 bg-ot-charade/75" />

      <div className="relative text-center text-white px-4 sm:px-6 max-w-3xl py-16">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight mb-4">
          Ready to Grow Your Restaurant?
        </h2>

        <p className="text-base sm:text-lg text-ot-iron mb-8 max-w-2xl mx-auto">
          Join hundreds of restaurants already filling their tables and reaching new guests through our platform.
        </p>

        <div className="grid grid-cols-3 gap-4 mb-8 max-w-md mx-auto">
          <div>
            <div className="text-2xl font-extrabold text-ot-red">+40%</div>
            <div className="text-xs text-ot-iron">Revenue</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-ot-red">24/7</div>
            <div className="text-xs text-ot-iron">Bookings</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-ot-red">Free</div>
            <div className="text-xs text-ot-iron">Setup</div>
          </div>
        </div>

        <button className="bg-ot-red hover:bg-ot-red-dark text-white font-bold text-sm px-8 py-3 rounded-ot-btn transition-colors">
          Join as Restaurant Partner
        </button>
      </div>
    </div>
  );
};

export default JoinComponent;
