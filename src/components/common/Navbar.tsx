import React, { useState, useEffect, useRef } from 'react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate, onLogout }) => {
  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    onLogout();
  };

  const handleProfileClick = () => {
    onNavigate('profile');
    setShowDropdown(false);
  };

  const handleSettingsClick = () => {
    onNavigate('settings');
    setShowDropdown(false);
  };

  const handleSetupClick = () => {
    onNavigate('setup');
    setShowDropdown(false);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setShowDropdown(false);
    }
    if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
      setShowMobileMenu(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'billing', label: 'New Bill', icon: '🧾' },
    { id: 'returns', label: 'Returns', icon: '🔄' },
    { id: 'products', label: 'Products', icon: '📦' },
    { id: 'bills', label: 'Bills History', icon: '📋' },
    { id: 'reports', label: 'Reports', icon: '📈' },
  ];

  // Add user management for admins
  if (user?.role === 'ADMIN') {
    navItems.push({ id: 'users', label: 'User Management', icon: '👥' });
  }

  return (
    <nav className="bg-blue-600 text-white">
      <div className="flex justify-between items-center px-4 py-2">
        {/* Logo/Brand */}
        <div className="flex items-center">
          <span className="text-xl font-bold">🛍️ Silk & Readymades</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition-colors rounded-md ${
                currentPage === item.id ? 'bg-blue-800' : ''
              }`}
            >
              <span className="mr-1">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* User Profile and Mobile Menu Toggle */}
        <div className="flex items-center space-x-4">
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-blue-600"
              >
                <span className="text-lg">👤</span>
              </button>
              {showDropdown && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                      <div className="font-medium">{user.fullName || user.username}</div>
                      <div className={`inline-block px-2 py-1 rounded text-xs font-semibold mt-1 ${
                        user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                        user.role === 'MANAGER' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </div>
                    </div>
                    <button
                      onClick={handleProfileClick}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                      role="menuitem"
                    >
                      Profile
                    </button>
                    <button
                      onClick={handleSettingsClick}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                      role="menuitem"
                    >
                      Printer Settings
                    </button>
                    <button
                      onClick={handleSetupClick}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                      role="menuitem"
                    >
                      Setup
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                      role="menuitem"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-blue-600"
          >
            <span className="text-lg">☰</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div ref={mobileMenuRef} className="md:hidden bg-blue-700 px-4 py-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setShowMobileMenu(false);
              }}
              className={`block w-full text-left px-4 py-3 text-sm font-semibold hover:bg-blue-600 transition-colors ${
                currentPage === item.id ? 'bg-blue-800' : ''
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;