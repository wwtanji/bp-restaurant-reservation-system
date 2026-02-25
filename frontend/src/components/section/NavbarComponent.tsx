import React, { useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import { Link, useNavigate } from "react-router-dom";
import NotificationComponent from "../notification/NotificationComponent";

const navigation = [
  { name: "Product", href: "#" },
  { name: "Features", href: "#" },
  { name: "Marketplace", href: "#" },
  { name: "Company", href: "#" },
];

const NavbarComponent: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout: authLogout } = useAuth();
  const { show } = useNotification();
  const navigate = useNavigate();

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
      <header className="absolute inset-x-0 top-0 z-50">
        <nav
          aria-label="Global"
          className="flex items-center justify-between p-6 lg:px-8"
        >
          <div className="flex lg:flex-1">
            <Link to="/" className="-m-1.5 p-1.5 flex items-center gap-2">
              <span className="sr-only">Reservelt</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gray-900">
                  Reservelt
                </span>
              </div>
            </Link>
          </div>
          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="size-6" />
            </button>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            {navigation.map((item) => (
              <button
                key={item.name}
                type="button"
                className="text-base leading-6 font-semibold text-gray-900 relative group transition-colors duration-300 hover:text-blue-500"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
              </button>
            ))}
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            {!user ? (
              <button
                onClick={handleLoginClick}
                className="text-base leading-6 font-semibold text-gray-900"
              >
                Log in <span aria-hidden="true">&rarr;</span>
              </button>
            ) : (
              <button
                onClick={handleLogout}
                className="text-base leading-6 font-semibold text-gray-900"
              >
                Sign out <span aria-hidden="true">&rarr;</span>
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
          <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
              <Link to="/" className="-m-1.5 p-1.5 flex items-center gap-2">
                <span className="sr-only">Reservelt</span>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                    </svg>
                  </div>
                  <span className="text-xl font-bold text-gray-900">
                    Reservelt
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="-m-2.5 rounded-md p-2.5 text-gray-700"
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon aria-hidden="true" className="size-6" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      className="-mx-3 block w-full text-left rounded-lg px-3 py-2 text-base leading-7 font-semibold text-gray-900 hover:bg-blue-50 transition-all duration-300 hover:text-blue-500 hover:pl-4"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
                <div className="py-6">
                  {!user ? (
                    <button
                      onClick={handleLoginClick}
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base leading-7 font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      Log in
                    </button>
                  ) : (
                    <button
                      onClick={handleLogout}
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base leading-7 font-semibold text-gray-900 hover:bg-gray-50"
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
