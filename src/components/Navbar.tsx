import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, Menu, X, Crown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { state: cartState } = useCart();
  const { state: wishlistState } = useWishlist();

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Crown className="h-8 w-8 text-gold-500" />
            <span className="font-serif text-2xl font-bold text-gray-900">
              Elegance
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-gray-700 hover:text-gold-600 transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              to="/catalog"
              className="text-gray-700 hover:text-gold-600 transition-colors duration-200"
            >
              Catalog
            </Link>
            <Link
              to="/wishlist"
              className="relative text-gray-700 hover:text-gold-600 transition-colors duration-200"
            >
              <Heart className="h-6 w-6" />
              {wishlistState.items.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-gold-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {wishlistState.items.length}
                </span>
              )}
            </Link>
            <Link
              to="/cart"
              className="relative text-gray-700 hover:text-gold-600 transition-colors duration-200"
            >
              <ShoppingBag className="h-6 w-6" />
              {cartState.items.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-gold-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartState.items.length}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-gold-600 transition-colors duration-200"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <Link
                to="/"
                className="block px-3 py-2 text-gray-700 hover:text-gold-600 transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/catalog"
                className="block px-3 py-2 text-gray-700 hover:text-gold-600 transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                Catalog
              </Link>
              <Link
                to="/wishlist"
                className="flex items-center px-3 py-2 text-gray-700 hover:text-gold-600 transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                <Heart className="h-5 w-5 mr-2" />
                Wishlist ({wishlistState.items.length})
              </Link>
              <Link
                to="/cart"
                className="flex items-center px-3 py-2 text-gray-700 hover:text-gold-600 transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                Cart ({cartState.items.length})
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;