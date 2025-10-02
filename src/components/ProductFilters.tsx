import React from 'react';
import { Filter, X } from 'lucide-react';

interface FilterProps {
  categories: string[];
  tags: string[];
  selectedCategory: string;
  selectedTags: string[];
  priceRange: [number, number];
  onCategoryChange: (category: string) => void;
  onTagChange: (tag: string) => void;
  onPriceRangeChange: (range: [number, number]) => void;
  onClearFilters: () => void;
}

const ProductFilters: React.FC<FilterProps> = ({
  categories,
  tags,
  selectedCategory,
  selectedTags,
  priceRange,
  onCategoryChange,
  onTagChange,
  onPriceRangeChange,
  onClearFilters,
}) => {
  const priceRanges = [
    { label: 'All Prices', min: 0, max: 1000000 },
    { label: 'Under ₹10,000', min: 0, max: 10000 },
    { label: '₹10,000 - ₹25,000', min: 10000, max: 25000 },
    { label: '₹25,000 - ₹50,000', min: 25000, max: 50000 },
    { label: '₹50,000 - ₹1,00,000', min: 50000, max: 100000 },
    { label: 'Above ₹1,00,000', min: 100000, max: 1000000 },
  ];

  const hasActiveFilters = selectedCategory !== 'all' || selectedTags.length > 0 || 
    (priceRange[0] > 0 || priceRange[1] < 1000000);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Filter className="h-5 w-5 mr-2 text-gold-500" />
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-red-600 hover:text-red-700 flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Category</h4>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="category"
              value="all"
              checked={selectedCategory === 'all'}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="mr-2 text-gold-500 focus:ring-gold-500"
            />
            <span className="text-gray-700">All Categories</span>
          </label>
          {categories.map((category) => (
            <label key={category} className="flex items-center">
              <input
                type="radio"
                name="category"
                value={category}
                checked={selectedCategory === category}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="mr-2 text-gold-500 focus:ring-gold-500"
              />
              <span className="text-gray-700 capitalize">{category}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
        <div className="space-y-2">
          {priceRanges.map((range, index) => (
            <label key={index} className="flex items-center">
              <input
                type="radio"
                name="priceRange"
                checked={priceRange[0] === range.min && priceRange[1] === range.max}
                onChange={() => onPriceRangeChange([range.min, range.max])}
                className="mr-2 text-gold-500 focus:ring-gold-500"
              />
              <span className="text-gray-700">{range.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Tags</h4>
        <div className="space-y-2">
          {tags.map((tag) => (
            <label key={tag} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedTags.includes(tag)}
                onChange={() => onTagChange(tag)}
                className="mr-2 text-gold-500 focus:ring-gold-500"
              />
              <span className="text-gray-700 capitalize">{tag}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;