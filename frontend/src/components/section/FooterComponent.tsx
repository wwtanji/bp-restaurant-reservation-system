import React from 'react';
import { Link } from 'react-router-dom';

const FooterComponent: React.FC = () => {
  return (
    <footer className="bg-ot-charade text-ot-iron py-12 px-4 md:px-8">
      <div className="max-w-ot mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between gap-8">
          <div>
            <h2 className="text-sm font-bold mb-4 tracking-wider uppercase text-white">Legal</h2>
            <ul className="space-y-3 text-sm">
              <li><button type="button" className="hover:text-white transition-colors">Imprint</button></li>
              <li><button type="button" className="hover:text-white transition-colors">Privacy Policy</button></li>
              <li><button type="button" className="hover:text-white transition-colors">Terms & Conditions</button></li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-bold mb-4 tracking-wider uppercase text-white">Discover</h2>
            <ul className="space-y-3 text-sm">
              <li><Link to="/search" className="hover:text-white transition-colors">Find Restaurants</Link></li>
              <li><Link to="/my-reservations" className="hover:text-white transition-colors">My Reservations</Link></li>
            </ul>
          </div>

          <div className="text-left md:text-right">
            <span className="text-2xl font-extrabold text-ot-primary tracking-tight">Reservelt</span>
            <p className="text-xs text-ot-manatee mt-2">&copy;2025 Reservelt. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterComponent;
