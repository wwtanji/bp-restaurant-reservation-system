import React, { useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import { Link, useNavigate } from "react-router-dom";
import NotificationComponent from "../notification/NotificationComponent";

const OWNER_ROLE = 1;

const NavbarComponent: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout: authLogout } = useAuth();
  const { show } = useNotification();
  const navigate = useNavigate();

  const navigation = [
    { name: "Search", href: "/search" },
    { name: "My Reservations", href: "/my-reservations" },
    ...(user?.role === OWNER_ROLE ? [{ name: "Dashboard", href: "/dashboard" }] : []),
    { name: "Profile", href: "/profile" },
  ];

  const handleLogout = () => {
    authLogout();
    localStorage.removeItem("justLoggedIn");
    show("You have successfully logged out", "error");
    navigate("/");
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  return (
    <>
      <NotificationComponent />
      <header className="bg-white border-b border-ot-iron">
        <nav
          aria-label="Global"
          className="max-w-ot mx-auto flex items-center justify-between px-4 py-3 lg:px-6"
        >
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-1">
              <span className="sr-only">Reservelt</span>
              <span className="text-xl font-extrabold text-ot-primary tracking-tight">
                Reservelt
              </span>
            </Link>
            <div className="hidden lg:flex items-center gap-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-sm font-medium text-ot-charade hover:text-ot-primary transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-ot-charade"
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="size-6" />
            </button>
          </div>

          <div className="hidden lg:flex lg:items-center lg:gap-4">
            {!user ? (
              <>
                <button
                  onClick={handleLoginClick}
                  className="text-sm font-medium text-ot-charade hover:text-ot-primary transition-colors"
                >
                  Sign in
                </button>
                <Link
                  to="/signup"
                  className="text-sm font-bold text-white bg-ot-charade hover:bg-ot-primary-dark px-4 py-2 rounded-ot-btn transition-colors"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-ot-charade hover:text-ot-primary transition-colors"
              >
                Sign out
              </button>
            )}
          </div>
        </nav>

        <Dialog
          open={mobileMenuOpen}
          onClose={setMobileMenuOpen}
          className="lg:hidden"
        >
          <div className="fixed inset-0 z-50" />
          <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white p-6 sm:max-w-sm sm:border-l sm:border-ot-iron">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-1">
                <span className="sr-only">Reservelt</span>
                <span className="text-xl font-extrabold text-ot-primary tracking-tight">
                  Reservelt
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="-m-2.5 rounded-md p-2.5 text-ot-charade"
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon aria-hidden="true" className="size-6" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-ot-iron">
                <div className="space-y-1 py-6">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-ot-btn px-3 py-2.5 text-sm font-medium text-ot-charade hover:bg-ot-athens-gray transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
                <div className="py-6 space-y-2">
                  {!user ? (
                    <>
                      <button
                        onClick={() => { handleLoginClick(); setMobileMenuOpen(false); }}
                        className="block w-full text-left rounded-ot-btn px-3 py-2.5 text-sm font-medium text-ot-charade hover:bg-ot-athens-gray transition-colors"
                      >
                        Sign in
                      </button>
                      <Link
                        to="/signup"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block text-center text-sm font-bold text-white bg-ot-charade hover:bg-ot-primary-dark px-4 py-2.5 rounded-ot-btn transition-colors"
                      >
                        Sign up
                      </Link>
                    </>
                  ) : (
                    <button
                      onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                      className="block w-full text-left rounded-ot-btn px-3 py-2.5 text-sm font-medium text-ot-charade hover:bg-ot-athens-gray transition-colors"
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
