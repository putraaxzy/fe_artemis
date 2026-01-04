/**
 * Header Component - Navigation header
 */

import React from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "./Button";
import { NotificationBell } from "./NotificationBell";
import { useAuth } from "../hooks/useAuth";
import {
  MdTask,
  MdAdd,
  MdMenu,
  MdClose,
  MdLogout,
  MdArrowUpward,
  MdSettings,
  MdExplore,
  MdPerson,
} from "react-icons/md";
import { FaUser } from "react-icons/fa";

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [showScrollTop, setShowScrollTop] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <header className="bg-white/80 backdrop-blur-xl border-b border-zinc-200/50 fixed top-0 left-0 right-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 max-w-7xl mx-auto">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 group flex-shrink-0"
            >
              <img
                src="/batik.png"
                alt="Artemis SMEA"
                className="h-9 sm:h-10 w-auto object-contain transform group-hover:scale-105 transition-transform"
              />
            </Link>

            {/* Right Side - Nav + User */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Desktop Navigation */}
              {isAuthenticated && (
                <nav className="hidden md:flex items-center gap-1">
                  <Link
                    to="/dashboard"
                    className="px-3 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all font-medium flex items-center gap-2 text-sm"
                  >
                    <MdTask className="w-4 h-4" />
                    <span>Tasks</span>
                  </Link>
                  {user?.role === "guru" && (
                    <Link
                      to="/create-task"
                      className="px-3 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all font-medium flex items-center gap-2 text-sm"
                    >
                      <MdAdd className="w-4 h-4" />
                      <span>Create Task</span>
                    </Link>
                  )}
                  <Link
                    to="/explore"
                    className="px-3 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all font-medium flex items-center gap-2 text-sm"
                  >
                    <MdExplore className="w-4 h-4" />
                    <span>Explore</span>
                  </Link>
                  <Link
                    to={`/profile/${user?.username}`}
                    className="px-3 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all font-medium flex items-center gap-2 text-sm"
                  >
                    <MdPerson className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="px-3 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all font-medium flex items-center gap-2 text-sm"
                  >
                    <MdSettings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                </nav>
              )}

              {/* Divider - Desktop Only */}
              {isAuthenticated && (
                <div className="hidden md:block w-px h-6 bg-zinc-200" />
              )}

              {/* Notification Bell - Desktop */}
              {isAuthenticated && (
                <div className="hidden md:flex">
                  <NotificationBell />
                </div>
              )}

              {/* User Menu */}
              {isAuthenticated && user ? (
                <>
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm">
                    <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center">
                      <FaUser className="w-3 h-3 text-zinc-600" />
                    </div>
                    <div className="hidden lg:block">
                      <p className="font-medium text-zinc-900 text-sm leading-tight">
                        {user.name}
                      </p>
                      <p className="text-xs text-zinc-500 capitalize leading-tight">
                        {user.role}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="hidden md:inline-flex hover:bg-red-50 hover:text-red-600 text-sm px-3"
                  >
                    <MdLogout className="w-4 h-4" />
                    <span className="hidden lg:inline ml-1">Logout</span>
                  </Button>

                  {/* Mobile Notification Bell */}
                  <div className="md:hidden">
                    <NotificationBell />
                  </div>

                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 rounded-lg hover:bg-zinc-100 transition-colors"
                  >
                    <MdMenu className="w-5 h-5 text-zinc-900" />
                  </button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => navigate("/login")}
                  className="text-sm bg-zinc-900 hover:bg-zinc-800"
                >
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Slide Menu */}
      {mobileMenuOpen && isAuthenticated && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide Panel */}
          <div className="fixed top-0 left-0 h-full w-72 max-w-[80vw] bg-white shadow-2xl z-[70] md:hidden animate-slide-in-left flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-100">
              <Link 
                to="/" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center"
              >
                <img
                  src="/batik.png"
                  alt="Artemis"
                  className="h-8 w-auto"
                />
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 -mr-2 rounded-full hover:bg-zinc-100 transition-colors"
              >
                <MdClose className="w-5 h-5 text-zinc-600" />
              </button>
            </div>

            {/* User Profile Card */}
            <div className="p-4 border-b border-zinc-100">
              <Link
                to={`/profile/${user?.username}`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-zinc-50 to-zinc-100/50 rounded-xl hover:from-zinc-100 hover:to-zinc-100 transition-all"
              >
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 flex items-center justify-center shadow-inner">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <FaUser className="w-5 h-5 text-zinc-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900 truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-zinc-500 capitalize flex items-center gap-1">
                    <MdPerson className="w-3 h-3" />
                    {user?.role === "guru" ? "Guru" : "Siswa"}
                  </p>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              <p className="px-3 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Menu
              </p>
              
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-zinc-700 hover:bg-zinc-100 rounded-xl transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <MdTask className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium">Tasks</span>
              </Link>
              
              {user?.role === "guru" && (
                <Link
                  to="/create-task"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-zinc-700 hover:bg-zinc-100 rounded-xl transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                    <MdAdd className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="font-medium">Create Task</span>
                </Link>
              )}

              <Link
                to="/explore"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-zinc-700 hover:bg-zinc-100 rounded-xl transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                  <MdExplore className="w-5 h-5 text-purple-600" />
                </div>
                <span className="font-medium">Explore</span>
              </Link>

              <div className="pt-3 mt-3 border-t border-zinc-100">
                <p className="px-3 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Account
                </p>
              </div>

              <Link
                to={`/profile/${user?.username}`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-zinc-700 hover:bg-zinc-100 rounded-xl transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                  <MdPerson className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="font-medium">Profile</span>
              </Link>

              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-zinc-700 hover:bg-zinc-100 rounded-xl transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center group-hover:bg-zinc-200 transition-colors">
                  <MdSettings className="w-5 h-5 text-zinc-600" />
                </div>
                <span className="font-medium">Settings</span>
              </Link>
            </nav>

            {/* Footer - Logout */}
            <div className="p-4 border-t border-zinc-100">
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <MdLogout className="w-5 h-5 text-red-500" />
                </div>
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 p-3 bg-zinc-900 text-white rounded-full shadow-lg hover:bg-zinc-800 hover:shadow-xl transition-all duration-300 transform z-40 ${
          showScrollTop
            ? "translate-y-0 opacity-100"
            : "translate-y-10 opacity-0 pointer-events-none"
        }`}
        aria-label="Scroll to top"
      >
        <MdArrowUpward className="w-6 h-6" />
      </button>
    </>
  );
}
