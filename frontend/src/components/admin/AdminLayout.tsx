import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import NavbarComponent from '../section/NavbarComponent';
import { ADMIN_SIDEBAR_ITEMS } from '../../constants/admin';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-ot-athens-gray dark:bg-dark-bg">
      <NavbarComponent />
      <div className="max-w-ot mx-auto px-4 py-8 lg:px-6">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 shrink-0">
            <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              {ADMIN_SIDEBAR_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`whitespace-nowrap px-4 py-2.5 rounded-ot-btn text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-ot-charade dark:bg-dark-primary text-white'
                      : 'text-ot-charade dark:text-dark-text hover:bg-white dark:hover:bg-dark-paper'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
