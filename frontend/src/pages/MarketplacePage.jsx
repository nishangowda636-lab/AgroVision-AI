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
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Star,
  Tag,
  ArrowUpRight,
  Store,
  BadgeCheck,
  Scale,
  Calculator,
  ArrowRight,
  ChevronDown,
  Trash2,
  ArrowUpDown
} from 'lucide-react';
import api from '../services/api';

// Icon mapping for categories
const CATEGORY_ICONS = {
  'Sowing Seeds': Sprout,
  'Seeds': Sprout,
  'Fertilizers': FlaskConical,
  'Fertilizers & Soil Products': FlaskConical,
  'Farming Equipments': Wrench,
  'Farm Machinery': Wrench,
  'Tractors': Tractor,
  'Sprayers': Wind,
  'Irrigation & Pumps': Droplets,
  'Pesticides / Crop Protection': ShieldAlert,
  'Crop Protection': ShieldAlert,
  'Farm Tools': Hammer,
  'Animal Husbandry': Layers,
  'IoT / Smart Farming Equipment': Cpu,
};

// Preset data for the Interactive Farm Input & Equipment Estimator
const CROP_ESTIMATOR_DATA = {
  'Tomato': {
    name: 'Tomato (Commercial Hybrid)',
    seedRatePerAcre: '40 - 50 grams (approx. 14,000 - 17,000 seeds)',
    seedProductQuery: 'Tomato',
    fertilizerDose: '2x 500ml IFFCO Nano Urea + 2x 500ml Nano DAP + 4kg NPK 19-19-19 + 500g Micronutrients',
    recommendedEquipments: '16L Knapsack Battery Sprayer (ASPEE) + Drip Irrigation Screen Filter (Apras) + UV Solar Pest Trap',
    harvestTime: '60 - 65 days first picking',
    tips: 'Treat nursery seeds with Saaf fungicide. Apply foliar Nano Urea at 30 days after transplanting.'
  },
  'Chilli': {
    name: 'Hot Pepper / Chilli (Syngenta 7067)',
    seedRatePerAcre: '20 - 30 grams hybrid seeds (Nursery raised)',
    seedProductQuery: 'Chilli',
    fertilizerDose: '2x Nano Urea + 1kg Organic Humic Acid 98% + 1kg Seaweed Bio-stimulant',
    recommendedEquipments: 'ASPEE Knapsack Battery Sprayer + Aedaa Solar Light Pest Trap + Brush Cutter for clearing',
    harvestTime: '65 - 75 days to first green harvest',
    tips: 'Spray Neem Oil 10,000 PPM preventively every 15 days to manage Thrips and sucking pests.'
  },
  'Maize': {
    name: 'Hybrid Maize / Corn (Pioneer P3396)',
    seedRatePerAcre: '7 - 8 kg hybrid seeds (spaced at 60 cm x 20 cm)',
    seedProductQuery: 'Maize',
    fertilizerDose: '3x Nano Urea + 2x Nano DAP (Basal application) + 2kg Zinc / Micronutrient mix',
    recommendedEquipments: '39 HP Tractor (Sonalika / Mahindra) with Cultivator + Farmio Brush Cutter / Reaper',
    harvestTime: '105 - 115 days maturity',
    tips: 'Scout regularly for Fall Armyworm. Apply Coragen 18.5% SC (0.4 ml/L) at early whorl stage if detected.'
  },
  'Paddy': {
    name: 'Hybrid Paddy / Rice (Kaveri Chintu)',
    seedRatePerAcre: '6 - 7 kg hybrid seeds (or 12-15 kg for broadcast / SRI transplant)',
    seedProductQuery: 'Paddy',
    fertilizerDose: '2x Nano Urea + 2x Nano DAP + 1kg Potassium Humate + 500g Chelated Zinc EDTA',
    recommendedEquipments: 'KisanKraft KK-WPP-21 Centrifugal Petrol Water Pump + Farmio Brush Cutter + Chaff Cutter',
    harvestTime: '125 - 130 days maturity',
    tips: 'Maintain 2-3 cm shallow water level. Spray Bayer Nativo at panicle initiation to prevent blast & sheath blight.'
  },
  'Onion': {
    name: 'Red Onion (Nunhems Maxx)',
    seedRatePerAcre: '3 - 4 kg seeds per acre (Raised nursery beds)',
    seedProductQuery: 'Onion',
    fertilizerDose: '2x Nano DAP + 5kg Soluble NPK 19-19-19 + 1kg Seaweed extract powder for bulb sizing',
    recommendedEquipments: 'Drip Irrigation Y-Filter + ASPEE Battery Sprayer + Pad Corp Fast Charger',
    harvestTime: '120 - 130 days maturity',
    tips: 'Avoid excessive nitrogen in last 30 days before harvest to ensure 4-5 months bulb storage life.'
  },
  'Coffee': {
    name: 'Coffee (Arabica & Robusta Plantation)',
    seedRatePerAcre: '450 - 500 certified polybag nursery saplings per acre',
    seedProductQuery: 'Fertilizer',
    fertilizerDose: '3x IFFCO Nano Urea + 2x Nano DAP + 2kg Humic Acid + Chelated Micronutrients',
    recommendedEquipments: 'ASPEE Bolo MB2 Motorized Mist Blower + 16L Knapsack Sprayer + Brush Cutter for weeding',
    harvestTime: 'Berry ripening at 8 - 9 months post-blossom showers',
    tips: 'Ensure 30-40% filtered shade. Spray Bayer Nativo pre-monsoon to prevent coffee leaf rust (Hemileia vastatrix).'
  },
  'Pepper': {
    name: 'Black Pepper (Panniyur-1 / Karimunda Vines)',
    seedRatePerAcre: '400 - 500 rooted 2-node cuttings trailed on support standards',
    seedProductQuery: 'Fertilizer',
    fertilizerDose: '2x Nano Urea + 1kg Seaweed Bio-stimulant + 5kg Vermicompost per vine standard',
    recommendedEquipments: 'Telescopic Brass Lance Sprayer + Farmio Brush Cutter + Drip Screen Filter',
    harvestTime: 'Berry picking at 7 - 8 months (when berries turn orange-red)',
    tips: 'Drench vine base with Saaf / Nativo before monsoon to protect against Phytophthora quick wilt.'
  }
};

// Numerical price extractor for accurate client-side sorting
function extractPriceValue(priceStr) {
  if (!priceStr) return 0;
  const digits = priceStr.replace(/,/g, '').match(/\d+/);
  return digits ? parseInt(digits[0], 10) : 0;
}

// Robust Product Image Component that enforces authentic images with zero stock fallback
function ProductImageContainer({ src, alt, isVerified, className = '', containerClassName = '' }) {
  const [imageError, setImageError] = useState(false);

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

// Helper to derive single official destination metadata based on authentic availability
function getOfficialPlatformMeta(product) {
  const platform = (product.redirect_platform || '').toLowerCase();
  const url = (product.official_product_url || '').toLowerCase();
  const sourceName = product.source_name || '';

  if (platform.includes('iffco') || url.includes('iffcobazar')) {
    return {
      name: 'IFFCO Bazar Official Portal',
      badge: 'IFFCO Official',
      icon: '🌿',
      btnText: product.redirect_button_text || 'Buy on IFFCO Bazar',
      colorClass: 'bg-[#10B981] hover:bg-[#059669] text-black border-[#10B981] shadow-[#10B981]/20',
      badgeClass: 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40'
    };
  }
  if (platform.includes('amazon') || url.includes('amazon')) {
    return {
      name: 'Amazon India (Verified Brand Store)',
      badge: 'Amazon Store',
      icon: '🛒',
      btnText: product.redirect_button_text || 'Buy on Amazon',
      colorClass: 'bg-[#FF9900] hover:bg-[#E68A00] text-black border-[#FF9900] shadow-[#FF9900]/20',
      badgeClass: 'bg-amber-400/20 text-amber-300 border-amber-400/40'
    };
  }
  if (platform.includes('flipkart') || url.includes('flipkart')) {
    return {
      name: 'Flipkart (Verified Store)',
      badge: 'Flipkart Store',
      icon: '🛍️',
      btnText: product.redirect_button_text || 'Buy on Flipkart',
      colorClass: 'bg-[#2874F0] hover:bg-[#1A5DCB] text-white border-[#2874F0] shadow-[#2874F0]/20',
      badgeClass: 'bg-blue-400/20 text-blue-300 border-blue-400/40'
    };
  }
  return {
    name: product.redirect_platform || sourceName || 'Official Brand Portal',
    badge: 'Official Portal',
    icon: '🌐',
    btnText: product.redirect_button_text || 'Visit Official Portal',
    colorClass: 'bg-[#10B981] hover:bg-[#059669] text-black border-[#10B981] shadow-[#10B981]/20',
    badgeClass: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40'
  };
}

export default function MarketplacePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters, Search & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [sortBy, setSortBy] = useState('featured'); // 'featured', 'rating_desc', 'price_asc', 'price_desc', 'name_asc'
  const [priceRangeFilter, setPriceRangeFilter] = useState('all'); // 'all', 'under_1k', '1k_to_10k', 'above_10k'

  // Modal & Side-by-side Product Comparison
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [comparisonList, setComparisonList] = useState([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Farm Input Estimator Tool state
  const [isEstimatorOpen, setIsEstimatorOpen] = useState(false);
  const [estimatorCrop, setEstimatorCrop] = useState('Tomato');
  const [estimatorAcres, setEstimatorAcres] = useState(2);

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

  // Comparison toggle handler (max 3 products)
  const toggleComparison = (product) => {
    setComparisonList((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      } else {
        if (prev.length >= 3) {
          alert('You can compare a maximum of 3 products at a time.');
          return prev;
        }
        return [...prev, product];
      }
    });
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let result = products.filter((item) => {
      // Category filter (support broad matches like Sowing Seeds or Fertilizers)
      if (selectedCategory !== 'All') {
        const catLower = selectedCategory.toLowerCase();
        const itemCatLower = (item.category || '').toLowerCase();

        if (catLower.includes('seed')) {
          if (!itemCatLower.includes('seed')) return false;
        } else if (catLower.includes('fertilizer')) {
          if (!itemCatLower.includes('fertilizer')) return false;
        } else if (catLower.includes('equipment') || catLower.includes('machinery')) {
          const isEquipment = ['farming equipments', 'farm machinery', 'tractors', 'sprayers', 'farm tools']
            .some((t) => itemCatLower.includes(t.toLowerCase()));
          if (!isEquipment) return false;
        } else if (catLower.includes('pesticide') || catLower.includes('crop protection')) {
          if (!itemCatLower.includes('pesticide') && !itemCatLower.includes('crop protection')) return false;
        } else if (item.category !== selectedCategory) {
          return false;
        }
      }

      // Brand filter
      if (selectedBrand !== 'All' && item.brand !== selectedBrand) {
        return false;
      }

      // Price Range Filter
      if (priceRangeFilter !== 'all') {
        const pVal = extractPriceValue(item.estimated_price);
        if (priceRangeFilter === 'under_1k' && pVal >= 1000) return false;
        if (priceRangeFilter === '1k_to_10k' && (pVal < 1000 || pVal > 10000)) return false;
        if (priceRangeFilter === 'above_10k' && pVal <= 10000) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = item.name?.toLowerCase().includes(query);
        const matchBrand = item.brand?.toLowerCase().includes(query);
        const matchDesc = item.description?.toLowerCase().includes(query);
        const matchCat = item.category?.toLowerCase().includes(query);
        const matchBenefits = item.key_benefits?.toLowerCase().includes(query);
        if (!matchName && !matchBrand && !matchDesc && !matchCat && !matchBenefits) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    if (sortBy === 'rating_desc') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'name_asc') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'price_asc') {
      result.sort((a, b) => extractPriceValue(a.estimated_price) - extractPriceValue(b.estimated_price));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => extractPriceValue(b.estimated_price) - extractPriceValue(a.estimated_price));
    }

    return result;
  }, [products, selectedCategory, selectedBrand, searchQuery, sortBy, priceRangeFilter]);

  // Apply quick filter from estimator
  const applyEstimatorFilter = (cropKey) => {
    const data = CROP_ESTIMATOR_DATA[cropKey];
    if (data) {
      setSelectedCategory('All');
      setSearchQuery(data.seedProductQuery);
      setIsEstimatorOpen(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto selection:bg-[#10B981] selection:text-black">
      {/* 1. Header Section */}
      <div className="space-y-4 border-b border-[#1B382D] pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="os-status-pill os-status-emerald">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                Official Agricultural Products Gateway
              </span>
              <span className="text-[11px] text-emerald-400 font-mono bg-[#0D241B] border border-[#1B4B38] px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-semibold">
                <BadgeCheck className="w-3.5 h-3.5 text-[#10B981]" />
                1 Official Verified Site Per Product
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981]/20 to-[#047857]/20 text-[#10B981] border border-[#10B981]/40 flex items-center justify-center shrink-0 shadow-lg shadow-[#10B981]/10">
                <Sprout className="w-5 h-5 text-[#10B981]" />
              </div>
              <span>AgroVision Farming Inputs & Equipment Marketplace</span>
            </h1>

            <p className="text-xs sm:text-sm text-[#8FA59B] mt-1.5 max-w-3xl leading-relaxed">
              Curated agricultural catalog featuring certified <strong className="text-[#F3F7F5]">Sowing Seeds</strong>, breakthrough <strong className="text-[#F3F7F5]">Fertilizers & Nutrients</strong>, heavy-duty <strong className="text-[#F3F7F5]">Farming Equipments & Machinery</strong>, and drip irrigation tools. Each item connects directly to its authorized manufacturer or verified brand portal.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
            <button
              onClick={() => setIsEstimatorOpen(!isEstimatorOpen)}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 bg-[#0A261C] text-emerald-300 border border-[#10B981]/40 hover:bg-[#10B981]/20 transition-all shadow-md shadow-[#10B981]/10"
              title="Calculate seed and fertilizer needs for your land"
            >
              <Calculator className="w-4 h-4 text-[#10B981]" />
              <span>{isEstimatorOpen ? 'Hide Farm Estimator' : '🌱 Farm Estimator'}</span>
            </button>

            <button
              onClick={fetchData}
              disabled={loading}
              className="os-btn-secondary flex items-center gap-2 text-xs py-2.5 px-3.5 hover:border-[#10B981]/40 transition-all"
              title="Refresh live catalog"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh ({products.length})</span>
            </button>
          </div>
        </div>

        {/* 3 Core Highlight Pillars: Sowing Seeds, Fertilizers, Farming Equipments */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* Pillar 1: Sowing Seeds */}
          <button
            onClick={() => {
              setSelectedCategory('Sowing Seeds');
              setSearchQuery('');
            }}
            className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 group ${
              selectedCategory === 'Sowing Seeds'
                ? 'bg-[#0E2C20] border-[#10B981] shadow-lg shadow-[#10B981]/15'
                : 'bg-[#081711] border-[#1B382D] hover:border-[#10B981]/50 hover:bg-[#0B1E16]'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Sprout className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#F3F7F5] group-hover:text-emerald-300">
                  🌾 Sowing Seeds
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-[#1B382D] text-emerald-400">
                  Hybrid & Certified
                </span>
              </div>
              <p className="text-[11px] text-[#8FA59B] mt-0.5 line-clamp-2 leading-relaxed">
                Tomato Saaho, US 7067 Chilli, Pioneer P3396 Maize, Kaveri Paddy & Nunhems Onion.
              </p>
            </div>
          </button>

          {/* Pillar 2: Fertilizers */}
          <button
            onClick={() => {
              setSelectedCategory('Fertilizers');
              setSearchQuery('');
            }}
            className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 group ${
              selectedCategory === 'Fertilizers'
                ? 'bg-[#0E2C20] border-[#10B981] shadow-lg shadow-[#10B981]/15'
                : 'bg-[#081711] border-[#1B382D] hover:border-[#10B981]/50 hover:bg-[#0B1E16]'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#F3F7F5] group-hover:text-teal-300">
                  🧪 Fertilizers & Nutrients
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-[#1B382D] text-teal-400">
                  Govt Approved
                </span>
              </div>
              <p className="text-[11px] text-[#8FA59B] mt-0.5 line-clamp-2 leading-relaxed">
                IFFCO Nano Urea & Nano DAP, 100% Water Soluble NPK 19-19-19, Pure Humic Acid & Seaweed.
              </p>
            </div>
          </button>

          {/* Pillar 3: Farming Equipments */}
          <button
            onClick={() => {
              setSelectedCategory('Farming Equipments');
              setSearchQuery('');
            }}
            className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 group ${
              selectedCategory === 'Farming Equipments'
                ? 'bg-[#0E2C20] border-[#10B981] shadow-lg shadow-[#10B981]/15'
                : 'bg-[#081711] border-[#1B382D] hover:border-[#10B981]/50 hover:bg-[#0B1E16]'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Tractor className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#F3F7F5] group-hover:text-amber-300">
                  🚜 Farming Equipments
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-[#1B382D] text-amber-400">
                  Heavy Machinery
                </span>
              </div>
              <p className="text-[11px] text-[#8FA59B] mt-0.5 line-clamp-2 leading-relaxed">
                Sonalika & Mahindra Tractors, ASPEE Power Sprayers, 2-Stroke Brush Cutters & Chaff Cutters.
              </p>
            </div>
          </button>
        </div>

        {/* Interactive Farm Input Estimator Collapsible Drawer */}
        <AnimatePresence>
          {isEstimatorOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 sm:p-5 rounded-2xl bg-[#091D15] border border-[#10B981]/50 shadow-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1B4B38] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#F3F7F5] flex items-center gap-2">
                        Interactive Farm Input & Machinery Estimator
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40">
                          Agronomic Recommendation Engine
                        </span>
                      </h3>
                      <p className="text-xs text-[#8FA59B]">
                        Select your crop and farm holding to calculate recommended seed quantity, fertilizer doses, and matching machinery.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsEstimatorOpen(false)}
                    className="p-1.5 rounded-lg bg-[#0E241B] text-[#8FA59B] hover:text-[#F3F7F5] self-end sm:self-center"
                    aria-label="Close estimator"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Crop & Land Size Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6 space-y-1">
                    <label className="text-[11px] font-bold text-[#8FA59B] uppercase tracking-wider">
                      Select Target Crop
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(CROP_ESTIMATOR_DATA).map((crop) => (
                        <button
                          key={crop}
                          onClick={() => setEstimatorCrop(crop)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            estimatorCrop === crop
                              ? 'bg-[#10B981] text-black border-[#10B981] font-bold'
                              : 'bg-[#0E241B] text-[#8FA59B] border-[#1B382D] hover:text-[#F3F7F5]'
                          }`}
                        >
                          {crop}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="sm:col-span-6 space-y-1">
                    <label className="text-[11px] font-bold text-[#8FA59B] uppercase tracking-wider">
                      Farm Area: {estimatorAcres} Acre{estimatorAcres > 1 ? 's' : ''}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="20"
                        step="1"
                        value={estimatorAcres}
                        onChange={(e) => setEstimatorAcres(parseInt(e.target.value, 10))}
                        className="w-full accent-[#10B981] h-2 bg-[#0E241B] rounded-lg cursor-pointer"
                      />
                      <span className="font-mono text-sm font-bold text-emerald-400 min-w-[50px] text-right">
                        {estimatorAcres} Ac
                      </span>
                    </div>
                  </div>
                </div>

                {/* Estimator Results Card */}
                {(() => {
                  const data = CROP_ESTIMATOR_DATA[estimatorCrop];
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#06140F] border border-[#1B4B38]">
                      {/* Seed Recommendation */}
                      <div className="p-3 rounded-lg bg-[#0A2218] border border-[#1B382D] space-y-1">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                          Recommended Sowing Seeds
                        </span>
                        <p className="text-xs font-bold text-[#F3F7F5]">{data.name}</p>
                        <p className="text-[11px] text-[#C0D4CA]">
                          Rate for {estimatorAcres} Acre{estimatorAcres > 1 ? 's' : ''}: <strong className="text-emerald-300">{data.seedRatePerAcre}</strong>
                        </p>
                      </div>

                      {/* Fertilizer Requirement */}
                      <div className="p-3 rounded-lg bg-[#0A2218] border border-[#1B382D] space-y-1">
                        <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                          <FlaskConical className="w-3.5 h-3.5 text-teal-400" />
                          Fertilizer & Nutrition Schedule
                        </span>
                        <p className="text-[11px] text-[#C0D4CA] leading-snug">
                          {data.fertilizerDose} (Scaled for {estimatorAcres} Ac)
                        </p>
                      </div>

                      {/* Recommended Equipments */}
                      <div className="p-3 rounded-lg bg-[#0A2218] border border-[#1B382D] space-y-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Tractor className="w-3.5 h-3.5 text-amber-400" />
                            Recommended Farming Machinery
                          </span>
                          <p className="text-[11px] text-[#C0D4CA] leading-snug">
                            {data.recommendedEquipments}
                          </p>
                        </div>

                        <button
                          onClick={() => applyEstimatorFilter(estimatorCrop)}
                          className="mt-2 w-full py-1.5 px-3 rounded-lg bg-[#10B981] hover:bg-[#059669] text-black text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <span>View Matching Products for {estimatorCrop}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mandatory Safety Notice & Single Official Destination */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#091712] border border-[#10B981]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-[#F3F7F5] text-sm">
                  100% Direct Official Redirection (Non-Commerce Gateway)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40">
                  Zero Intermediary Margins
                </span>
              </div>
              <p className="text-[#8FA59B] leading-relaxed">
                AgroVision AI does not operate a payment gateway, seller marketplace, or intermediate cart. Each product connects directly to its <strong className="text-[#F3F7F5]">single authorized manufacturer portal</strong> (IFFCO, Sonalika, Mahindra, ASPEE, KisanKraft) or verified brand store for guaranteed authentic goods.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <span className="text-[11px] text-[#10B981] font-mono font-semibold flex items-center gap-1.5 bg-[#10B981]/10 px-2.5 py-1.5 rounded-lg border border-[#10B981]/30">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
              Single Official Source
            </span>
          </div>
        </div>
      </div>

      {/* 2. Controls: Search, Brand, Price, Sort & Category Filter Bar */}
      <div className="space-y-3">
        {/* Row 1: Search Box & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-[#8FA59B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search sowing seeds (Tomato, Chilli), fertilizers (Nano Urea, DAP, NPK), equipments (Tractor, Sprayer)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="os-input pl-10 pr-10 text-xs w-full h-11 bg-[#091712]"
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
          <div className="md:col-span-3 relative">
            <div className="relative w-full">
              <Building2 className="w-4 h-4 text-[#8FA59B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="os-input pl-10 pr-8 text-xs w-full h-11 appearance-none cursor-pointer bg-[#091712]"
              >
                <option value="All">All Brands ({brands.length})</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 text-[#8FA59B] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Sort Selector */}
          <div className="md:col-span-3 relative flex items-center gap-2">
            <div className="relative w-full">
              <ArrowUpDown className="w-4 h-4 text-[#8FA59B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="os-input pl-10 pr-8 text-xs w-full h-11 appearance-none cursor-pointer bg-[#091712]"
              >
                <option value="featured">Sort: Featured Products</option>
                <option value="rating_desc">Sort: Highest Rated (★ 4.8+)</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#8FA59B] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {(selectedCategory !== 'All' || selectedBrand !== 'All' || searchQuery || priceRangeFilter !== 'all' || sortBy !== 'featured') && (
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedBrand('All');
                  setPriceRangeFilter('all');
                  setSortBy('featured');
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

        {/* Row 2: Price Bracket Pills & Category Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#1B382D]/60">
          {/* Category Horizontal Scrolling Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 custom-scrollbar flex-1">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                selectedCategory === 'All'
                  ? 'bg-[#10B981] text-black border-[#10B981] shadow-md shadow-[#10B981]/20 font-bold'
                  : 'bg-[#0E1E18] text-[#8FA59B] border-[#1B382D] hover:text-[#F3F7F5] hover:border-[#10B981]/40'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Products</span>
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
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-[#10B981] text-black border-[#10B981] shadow-md shadow-[#10B981]/20 font-bold'
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

          {/* Quick Price Bracket Filter */}
          <div className="flex items-center gap-1.5 shrink-0 self-end">
            <span className="text-[10px] font-bold text-[#8FA59B] uppercase font-mono mr-1 hidden sm:inline">Price:</span>
            {[
              { id: 'all', label: 'All' },
              { id: 'under_1k', label: '< ₹1,000' },
              { id: '1k_to_10k', label: '₹1k - ₹10k' },
              { id: 'above_10k', label: '> ₹10,000' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPriceRangeFilter(p.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border transition-all ${
                  priceRangeFilter === p.id
                    ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]'
                    : 'bg-[#081510] text-[#8FA59B] border-[#1B382D] hover:text-[#F3F7F5]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Catalog Status & Count Bar */}
      <div className="flex items-center justify-between text-xs text-[#8FA59B] px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span>Showing</span>
          <span className="font-bold text-[#F3F7F5] font-mono">{filteredProducts.length}</span>
          <span>verified product{filteredProducts.length === 1 ? '' : 's'}</span>
          {selectedCategory !== 'All' && (
            <span className="text-[#10B981] font-semibold">• {selectedCategory}</span>
          )}
          {selectedBrand !== 'All' && (
            <span className="text-[#10B981] font-semibold">• {selectedBrand}</span>
          )}
          {priceRangeFilter !== 'all' && (
            <span className="text-amber-400 font-semibold">• Price Filter Active</span>
          )}
        </div>

        {/* Comparison Dock Trigger */}
        <div className="flex items-center gap-3">
          {comparisonList.length > 0 && (
            <button
              onClick={() => setShowComparisonModal(true)}
              className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-500/30 transition-all animate-pulse"
            >
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>Compare Selected ({comparisonList.length}/3)</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-[#8FA59B]">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span>Single Verified Official Site Per Product</span>
          </div>
        </div>
      </div>

      {/* 4. Products Grid */}
      {loading ? (
        <div className="p-20 text-center space-y-3 os-card">
          <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#8FA59B]">Loading verified agricultural catalog & redirect links...</p>
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
              We couldn't find any official items matching your current filters. Try resetting your search query or switching categories.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSelectedBrand('All');
              setPriceRangeFilter('all');
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
            const meta = getOfficialPlatformMeta(product);
            const isComparing = comparisonList.some((p) => p.id === product.id);

            return (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`os-card-elevated flex flex-col justify-between overflow-hidden group hover:border-[#10B981]/50 transition-all bg-[#081510] border ${
                  isComparing ? 'border-amber-500/60 ring-1 ring-amber-500/40' : 'border-[#1B382D]'
                }`}
              >
                <div>
                  {/* Product Image Banner */}
                  <div className="relative h-48 w-full bg-[#040C08] overflow-hidden border-b border-[#1B382D] flex items-center justify-center">
                    <ProductImageContainer
                      src={product.image_url}
                      alt={product.name}
                      isVerified={product.image_verified}
                      className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Category Overlay Tag */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#08120E]/90 backdrop-blur-md border border-[#1B382D] text-[10px] font-bold text-[#F3F7F5]">
                      <Icon className="w-3 h-3 text-[#10B981]" />
                      <span>{product.category}</span>
                    </div>

                    {/* Pack Size Overlay */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                      {product.pack_size && (
                        <span className="px-2 py-0.5 rounded-md bg-[#08120E]/90 backdrop-blur-md border border-[#1B382D] text-[10px] font-mono text-[#8FA59B] flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5 text-[#10B981]" />
                          {product.pack_size}
                        </span>
                      )}
                    </div>

                    {/* Rating & Compare Toggle */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {/* Compare toggle button */}
                      <button
                        onClick={() => toggleComparison(product)}
                        title={isComparing ? 'Remove from comparison' : 'Add to side-by-side comparison'}
                        className={`p-1.5 rounded-lg backdrop-blur-md border text-[10px] font-bold flex items-center gap-1 transition-all ${
                          isComparing
                            ? 'bg-amber-500 text-black border-amber-400'
                            : 'bg-[#08120E]/90 text-[#8FA59B] border-[#1B382D] hover:text-[#F3F7F5]'
                        }`}
                      >
                        <Scale className="w-3 h-3" />
                        <span className="hidden sm:inline">{isComparing ? 'Added' : 'Compare'}</span>
                      </button>

                      {product.rating && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#08120E]/90 backdrop-blur-md border border-amber-500/30 text-[10px] font-bold text-amber-300">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span>{product.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Content */}
                  <div className="p-4 sm:p-5 space-y-3">
                    {/* Brand & Price Header */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-emerald-400">
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{product.brand}</span>
                      </div>
                      {product.estimated_price && (
                        <span className="font-bold text-[#F3F7F5] font-mono bg-[#10B981]/15 px-2 py-0.5 rounded border border-[#10B981]/30 text-[11px]">
                          {product.estimated_price}
                        </span>
                      )}
                    </div>

                    {/* Product Name */}
                    <h3 className="text-sm font-bold text-[#F3F7F5] font-heading line-clamp-2 min-h-[40px] leading-snug">
                      {product.name}
                    </h3>

                    {/* Agronomic Key Benefits Badge (High utility for farmers) */}
                    {product.key_benefits ? (
                      <div className="p-2.5 rounded-xl bg-[#0B1E16] border border-[#10B981]/25 text-[11px] text-[#8FA59B] space-y-0.5">
                        <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#10B981]" />
                          Agronomic Benefits / Specifications
                        </span>
                        <p className="line-clamp-2 text-[#C0D4CA] text-[11px] leading-relaxed">
                          {product.key_benefits}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-[#8FA59B] line-clamp-2 leading-relaxed">
                        {product.description || 'Verified agricultural inputs and farming equipment.'}
                      </p>
                    )}

                    {/* Provenance Source */}
                    <div className="pt-2 border-t border-[#1B382D]/70 text-[10px] text-[#8FA59B] flex items-center justify-between">
                      <div className="flex items-center gap-1 truncate">
                        <CheckCircle2 className="w-3 h-3 text-[#10B981] shrink-0" />
                        <span className="truncate">{product.source_name}</span>
                      </div>
                      <span className="text-[#577366] font-mono shrink-0">#{product.id}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions: Single Verified Official Destination */}
                <div className="p-4 sm:p-5 pt-0 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#8FA59B] flex items-center gap-1 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                      Official Site:
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${meta.badgeClass}`}>
                      {meta.badge}
                    </span>
                  </div>

                  {/* Single Official Direct Redirection Button */}
                  {product.official_product_url && product.url_verified ? (
                    <a
                      href={product.official_product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all text-center ${meta.colorClass}`}
                      title={`Redirect directly to ${meta.name}`}
                    >
                      <span>{meta.icon}</span>
                      <span className="truncate">{meta.btnText}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  ) : null}

                  {/* Secondary Specs & Benefits Button */}
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="w-full os-btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5 hover:border-[#10B981]/40"
                  >
                    <span>View Specifications & Agronomic Guide</span>
                    <ArrowUpRight className="w-3 h-3 text-[#10B981]" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Floating Sticky Comparison Bar (When 1+ items selected) */}
      <AnimatePresence>
        {comparisonList.length > 0 && !showComparisonModal && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[92%] p-3.5 rounded-2xl bg-[#091C14]/95 backdrop-blur-md border border-[#10B981]/50 shadow-2xl flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#F3F7F5] block truncate">
                  {comparisonList.length} Product{comparisonList.length > 1 ? 's' : ''} Ready to Compare
                </span>
                <span className="text-[10px] text-[#8FA59B] block truncate">
                  {comparisonList.map((p) => p.name.split(' ')[0]).join(', ')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setComparisonList([])}
                className="p-2 rounded-xl bg-[#0E241B] text-[#8FA59B] hover:text-[#EF4444] border border-[#1B382D] text-xs"
                title="Clear comparison"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowComparisonModal(true)}
                className="py-2 px-4 rounded-xl bg-[#10B981] hover:bg-[#059669] text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#10B981]/20 transition-all"
              >
                <span>Compare Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="os-card-elevated max-w-2xl w-full max-h-[92vh] overflow-y-auto custom-scrollbar border-[#10B981]/40 shadow-2xl relative bg-[#091712]"
            >
              {/* Modal Header Bar */}
              <div className="p-5 border-b border-[#1B382D] flex items-center justify-between sticky top-0 bg-[#091712]/95 backdrop-blur-md z-10">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="p-2 rounded-xl bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-[#10B981] tracking-wider uppercase font-mono block">
                      Verified Agricultural Product Discovery
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
                <div className="relative h-64 w-full rounded-2xl bg-[#040C08] overflow-hidden border border-[#1B382D] flex items-center justify-center">
                  <ProductImageContainer
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    isVerified={selectedProduct.image_verified}
                    className="w-full h-full object-contain p-4"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-[#08120E]/90 backdrop-blur-md border border-[#1B382D] text-xs font-bold text-[#F3F7F5]">
                    {selectedProduct.category}
                  </div>
                  {selectedProduct.pack_size && (
                    <div className="absolute bottom-3 left-3 px-3 py-1 rounded-xl bg-[#08120E]/90 backdrop-blur-md border border-[#1B382D] text-xs font-mono text-[#10B981] font-bold">
                      {selectedProduct.pack_size}
                    </div>
                  )}
                  {selectedProduct.rating && (
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-xl bg-[#08120E]/90 backdrop-blur-md border border-amber-500/30 text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>{selectedProduct.rating} / 5.0</span>
                    </div>
                  )}
                </div>

                {/* Product Title & Brand */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Manufacturer: {selectedProduct.brand}</span>
                    </div>
                    {selectedProduct.estimated_price && (
                      <span className="text-sm font-bold text-[#F3F7F5] font-mono bg-[#10B981]/20 px-2.5 py-1 rounded-lg border border-[#10B981]/40">
                        Price: {selectedProduct.estimated_price}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#F3F7F5] font-heading">
                    {selectedProduct.name}
                  </h3>
                </div>

                {/* Agronomic Key Benefits & Dosage Guidance */}
                {selectedProduct.key_benefits && (
                  <div className="p-4 rounded-2xl bg-[#0B1E16] border border-[#10B981]/30 space-y-2 text-xs">
                    <span className="font-bold text-[#10B981] flex items-center gap-1.5 uppercase tracking-wide">
                      <Sparkles className="w-4 h-4 text-[#10B981]" />
                      Agronomic Impact, Dosage & Specifications
                    </span>
                    <p className="text-[#C0D4CA] leading-relaxed text-xs sm:text-sm">
                      {selectedProduct.key_benefits}
                    </p>
                  </div>
                )}

                {/* Description & Technical Specifications */}
                <div className="p-4 rounded-2xl bg-[#08120E] border border-[#1B382D] space-y-2 text-xs">
                  <span className="font-bold text-[#F3F7F5] flex items-center gap-1.5 uppercase tracking-wide">
                    <Info className="w-3.5 h-3.5 text-[#10B981]" />
                    Product Overview & Specifications
                  </span>
                  <p className="text-[#8FA59B] leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                    {selectedProduct.description}
                  </p>
                </div>

                {/* SINGLE VERIFIED OFFICIAL REDIRECTION ACTION CENTER */}
                {(() => {
                  const modalMeta = getOfficialPlatformMeta(selectedProduct);
                  return (
                    <div className="space-y-3 p-4 rounded-2xl bg-[#06120E] border border-[#10B981]/40">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#F3F7F5] uppercase tracking-wide flex items-center gap-1.5">
                          <Store className="w-4 h-4 text-[#10B981]" />
                          Single Verified Official Destination
                        </span>
                        <span className="text-[10px] text-[#10B981] font-mono font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                          100% Genuine Redirect
                        </span>
                      </div>

                      <p className="text-[11px] text-[#8FA59B] leading-relaxed">
                        This item is officially distributed via <strong className="text-[#F3F7F5]">{modalMeta.name}</strong>. Clicking below connects you directly to the verified product page with zero intermediary fees:
                      </p>

                      <div className="p-4 rounded-xl bg-[#091712] border border-[#1B382D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg">{modalMeta.icon}</span>
                            <span className="text-sm font-bold text-[#F3F7F5]">{modalMeta.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${modalMeta.badgeClass}`}>
                              {modalMeta.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#8FA59B]">
                            Verified Source: <span className="text-[#C0D4CA] font-medium">{selectedProduct.source_name}</span>
                          </p>
                        </div>

                        {selectedProduct.official_product_url ? (
                          <a
                            href={selectedProduct.official_product_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`py-3 px-5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all shrink-0 ${modalMeta.colorClass}`}
                          >
                            <span>{modalMeta.btnText}</span>
                            <ExternalLink className="w-4 h-4 shrink-0" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  );
                })()}

                {/* Mandatory External Purchase Disclaimer */}
                <div className="p-3.5 rounded-xl bg-[#0B1B14] border border-[#10B981]/30 space-y-1 text-xs">
                  <span className="font-bold text-[#10B981] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    AGROVISION OFFICIAL DIRECT REDIRECTION POLICY
                  </span>
                  <p className="text-[#8FA59B] text-[11px] leading-relaxed">
                    AgroVision AI acts purely as an agricultural input discovery guide. We do not sell items or process monetary transactions. You will be redirected directly to the product's verified official source to review seller ratings and finalize your purchase.
                  </p>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="os-btn-secondary py-2.5 px-6 text-xs"
                  >
                    Close Specifications
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Side-by-side Product Comparison Modal */}
      <AnimatePresence>
        {showComparisonModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="os-card-elevated max-w-4xl w-full max-h-[92vh] overflow-y-auto custom-scrollbar border-[#10B981]/50 shadow-2xl relative bg-[#091712]"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-[#1B382D] flex items-center justify-between sticky top-0 bg-[#091712]/95 backdrop-blur-md z-10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#F3F7F5] flex items-center gap-2">
                      Side-by-Side Product Comparison
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {comparisonList.length} Items Selected
                      </span>
                    </h2>
                    <p className="text-xs text-[#8FA59B]">
                      Compare technical specs, agronomic benefits, and verified official purchase links.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowComparisonModal(false)}
                  className="p-2 rounded-xl bg-[#0E1E18] text-[#8FA59B] hover:text-[#F3F7F5] border border-[#1B382D]"
                  aria-label="Close comparison"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Comparison Table */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {comparisonList.map((prod) => {
                    const meta = getOfficialPlatformMeta(prod);

                    return (
                      <div
                        key={prod.id}
                        className="p-4 rounded-2xl bg-[#06120E] border border-[#1B382D] flex flex-col justify-between space-y-4 relative"
                      >
                        {/* Remove item button */}
                        <button
                          onClick={() => toggleComparison(prod)}
                          title="Remove from comparison"
                          className="absolute top-3 right-3 p-1.5 rounded-lg bg-[#0E1E18] text-[#8FA59B] hover:text-[#EF4444] border border-[#1B382D]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="space-y-3">
                          {/* Image preview */}
                          <div className="h-36 w-full rounded-xl bg-[#040C08] overflow-hidden border border-[#1B382D] flex items-center justify-center p-2">
                            <ProductImageContainer
                              src={prod.image_url}
                              alt={prod.name}
                              isVerified={prod.image_verified}
                              className="w-full h-full object-contain"
                            />
                          </div>

                          {/* Brand & Category */}
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-emerald-400 font-semibold">{prod.brand}</span>
                            <span className="px-2 py-0.5 rounded-full bg-[#0E1E18] text-[#8FA59B] border border-[#1B382D]">
                              {prod.category}
                            </span>
                          </div>

                          {/* Name */}
                          <h3 className="text-xs font-bold text-[#F3F7F5] min-h-[32px] line-clamp-2 leading-snug">
                            {prod.name}
                          </h3>

                          {/* Specs Matrix */}
                          <div className="space-y-2 text-xs border-t border-[#1B382D] pt-2">
                            <div className="flex justify-between py-1 border-b border-[#1B382D]/40">
                              <span className="text-[#8FA59B]">Price:</span>
                              <span className="font-mono font-bold text-[#F3F7F5]">{prod.estimated_price || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-[#1B382D]/40">
                              <span className="text-[#8FA59B]">Pack Size:</span>
                              <span className="font-mono text-[#8FA59B]">{prod.pack_size || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-[#1B382D]/40">
                              <span className="text-[#8FA59B]">Rating:</span>
                              <span className="font-bold text-amber-400 flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-400" />
                                {prod.rating} / 5.0
                              </span>
                            </div>
                          </div>

                          {/* Agronomic Summary */}
                          <div className="p-2.5 rounded-xl bg-[#0A1E16] border border-[#10B981]/20 text-[11px] space-y-1">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide block">
                              Agronomic Impact
                            </span>
                            <p className="text-[#C0D4CA] line-clamp-3 leading-relaxed">
                              {prod.key_benefits || prod.description}
                            </p>
                          </div>
                        </div>

                        {/* Direct official link */}
                        <div className="pt-2 border-t border-[#1B382D] space-y-2">
                          <a
                            href={prod.official_product_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-center ${meta.colorClass}`}
                          >
                            <span>{meta.btnText}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-[#1B382D]">
                  <button
                    onClick={() => setComparisonList([])}
                    className="os-btn-secondary text-xs py-2 px-4 hover:text-[#EF4444]"
                  >
                    Clear All
                  </button>

                  <button
                    onClick={() => setShowComparisonModal(false)}
                    className="os-btn-primary text-xs py-2 px-6"
                  >
                    Close Comparison
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
