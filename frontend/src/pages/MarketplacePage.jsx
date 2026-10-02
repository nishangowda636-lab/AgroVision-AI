import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ExternalLink,
  ShieldCheck,
  Building2,
  Sparkles,
  Info,
  Filter,
  X,
  RefreshCw,
  Layers,
  Sprout,
  Tractor,
  Wrench,
  Droplets,
  FlaskConical,
  ShieldAlert,
  Wind,
  Hammer,
  Cpu,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import api from '../services/api';

// Icon mapping for categories
const CATEGORY_ICONS = {
  'Seeds': Sprout,
  'Tractors': Tractor,
  'Farm Machinery': Wrench,
  'Irrigation & Pumps': Droplets,
  'Fertilizers': FlaskConical,
  'Fertilizers & Soil Products': FlaskConical,
  'Pesticides / Crop Protection': ShieldAlert,
  'Crop Protection': ShieldAlert,
  'Sprayers': Wind,
  'Farm Tools': Hammer,
  'Animal Husbandry': Layers,
  'IoT / Smart Farming Equipment': Cpu,
};

// Robust Product Image Component that enforces authentic images with zero stock fallback
function ProductImageContainer({ src, alt, isVerified, className = '', containerClassName = '' }) {
  const [imageError, setImageError] = useState(false);

  // If no URL, not verified, or image error triggered -> strictly display "Product image unavailable"
  if (!src || !isVerified || imageError) {
    return (
      <div className={`w-full h-full bg-[#06100C] flex flex-col items-center justify-center text-center p-4 select-none ${containerClassName}`}>
        <div className="w-10 h-10 rounded-xl bg-[#0E1E18] text-[#8FA59B] border border-[#1B382D] flex items-center justify-center mb-2 shadow-inner">
          <ImageIcon className="w-5 h-5 text-[#8FA59B] opacity-80" />
        </div>
        <span className="text-xs font-semibold text-[#8FA59B]">Product image unavailable</span>
        <span className="text-[10px] text-[#577366] mt-0.5">Verified authentic asset pending</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setImageError(true)}
      loading="lazy"
    />
  );
}

export default function MarketplacePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch verified products and categories
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodsRes, catsRes] = await Promise.all([
        api.get('/marketplace/products'),
        api.get('/marketplace/categories')
      ]);

      setProducts(prodsRes.data.products || []);
      setCategories(catsRes.data || []);
      setBrands(prodsRes.data.brands || []);
    } catch (err) {
      console.error('Failed to load marketplace catalog:', err);
      setError('Unable to load verified product catalog. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // Category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      // Brand filter
      if (selectedBrand !== 'All' && item.brand !== selectedBrand) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = item.name?.toLowerCase().includes(query);
        const matchBrand = item.brand?.toLowerCase().includes(query);
        const matchDesc = item.description?.toLowerCase().includes(query);
        const matchCat = item.category?.toLowerCase().includes(query);
        if (!matchName && !matchBrand && !matchDesc && !matchCat) {
          return false;
        }
      }
      return true;
    });
  }, [products, selectedCategory, selectedBrand, searchQuery]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto selection:bg-[#10B981] selection:text-black">
      {/* 1. Header Section */}
      <div className="space-y-4 border-b border-[#1B382D] pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="os-status-pill os-status-emerald">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                Verified Agricultural Discovery
              </span>
              <span className="text-[11px] text-[#8FA59B] font-mono">
                Authentic Source Gateway
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span>AgroVision Marketplace</span>
            </h1>

            <p className="text-xs sm:text-sm text-[#8FA59B] mt-1.5 max-w-3xl">
              Discover authentic farming products directly from verified official manufacturers and authorized agricultural portals. Browse tractors, sprayers, crop protection, seeds, fertilizers, and tools with direct external links.
            </p>
          </div>

          {/* Quick Refresh */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="os-btn-secondary self-start md:self-center flex items-center gap-2 text-xs py-2 px-3.5 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Catalog</span>
          </button>
        </div>

        {/* Prominent Mandatory Safety & Non-Commerce Notice */}
        <div className="p-4 rounded-2xl bg-[#0B1B14] border border-[#10B981]/30 flex items-start gap-3.5 shadow-lg">
          <div className="p-2 rounded-xl bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#F3F7F5] text-sm">
                Official External Redirection Notice
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40">
                Non-Commerce
              </span>
            </div>
            <p className="text-[#8FA59B] leading-relaxed">
              AgroVision AI does not sell products, collect payment details, or intermediate transactions. You will be redirected directly to the manufacturer's or authorized retailer's verified page for purchase.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Controls: Search, Category Pills, & Filters */}
      <div className="space-y-4">
        {/* Search Bar & Brand Selector */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-[#8FA59B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search verified products, brands, or categories (e.g. Sonalika, Mahindra, Bayer, ASPEE, Tata Agrico)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="os-input pl-10 pr-10 text-xs w-full h-11"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8FA59B] hover:text-[#F3F7F5] p-1"
                aria-label="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Brand Filter */}
          <div className="md:col-span-4 relative">
            <div className="flex items-center gap-2">
              <div className="relative w-full">
                <Building2 className="w-4 h-4 text-[#8FA59B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="os-input pl-10 pr-8 text-xs w-full h-11 appearance-none cursor-pointer"
                >
                  <option value="All">All Verified Brands ({brands.length})</option>
                  {brands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <Filter className="w-3.5 h-3.5 text-[#8FA59B] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {(selectedCategory !== 'All' || selectedBrand !== 'All' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedBrand('All');
                    setSearchQuery('');
                  }}
                  title="Reset all filters"
                  className="p-2.5 rounded-xl bg-[#0E1E18] text-[#8FA59B] hover:text-[#EF4444] border border-[#1B382D] hover:border-[#EF4444]/40 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Horizontal Scrolling Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
              selectedCategory === 'All'
                ? 'bg-[#10B981] text-black border-[#10B981] shadow-md shadow-[#10B981]/20'
                : 'bg-[#0E1E18] text-[#8FA59B] border-[#1B382D] hover:text-[#F3F7F5] hover:border-[#10B981]/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Categories</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              selectedCategory === 'All' ? 'bg-black/20 text-black' : 'bg-[#1B382D] text-[#8FA59B]'
            }`}>
              {products.length}
            </span>
          </button>

          {categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.name] || Layers;
            const isSelected = selectedCategory === cat.name;

            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-[#10B981] text-black border-[#10B981] shadow-md shadow-[#10B981]/20'
                    : 'bg-[#0E1E18] text-[#8FA59B] border-[#1B382D] hover:text-[#F3F7F5] hover:border-[#10B981]/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isSelected ? 'bg-black/20 text-black' : 'bg-[#1B382D] text-[#8FA59B]'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Catalog Status & Count Bar */}
      <div className="flex items-center justify-between text-xs text-[#8FA59B] px-1">
        <div className="flex items-center gap-2">
          <span>Showing</span>
          <span className="font-bold text-[#F3F7F5] font-mono">{filteredProducts.length}</span>
          <span>verified product{filteredProducts.length === 1 ? '' : 's'}</span>
          {selectedCategory !== 'All' && (
            <span className="text-[#10B981] font-medium">• {selectedCategory}</span>
          )}
          {selectedBrand !== 'All' && (
            <span className="text-[#10B981] font-medium">• {selectedBrand}</span>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span>All redirect URLs verified & authentic</span>
        </div>
      </div>

      {/* 4. Products Grid */}
      {loading ? (
        <div className="p-20 text-center space-y-3 os-card">
          <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#8FA59B]">Loading verified agricultural products...</p>
        </div>
      ) : error ? (
        <div className="p-12 text-center space-y-3 os-card border-[#EF4444]/30">
          <AlertCircle className="w-8 h-8 text-[#EF4444] mx-auto" />
          <p className="text-sm text-[#F3F7F5] font-semibold">{error}</p>
          <button onClick={fetchData} className="os-btn-primary text-xs py-2 px-4">
            Retry
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-16 text-center space-y-4 os-card">
          <div className="w-12 h-12 rounded-2xl bg-[#0E1E18] text-[#8FA59B] border border-[#1B382D] flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#F3F7F5]">No matching verified products found</h3>
            <p className="text-xs text-[#8FA59B] max-w-md mx-auto">
              We couldn't find any official items matching your current filters. Try resetting search query or switching categories.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSelectedBrand('All');
              setSearchQuery('');
            }}
            className="os-btn-secondary text-xs"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => {
            const Icon = CATEGORY_ICONS[product.category] || Layers;
            // Validate: official_product_url exists AND url_verified = true
            const hasVerifiedBuyUrl = Boolean(
              product.official_product_url &&
              product.official_product_url.trim() &&
              product.url_verified
            );
            const isRetailer = Boolean(
              product.source_type === 'verified_retailer' ||
              product.source_name?.toLowerCase().includes('retail') ||
              product.source_name?.toLowerCase().includes('agribegri')
            );
            const cardBuyText = isRetailer ? 'Buy Retailer' : 'Buy Official';

            return (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="os-card-elevated flex flex-col justify-between overflow-hidden group hover:border-[#10B981]/50 transition-all"
              >
                <div>
                  {/* Product Image Banner */}
                  <div className="relative h-48 w-full bg-[#06100C] overflow-hidden border-b border-[#1B382D] flex items-center justify-center">
                    <ProductImageContainer
                      src={product.image_url}
                      alt={product.name}
                      isVerified={product.image_verified}
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Category Overlay Tag */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#08120E]/90 backdrop-blur-md border border-[#1B382D] text-[10px] font-bold text-[#F3F7F5]">
                      <Icon className="w-3 h-3 text-[#10B981]" />
                      <span>{product.category}</span>
                    </div>

                    {/* Verified Official Source Badge */}
                    {product.source_verified && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-[#10B981]/20 backdrop-blur-md border border-[#10B981]/40 text-[10px] font-bold text-[#10B981]">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified Source</span>
                      </div>
                    )}
                  </div>

                  {/* Product Content */}
                  <div className="p-4 sm:p-5 space-y-3">
                    {/* Brand & Provenance */}
                    <div className="flex items-center justify-between text-[11px] text-[#8FA59B]">
                      <div className="flex items-center gap-1.5 font-medium text-emerald-400">
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{product.brand}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#577366] bg-[#0E1E18] px-2 py-0.5 rounded border border-[#1B382D]">
                        ID #{product.id}
                      </span>
                    </div>

                    {/* Product Name */}
                    <h3 className="text-sm font-bold text-[#F3F7F5] font-heading line-clamp-2 min-h-[40px]">
                      {product.name}
                    </h3>

                    {/* Short Description */}
                    <p className="text-xs text-[#8FA59B] line-clamp-3 leading-relaxed">
                      {product.description || 'Verified agricultural inputs and farming equipment.'}
                    </p>

                    {/* Provenance Source Note */}
                    <div className="pt-2 border-t border-[#1B382D]/70 text-[10px] text-[#8FA59B] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-[#10B981] shrink-0" />
                      <span className="truncate">Source: {product.source_name}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 sm:p-5 pt-0 grid grid-cols-2 gap-2">
                  {/* View Details Button */}
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="os-btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5"
                  >
                    <span>View Details</span>
                  </button>

                  {/* Buy from Official Website / Retailer Button or Unavailable Notice */}
                  {hasVerifiedBuyUrl ? (
                    <a
                      href={product.official_product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="os-btn-primary text-xs py-2 px-2.5 flex items-center justify-center gap-1.5 bg-[#10B981] hover:bg-[#059669] text-black font-bold shadow-md shadow-[#10B981]/20 text-center transition-all"
                    >
                      <span className="truncate">{cardBuyText}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  ) : (
                    <div
                      title="Official product page could not be independently verified"
                      className="py-2 px-2 rounded-xl bg-[#0E1E18] border border-[#1B382D] text-[#8FA59B] text-[10px] font-medium flex items-center justify-center text-center cursor-not-allowed leading-tight"
                    >
                      Product page unavailable
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 5. Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="os-card-elevated max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar border-[#10B981]/40 shadow-2xl relative"
            >
              {/* Modal Header Bar */}
              <div className="p-5 border-b border-[#1B382D] flex items-center justify-between sticky top-0 bg-[#08120E]/95 backdrop-blur-md z-10">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="p-1.5 rounded-lg bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-[#10B981] tracking-wider uppercase font-mono block">
                      Verified Agricultural Discovery
                    </span>
                    <h2 className="text-base font-bold text-[#F3F7F5] truncate">
                      {selectedProduct.brand} • {selectedProduct.category}
                    </h2>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-2 rounded-xl bg-[#0E1E18] text-[#8FA59B] hover:text-[#F3F7F5] border border-[#1B382D] transition-colors"
                  aria-label="Close details"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 space-y-5">
                {/* Preview Image */}
                <div className="relative h-64 w-full rounded-2xl bg-[#06100C] overflow-hidden border border-[#1B382D] flex items-center justify-center">
                  <ProductImageContainer
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    isVerified={selectedProduct.image_verified}
                    className="w-full h-full object-contain p-4"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-[#08120E]/90 backdrop-blur-md border border-[#1B382D] text-xs font-bold text-[#F3F7F5]">
                    {selectedProduct.category}
                  </div>
                  {selectedProduct.source_verified && (
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-xl bg-[#10B981]/25 backdrop-blur-md border border-[#10B981]/50 text-xs font-bold text-[#10B981] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verified Source</span>
                    </div>
                  )}
                </div>

                {/* Product Title & Brand */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Brand / Manufacturer: {selectedProduct.brand}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#F3F7F5] font-heading">
                    {selectedProduct.name}
                  </h3>
                </div>

                {/* Description & Technical Specifications */}
                <div className="p-4 rounded-2xl bg-[#08120E] border border-[#1B382D] space-y-2 text-xs">
                  <span className="font-bold text-[#F3F7F5] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                    PRODUCT SPECIFICATIONS & OVERVIEW
                  </span>
                  <p className="text-[#8FA59B] leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                    {selectedProduct.description}
                  </p>
                </div>

                {/* Manufacturer Provenance & Verification Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#08120E] border border-[#1B382D] space-y-1">
                    <span className="text-[#8FA59B] text-[10px] uppercase font-bold">Catalog Provenance</span>
                    <p className="text-[#F3F7F5] font-semibold truncate">{selectedProduct.source_name}</p>
                    <span className="text-[10px] text-[#10B981] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Authenticity Verified
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#08120E] border border-[#1B382D] space-y-1">
                    <span className="text-[#8FA59B] text-[10px] uppercase font-bold">Official Portal</span>
                    {selectedProduct.official_brand_url ? (
                      <a
                        href={selectedProduct.official_brand_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#10B981] font-semibold hover:underline flex items-center gap-1 truncate"
                      >
                        <span className="truncate">{selectedProduct.official_brand_url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <p className="text-[#8FA59B]">Official portal</p>
                    )}
                    <span className="text-[10px] text-[#8FA59B]">Opens in new tab</span>
                  </div>
                </div>

                {/* Mandatory External Purchase Disclaimer */}
                <div className="p-3.5 rounded-xl bg-[#0B1B14] border border-[#10B981]/30 space-y-1 text-xs">
                  <span className="font-bold text-[#10B981] flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    EXTERNAL PURCHASE REDIRECTION
                  </span>
                  <p className="text-[#8FA59B] text-[11px] leading-relaxed">
                    AgroVision AI does not sell products, collect payment details, or intermediate transactions. You will be redirected directly to the verified portal for purchase.
                  </p>
                </div>

                {/* CTA Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  {selectedProduct.official_product_url && selectedProduct.url_verified ? (
                    <a
                      href={selectedProduct.official_product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="os-btn-primary w-full sm:flex-1 py-3 px-5 text-sm font-bold bg-[#10B981] hover:bg-[#059669] text-black shadow-lg shadow-[#10B981]/25 flex items-center justify-center gap-2 text-center transition-all"
                    >
                      <span>{(selectedProduct.source_type === 'verified_retailer' || selectedProduct.source_name?.toLowerCase().includes('retail')) ? 'Buy from Verified Retailer' : 'Buy from Official Website'}</span>
                      <ExternalLink className="w-4 h-4 shrink-0" />
                    </a>
                  ) : (
                    <div className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#0E1E18] border border-[#1B382D] text-[#8FA59B] text-xs font-semibold text-center cursor-not-allowed flex items-center justify-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Official product page unavailable</span>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="os-btn-secondary w-full sm:w-auto py-3 px-6 text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
