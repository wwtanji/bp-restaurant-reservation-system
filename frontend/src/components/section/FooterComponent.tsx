import React from 'react';

const FooterComponent: React.FC = () => {
  return (
    <footer className="bg-[#1F2530] text-white py-16 px-6 md:px-12 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col items-start md:flex-row md:justify-between">
        <div>
          <h2 className="text-sm font-bold mb-6 tracking-widest uppercase">Legal</h2>
          <ul className="space-y-4 text-base text-gray-300">
            <li><button type="button" className="hover:underline">Imprint</button></li>
            <li className="flex items-center gap-1">
              <button type="button" className="hover:underline">Privacy Policy</button>
              <svg className="w-4 h-4 mt-[1px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </li>
            <li><button type="button" className="hover:underline">Terms & Conditions</button></li>
          </ul>
        </div>

        <div className="w-full text-center mt-16 md:mt-0 md:w-auto md:text-right">
          <h1 className="text-4xl font-bold tracking-wide text-white font-sans">Reservelt</h1>
          <p className="text-sm text-gray-400 mt-3">©2025 Reservelt GmbH. All rights reserved</p>
        </div>
      </div>
    </footer>
  );
};

export default FooterComponent; 