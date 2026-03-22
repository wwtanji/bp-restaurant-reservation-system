import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import NavbarComponent from '../section/NavbarComponent';
import {
  ADMIN_SIDEBAR_SECTIONS,
  STORAGE_KEY_ADMIN_SIDEBAR_COLLAPSED,
  AdminSidebarItem,
} from '../../constants/admin';

const getInitialCollapsed = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY_ADMIN_SIDEBAR_COLLAPSED) === 'true';
  } catch {
    return false;
  }
};

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_ADMIN_SIDEBAR_COLLAPSED, String(next));
      } catch {
        /* noop */
      }
      return next;
    });
  };

  const isActive = (href: string) => {
    if (href === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-ot-athens-gray dark:bg-dark-bg">
      <NavbarComponent />
      <div className="max-w-ot mx-auto px-4 py-8 lg:px-6">
        <div className="flex flex-col lg:flex-row gap-0">
          <MobileNav isActive={isActive} />

          <aside
            className={`hidden lg:flex flex-col shrink-0 border-r border-gray-200 dark:border-dark-border pr-6 mr-6 transition-[width] duration-200 ${
              collapsed ? 'w-[88px]' : 'w-60'
            }`}
          >
            <nav className="flex flex-col gap-6 flex-1">
              {ADMIN_SIDEBAR_SECTIONS.map((section) => (
                <div key={section.label}>
                  {!collapsed && (
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-dark-text-secondary mb-2 px-3">
                      {section.label}
                    </p>
                  )}
                  <div className="flex flex-col gap-1">
                    {section.items.map((item) => (
                      <DesktopNavItem
                        key={item.href}
                        item={item}
                        active={isActive(item.href)}
                        collapsed={collapsed}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="border-t border-gray-200 dark:border-dark-border pt-4 mt-auto">
              <button
                onClick={toggleCollapsed}
                className="flex items-center gap-2 w-full px-3 min-h-[44px] rounded-lg text-sm text-gray-500 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? (
                  <ChevronRightIcon className="w-5 h-5 shrink-0 mx-auto" />
                ) : (
                  <>
                    <ChevronLeftIcon className="w-5 h-5 shrink-0" />
                    <span>Collapse</span>
                  </>
                )}
              </button>
            </div>
          </aside>

          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
};

interface DesktopNavItemProps {
  item: AdminSidebarItem;
  active: boolean;
  collapsed: boolean;
}

const DesktopNavItem: React.FC<DesktopNavItemProps> = ({ item, active, collapsed }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      title={collapsed ? item.label : undefined}
      className={`relative flex items-center gap-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
        collapsed ? 'justify-center px-3' : 'px-3'
      } ${
        active
          ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
          : 'text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover'
      }`}
    >
      {active && (
        <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-indigo-500" />
      )}
      <Icon className="w-5 h-5 shrink-0" />
      {!collapsed && <span className="flex-1">{item.label}</span>}
    </Link>
  );
};

interface MobileNavProps {
  isActive: (href: string) => boolean;
}

const MobileNav: React.FC<MobileNavProps> = ({ isActive }) => {
  const allItems = ADMIN_SIDEBAR_SECTIONS.flatMap((s) => s.items);
  return (
    <nav className="flex lg:hidden gap-1 overflow-x-auto pb-4 mb-4 border-b border-gray-200 dark:border-dark-border">
      {allItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            to={item.href}
            className={`relative flex items-center gap-2 whitespace-nowrap px-4 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-hover'
            }`}
          >
            {active && (
              <span className="absolute bottom-0 left-3 right-3 h-[3px] rounded-t-full bg-indigo-500" />
            )}
            <Icon className="w-5 h-5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default AdminLayout;
