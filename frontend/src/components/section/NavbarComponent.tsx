import React, { useState } from "react";
import { Dialog, DialogPanel, Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  CalendarIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import { useThemeMode } from "../../context/ThemeContext";
import { Link, useNavigate } from "react-router-dom";
import NotificationComponent from "../notification/NotificationComponent";
import { OWNER_ROLE } from "../../constants/dashboard";
import { STORAGE_KEY_JUST_LOGGED_IN } from "../../constants/storage";

const NavbarComponent: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout: authLogout } = useAuth();
  const { show } = useNotification();
  const { isDark, toggleTheme } = useThemeMode();
  const navigate = useNavigate();

  const navigation = [
    { name: "Search", href: "/search" },
    { name: "My Reservations", href: "/my-reservations" },
    ...(user?.role === OWNER_ROLE ? [{ name: "Dashboard", href: "/dashboard" }] : []),
  ];

  const handleLogout = () => {
    authLogout();
    localStorage.removeItem(STORAGE_KEY_JUST_LOGGED_IN);
    show("You have successfully logged out", "error");
    navigate("/");
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  const userInitials = user ? `${user.first_name[0]}${user.last_name[0]}` : "";

  const ThemeToggleButton = () => (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg text-ot-pale-sky hover:text-ot-charade dark:text-dark-text-secondary dark:hover:text-dark-text hover:bg-ot-athens-gray dark:hover:bg-dark-surface transition-colors"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <SunIcon className="size-5" />
      ) : (
        <MoonIcon className="size-5" />
      )}
    </button>
  );

  const AvatarCircle = ({ size = "w-9 h-9", textSize = "text-xs" }: { size?: string; textSize?: string }) => (
    <div className={`${size} rounded-full bg-gradient-to-br from-ot-primary to-ot-primary-dark flex items-center justify-center`}>
      <span className={`${textSize} font-bold text-white leading-none`}>{userInitials}</span>
    </div>
  );

  return (
    <>
      <NotificationComponent />
      <header className="bg-white dark:bg-dark-paper border-b border-ot-iron dark:border-dark-border">
        <nav
          aria-label="Global"
          className="max-w-ot mx-auto flex items-center justify-between px-4 py-3 lg:px-6"
        >
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-1">
              <span className="sr-only">Reservelt</span>
              <span className="text-xl font-extrabold text-ot-primary dark:text-dark-primary tracking-tight">
                Reservelt
              </span>
            </Link>
            <div className="hidden lg:flex items-center gap-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-sm font-medium text-ot-charade dark:text-dark-text hover:text-ot-primary dark:hover:text-dark-primary transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggleButton />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-ot-charade dark:text-dark-text"
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="size-6" />
            </button>
          </div>

          <div className="hidden lg:flex lg:items-center lg:gap-3">
            <ThemeToggleButton />
            {!user ? (
              <>
                <button
                  onClick={handleLoginClick}
                  className="text-sm font-medium text-ot-charade dark:text-dark-text hover:text-ot-primary dark:hover:text-dark-primary transition-colors"
                >
                  Sign in
                </button>
                <Link
                  to="/signup"
                  className="text-sm font-bold text-white bg-ot-charade dark:bg-dark-primary hover:bg-ot-primary-dark dark:hover:bg-dark-primary-dark px-4 py-2 rounded-ot-btn transition-colors"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile?section=reservations"
                  className="relative p-2 rounded-lg text-ot-pale-sky hover:text-ot-charade dark:text-dark-text-secondary dark:hover:text-dark-text hover:bg-ot-athens-gray dark:hover:bg-dark-surface transition-colors"
                >
                  <CalendarIcon className="size-5" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                </Link>
                <button
                  className="relative p-2 rounded-lg text-ot-pale-sky hover:text-ot-charade dark:text-dark-text-secondary dark:hover:text-dark-text hover:bg-ot-athens-gray dark:hover:bg-dark-surface transition-colors"
                >
                  <BellIcon className="size-5" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                </button>

                <Menu as="div" className="relative">
                  <MenuButton className="focus:outline-none cursor-pointer">
                    <AvatarCircle />
                  </MenuButton>
                  <MenuItems
                    transition
                    className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white dark:bg-dark-paper shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none z-50 transition duration-150 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
                  >
                    <div className="px-4 py-3 border-b border-ot-iron dark:border-dark-border">
                      <p className="text-sm font-semibold text-ot-charade dark:text-dark-text">
                        Hello, {user.first_name}!
                      </p>
                    </div>
                    <div className="py-1">
                      <MenuItem>
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-ot-charade dark:text-dark-text data-[focus]:bg-ot-athens-gray dark:data-[focus]:bg-dark-surface transition-colors"
                        >
                          My Profile
                        </Link>
                      </MenuItem>
                      <MenuItem>
                        <Link
                          to="/profile?section=reservations"
                          className="block px-4 py-2 text-sm text-ot-charade dark:text-dark-text data-[focus]:bg-ot-athens-gray dark:data-[focus]:bg-dark-surface transition-colors"
                        >
                          My Dining History
                        </Link>
                      </MenuItem>
                      <MenuItem>
                        <Link
                          to="/profile?section=saved"
                          className="block px-4 py-2 text-sm text-ot-charade dark:text-dark-text data-[focus]:bg-ot-athens-gray dark:data-[focus]:bg-dark-surface transition-colors"
                        >
                          My Saved Restaurants
                        </Link>
                      </MenuItem>
                      {user.role === OWNER_ROLE && (
                        <MenuItem>
                          <Link
                            to="/dashboard"
                            className="block px-4 py-2 text-sm text-ot-charade dark:text-dark-text data-[focus]:bg-ot-athens-gray dark:data-[focus]:bg-dark-surface transition-colors"
                          >
                            Dashboard
                          </Link>
                        </MenuItem>
                      )}
                    </div>
                    <div className="border-t border-ot-iron dark:border-dark-border py-1">
                      <MenuItem>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-500 data-[focus]:bg-ot-athens-gray dark:data-[focus]:bg-dark-surface transition-colors"
                        >
                          Sign out
                        </button>
                      </MenuItem>
                    </div>
                  </MenuItems>
                </Menu>
              </div>
            )}
          </div>
        </nav>

        <Dialog
          open={mobileMenuOpen}
          onClose={setMobileMenuOpen}
          className="lg:hidden"
        >
          <div className="fixed inset-0 z-50" />
          <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white dark:bg-dark-paper p-6 sm:max-w-sm sm:border-l sm:border-ot-iron dark:border-dark-border">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-1">
                <span className="sr-only">Reservelt</span>
                <span className="text-xl font-extrabold text-ot-primary dark:text-dark-primary tracking-tight">
                  Reservelt
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="-m-2.5 rounded-md p-2.5 text-ot-charade dark:text-dark-text"
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon aria-hidden="true" className="size-6" />
              </button>
            </div>

            {user && (
              <div className="mt-6 flex items-center gap-3 px-3">
                <AvatarCircle size="w-10 h-10" textSize="text-sm" />
                <p className="text-sm font-semibold text-ot-charade dark:text-dark-text">
                  Hello, {user.first_name}!
                </p>
              </div>
            )}

            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-ot-iron dark:divide-dark-border">
                <div className="space-y-1 py-6">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-ot-btn px-3 py-2.5 text-sm font-medium text-ot-charade dark:text-dark-text hover:bg-ot-athens-gray dark:hover:bg-dark-surface transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                  {user && (
                    <>
                      <Link
                        to="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block rounded-ot-btn px-3 py-2.5 text-sm font-medium text-ot-charade dark:text-dark-text hover:bg-ot-athens-gray dark:hover:bg-dark-surface transition-colors"
                      >
                        My Profile
                      </Link>
                      <Link
                        to="/profile?section=reservations"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block rounded-ot-btn px-3 py-2.5 text-sm font-medium text-ot-charade dark:text-dark-text hover:bg-ot-athens-gray dark:hover:bg-dark-surface transition-colors"
                      >
                        My Dining History
                      </Link>
                      <Link
                        to="/profile?section=saved"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block rounded-ot-btn px-3 py-2.5 text-sm font-medium text-ot-charade dark:text-dark-text hover:bg-ot-athens-gray dark:hover:bg-dark-surface transition-colors"
                      >
                        My Saved Restaurants
                      </Link>
                    </>
                  )}
                </div>
                <div className="py-6 space-y-2">
                  {!user ? (
                    <>
                      <button
                        onClick={() => { handleLoginClick(); setMobileMenuOpen(false); }}
                        className="block w-full text-left rounded-ot-btn px-3 py-2.5 text-sm font-medium text-ot-charade dark:text-dark-text hover:bg-ot-athens-gray dark:hover:bg-dark-surface transition-colors"
                      >
                        Sign in
                      </button>
                      <Link
                        to="/signup"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block text-center text-sm font-bold text-white bg-ot-charade dark:bg-dark-primary hover:bg-ot-primary-dark dark:hover:bg-dark-primary-dark px-4 py-2.5 rounded-ot-btn transition-colors"
                      >
                        Sign up
                      </Link>
                    </>
                  ) : (
                    <button
                      onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                      className="block w-full text-left rounded-ot-btn px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-ot-athens-gray dark:hover:bg-dark-surface transition-colors"
                    >
                      Sign out
                    </button>
                  )}
                </div>
              </div>
            </div>
          </DialogPanel>
        </Dialog>
      </header>
    </>
  );
};

export default NavbarComponent;
