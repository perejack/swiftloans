import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UserProfile from './UserProfile';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const { user, setShowAuthModal, logout } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleApplyNow = () => {
    if (user) {
      navigate('/apply');
    } else {
      setShowAuthModal(true);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserProfile(false);
      setIsOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <>
      <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-green-600">Swift Loan</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-700 hover:text-green-600">Home</Link>
              {user && (
                <Link to="/account" className="text-gray-700 hover:text-green-600">Account</Link>
              )}
              <Link to="/about" className="text-gray-700 hover:text-green-600">About</Link>
              <Link to="/contact" className="text-gray-700 hover:text-green-600">Contact</Link>
              <motion.button
                onClick={handleApplyNow}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Apply Now
              </motion.button>
              {user && (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowUserProfile(true)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <User className="w-6 h-6 text-green-600" />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-red-500"
                  >
                    <LogOut className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden text-gray-700 hover:text-green-600 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-white shadow-lg"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              <Link
                to="/"
                className="block text-gray-700 hover:text-green-600"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              {user && (
                <Link
                  to="/account"
                  className="block text-gray-700 hover:text-green-600"
                  onClick={() => setIsOpen(false)}
                >
                  Account
                </Link>
              )}
              <Link
                to="/about"
                className="block text-gray-700 hover:text-green-600"
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>
              <Link
                to="/contact"
                className="block text-gray-700 hover:text-green-600"
                onClick={() => setIsOpen(false)}
              >
                Contact
              </Link>
              <button
                onClick={() => {
                  handleApplyNow();
                  setIsOpen(false);
                }}
                className="w-full bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Apply Now
              </button>
              {user && (
                <div className="flex items-center space-x-4 pt-2 border-t">
                  <button
                    onClick={() => {
                      setShowUserProfile(true);
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 text-gray-700 hover:text-green-600"
                  >
                    <User className="w-5 h-5" />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 text-gray-700 hover:text-red-500"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </nav>

      <UserProfile isOpen={showUserProfile} onClose={() => setShowUserProfile(false)} />
    </>
  );
};

export default Navbar;