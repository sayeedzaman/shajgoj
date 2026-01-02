'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import StrikingOfferCard from '@/src/components/offers/StrikingOfferCard';
import CategoryOfferCard from '@/src/components/offers/CategoryOfferCard';
import ProductCard from '@/src/components/products/ProductCard';
import ProductCardSkeleton from '@/src/components/products/ProductCardSkeleton';
import { Product } from '@/src/types/index';

interface Offer {
  id: string;
  name: string;
  code: string;
  description?: string;
  imageUrl?: string;
  // Link options
  linkType: 'url' | 'product';
  link?: string; // Custom URL
  productId?: string; // Product ID for direct product link
  productName?: string;
  productImage?: string;
  type: 'hero' | 'deal' | 'brand' | 'limited';
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usageCount: number;
  status: 'ACTIVE' | 'EXPIRED' | 'SCHEDULED';
  displayOnHomepage: boolean;
  priority: number;
  // Visual styling options for striking offer cards
  backgroundColor?: string;
  textColor?: string;
  badgeColor?: string;
  borderStyle?: 'wavy' | 'rounded' | 'sharp' | 'irregular';
  cardStyle?: 'gradient' | 'solid' | 'image';
}

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroOffers, setHeroOffers] = useState<Offer[]>([]);
  const [dealOffers, setDealOffers] = useState<Offer[]>([]);
  const [brandOffers, setBrandOffers] = useState<Offer[]>([]);
  const [limitedOffers, setLimitedOffers] = useState<Offer[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [topSellingProducts, setTopSellingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);

  // Fetch offers from API on mount
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/offers/active`);

        let activeOffers: Offer[] = [];

        if (response.ok) {
          activeOffers = await response.json();
        }

        // Hero Banners - Use API offers or fallback to dummy data
        const heroData = activeOffers.filter((o) => o.type === 'hero');
        if (heroData.length > 0) {
          setHeroOffers(heroData.sort((a, b) => (b.priority || 0) - (a.priority || 0)));
        } else {
          // Dummy hero banners (company/website advertisement)
          setHeroOffers(getDummyHeroOffers());
        }

        // Deal Cards - Use API offers or fallback to dummy data
        const dealData = activeOffers.filter((o) => o.type === 'deal');
        if (dealData.length > 0) {
          setDealOffers(
            dealData.sort((a, b) => (b.priority || 0) - (a.priority || 0)).slice(0, 4)
          );
        } else {
          setDealOffers(getDummyDealOffers());
        }

        // Brand Ads - Use API offers or fallback to dummy data
        const brandData = activeOffers.filter((o) => o.type === 'brand');
        if (brandData.length > 0) {
          setBrandOffers(
            brandData.sort((a, b) => (b.priority || 0) - (a.priority || 0)).slice(0, 3)
          );
        } else {
          setBrandOffers(getDummyBrandOffers());
        }

        // Limited Time Offers - Use API offers or fallback to dummy data
        const limitedData = activeOffers.filter((o) => o.type === 'limited');
        if (limitedData.length > 0) {
          setLimitedOffers(
            limitedData.sort((a, b) => (b.priority || 0) - (a.priority || 0)).slice(0, 4)
          );
        } else {
          setLimitedOffers(getDummyLimitedOffers());
        }
      } catch (error) {
        console.error('Error loading offers:', error);
        // On error, show dummy data
        setHeroOffers(getDummyHeroOffers());
        setDealOffers(getDummyDealOffers());
        setBrandOffers(getDummyBrandOffers());
        setLimitedOffers(getDummyLimitedOffers());
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  // Fetch featured and top selling products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

        // Fetch featured products
        const featuredRes = await fetch(`${apiUrl}/api/products?featured=true&limit=8`);
        if (featuredRes.ok) {
          const featuredData = await featuredRes.json();
          setFeaturedProducts(featuredData.products || []);
        }

        // Fetch top selling products (for now, just get recent products with sale prices)
        const topSellingRes = await fetch(`${apiUrl}/api/products?limit=12&sortBy=createdAt&order=desc`);
        if (topSellingRes.ok) {
          const topSellingData = await topSellingRes.json();
          setTopSellingProducts(topSellingData.products || []);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Dummy data generators for initial website appearance
  const getDummyHeroOffers = (): Offer[] => {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return [
      {
        id: 'dummy-hero-1',
        name: 'Welcome to Khali\'s Beauty',
        code: 'WELCOME',
        description: 'Your one-stop shop for beauty and wellness products',
        linkType: 'url',
        link: '/products',
        type: 'hero',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minPurchase: 0,
        startDate: today,
        endDate: nextMonth,
        usageLimit: 1000,
        usageCount: 0,
        status: 'ACTIVE',
        displayOnHomepage: true,
        priority: 10,
      },
      {
        id: 'dummy-hero-2',
        name: 'New Arrivals',
        code: 'NEWARRIVAL',
        description: 'Discover the latest beauty trends and products',
        linkType: 'url',
        link: '/products',
        type: 'hero',
        discountType: 'PERCENTAGE',
        discountValue: 15,
        minPurchase: 500,
        startDate: today,
        endDate: nextMonth,
        usageLimit: 1000,
        usageCount: 0,
        status: 'ACTIVE',
        displayOnHomepage: true,
        priority: 9,
      },
      {
        id: 'dummy-hero-3',
        name: 'Premium Beauty Brands',
        code: 'PREMIUM',
        description: 'Shop authentic products from top international brands',
        linkType: 'url',
        link: '/products',
        type: 'hero',
        discountType: 'PERCENTAGE',
        discountValue: 25,
        minPurchase: 1000,
        startDate: today,
        endDate: nextMonth,
        usageLimit: 1000,
        usageCount: 0,
        status: 'ACTIVE',
        displayOnHomepage: true,
        priority: 8,
      },
    ];
  };

  const getDummyDealOffers = (): Offer[] => {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return [
      {
        id: 'dummy-deal-1',
        name: 'Skincare Essentials',
        code: 'SKINCARE',
        description: 'Complete your skincare routine',
        linkType: 'url',
        link: '/category/skincare',
        type: 'deal',
        discountType: 'PERCENTAGE',
        discountValue: 30,
        minPurchase: 500,
        startDate: today,
        endDate: nextMonth,
        usageLimit: 500,
        usageCount: 0,
        status: 'ACTIVE',
        displayOnHomepage: true,
        priority: 10,
      },
      {
        id: 'dummy-deal-2',
        name: 'Makeup Must-Haves',
        code: 'MAKEUP',
        description: 'Get your makeup collection started',
        linkType: 'url',
        link: '/category/makeup',
        type: 'deal',
        discountType: 'PERCENTAGE',
        discountValue: 25,
        minPurchase: 800,
        startDate: today,
        endDate: nextMonth,
        usageLimit: 500,
        usageCount: 0,
        status: 'ACTIVE',
        displayOnHomepage: true,
        priority: 9,
      },
      {
        id: 'dummy-deal-3',
        name: 'Hair Care Bundle',
        code: 'HAIRCARE',
        description: 'Nourish and strengthen your hair',
        linkType: 'url',
        link: '/category/hair-care',
        type: 'deal',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minPurchase: 600,
        startDate: today,
        endDate: nextMonth,
        usageLimit: 500,
        usageCount: 0,
        status: 'ACTIVE',
        displayOnHomepage: true,
        priority: 8,
      },
      {
        id: 'dummy-deal-4',
        name: 'Fragrances',
        code: 'FRAGRANCE',
        description: 'Signature scents for every occasion',
        linkType: 'url',
        link: '/category/fragrance',
        type: 'deal',
        discountType: 'PERCENTAGE',
        discountValue: 15,
        minPurchase: 1000,
        startDate: today,
        endDate: nextMonth,
        usageLimit: 500,
        usageCount: 0,
        status: 'ACTIVE',
        displayOnHomepage: true,
        priority: 7,
      },
    ];
  };

  const getDummyBrandOffers = (): Offer[] => {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return [
      {
        id: 'dummy-brand-1',
        name: 'Top International Brands',
        code: 'TOPBRANDS',
        description: 'Authentic products from trusted names',
        linkType: 'url',
        link: '/products',
        type: 'brand',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minPurchase: 500,
        startDate: today,
        endDate: nextMonth,
        usageLimit: 500,
        usageCount: 0,
        status: 'ACTIVE',
        displayOnHomepage: true,
        priority: 10,
      },
      {
        id: 'dummy-brand-2',
        name: 'K-Beauty Collection',
        code: 'KBEAUTY',
        description: 'Korean skincare and cosmetics',
        linkType: 'url',
        link: '/category/k-beauty',
        type: 'brand',
        discountType: 'PERCENTAGE',
        discountValue: 25,
        minPurchase: 800,
        startDate: today,
        endDate: nextMonth,
        usageLimit: 500,
        usageCount: 0,
        status: 'ACTIVE',
        displayOnHomepage: true,
        priority: 9,
      },
      {
        id: 'dummy-brand-3',
        name: 'Premium Wellness',
        code: 'WELLNESS',
        description: 'Health and wellness essentials',
        linkType: 'url',
        link: '/products',
        type: 'brand',
        discountType: 'PERCENTAGE',
        discountValue: 15,
        minPurchase: 600,
        startDate: today,
        endDate: nextMonth,
        usageLimit: 500,
        usageCount: 0,
        status: 'ACTIVE',
        displayOnHomepage: true,
        priority: 8,
      },
    ];
  };

  const getDummyLimitedOffers = (): Offer[] => {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return [
      {
        id: 'dummy-limited-1',
        name: 'Flash Sale',
        code: 'FLASH50',
        description: 'Limited time offer - Act fast!',
        linkType: 'url',
        link: '/sales',
        type: 'limited',
        discountType: 'PERCENTAGE',
        discountValue: 50,
        minPurchase: 1000,
        maxDiscount: 1000,
        startDate: today,
        endDate: nextWeek,
        usageLimit: 100,
        usageCount: 0,
        status: 'ACTIVE',
        displayOnHomepage: true,
        priority: 10,
      },
      {
        id: 'dummy-limited-2',
        name: 'Weekend Special',
        code: 'WEEKEND',
        description: 'Exclusive weekend deals',
        linkType: 'url',
        link: '/sales',
        type: 'limited',
        discountType: 'PERCENTAGE',
        discountValue: 40,
        minPurchase: 800,
        maxDiscount: 800,
        startDate: today,
        endDate: nextWeek,
        usageLimit: 100,
        usageCount: 0,
        status: 'ACTIVE',
        displayOnHomepage: true,
        priority: 9,
      },
      {
        id: 'dummy-limited-3',
        name: 'Clearance Sale',
        code: 'CLEARANCE',
        description: 'Final stock clearance',
        linkType: 'url',
        link: '/sales',
        type: 'limited',
        discountType: 'PERCENTAGE',
        discountValue: 60,
        minPurchase: 500,
        maxDiscount: 1500,
        startDate: today,
        endDate: nextWeek,
        usageLimit: 100,
        usageCount: 0,
        status: 'ACTIVE',
        displayOnHomepage: true,
        priority: 8,
      },
      {
        id: 'dummy-limited-4',
        name: 'Daily Deals',
        code: 'DAILY',
        description: 'New deals every day',
        linkType: 'url',
        link: '/sales',
        type: 'limited',
        discountType: 'PERCENTAGE',
        discountValue: 35,
        minPurchase: 600,
        maxDiscount: 700,
        startDate: today,
        endDate: nextWeek,
        usageLimit: 100,
        usageCount: 0,
        status: 'ACTIVE',
        displayOnHomepage: true,
        priority: 7,
      },
    ];
  };

  // Auto-slide effect for hero banners
  useEffect(() => {
    if (heroOffers.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % heroOffers.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [heroOffers.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroOffers.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroOffers.length) % heroOffers.length);
  };

  // Get the correct link for an offer (either custom URL, product page, or offers page with products)
  const getOfferLink = (offer: Offer): string => {
    if (offer.linkType === 'url' && offer.link) {
      // Use custom URL
      return offer.link;
    } else if (offer.linkType === 'product') {
      // If products are linked, go to offers page with this offer's products
      return `/offers?offerId=${offer.id}`;
    }
    // Fallback to offers page
    return '/offers';
  };

  // Categories
  const categories = [
    { name: 'Makeup', icon: '💄', link: '/category/makeup' },
    { name: 'K-beauty', icon: '🇰🇷', link: '/category/k-beauty' },
    { name: 'Hair Care', icon: '💇', link: '/category/hair-care' },
    { name: 'Mom & Baby', icon: '👶', link: '/category/mom-baby' },
    { name: 'Skin Care', icon: '✨', link: '/category/skin-care' },
    { name: 'Tools & Accessories', icon: '🔧', link: '/category/tools' },
    { name: 'Undergarments', icon: '👙', link: '/category/undergarments' },
    { name: 'Fragrance', icon: '🌸', link: '/category/fragrance' },
  ];

  // Shop by concern
  const concerns = [
    { name: 'Acne', link: '/concerns/acne' },
    { name: 'Anti-Aging', link: '/concerns/anti-aging' },
    { name: 'Dandruff', link: '/concerns/dandruff' },
    { name: 'Dry Skin', link: '/concerns/dry-skin' },
    { name: 'Hair Fall', link: '/concerns/hair-fall' },
    { name: 'Oil Control', link: '/concerns/oil-control' },
    { name: 'Pore Care', link: '/concerns/pore-care' },
    { name: 'Hyperpigmentation', link: '/concerns/hyperpigmentation' },
    { name: 'Hair Thinning', link: '/concerns/hair-thinning' },
    { name: 'Sun Protection', link: '/concerns/sun-protection' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Carousel Section */}
      {heroOffers.length > 0 && (
        <section className="relative w-full max-w-7xl mx-auto px-4 py-6">
          <div className="relative aspect-16/6 md:aspect-21/6 bg-gray-100 rounded-lg overflow-hidden">
            {/* Carousel Images */}
            <div className="relative w-full h-full">
              {heroOffers.map((offer, index) => (
                <Link
                  key={offer.id}
                  href={getOfferLink(offer)}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {offer.imageUrl ? (
                    <Image
                      src={offer.imageUrl}
                      alt={offer.name}
                      fill
                      sizes="100vw"
                      className="object-cover"
                      priority={index === 0}
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-r from-red-100 via-pink-100 to-purple-100 flex items-center justify-center">
                      <div className="text-center px-4">
                        <h2 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2">
                          {offer.name}
                        </h2>
                        {offer.description && (
                          <p className="text-gray-600 text-sm md:text-base">
                            {offer.description}
                          </p>
                        )}
                        <div className="mt-4 inline-block bg-red-500 text-white px-6 py-2 rounded-full text-lg font-bold">
                          {offer.discountType === 'PERCENTAGE'
                            ? `${offer.discountValue}% OFF`
                            : `৳${offer.discountValue} OFF`}
                        </div>
                      </div>
                    </div>
                  )}
                </Link>
              ))}
            </div>

            {/* Navigation Buttons - Hidden on mobile */}
            {heroOffers.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all z-10"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>
                <button
                  onClick={nextSlide}
                  className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all z-10"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-6 h-6 text-gray-800" />
                </button>

                {/* Slide Indicators - Smaller on mobile */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2 z-10">
                  {heroOffers.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`rounded-full transition-all ${
                        index === currentSlide
                          ? 'bg-red-500 w-4 h-1.5 md:w-6 md:h-2'
                          : 'bg-white/60 w-1.5 h-1.5 md:w-2 md:h-2'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Featured Products</h2>
          <Link href="/products?featured=true" className="text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 text-sm">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-4">
          {productsLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </>
          ) : featuredProducts.length > 0 ? (
            featuredProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} showAddToCart={true} />
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              No featured products available
            </div>
          )}
        </div>
      </section>

      {/* Top Selling Products */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Top Selling Products</h2>
          <Link href="/top-selling" className="text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 text-sm">
            View More <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-4">
          {productsLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </>
          ) : topSellingProducts.length > 0 ? (
            topSellingProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} showAddToCart={true} />
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              No top selling products available
            </div>
          )}
        </div>
      </section>

      {/* Deals You Cannot Miss - Striking Cards */}
      {dealOffers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
            Deals You Cannot Miss
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dealOffers.map((deal) => (
              <StrikingOfferCard key={deal.id} offer={deal} />
            ))}
          </div>
        </section>
      )}


      {/* Top Brands & Offers - Category Cards */}
      {brandOffers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
            Top Brands & Offers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {brandOffers.map((brand) => (
              <CategoryOfferCard key={brand.id} offer={brand} />
            ))}
          </div>
        </section>
      )}

      {/* Limited Time Offers - Striking Cards */}
      {limitedOffers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
            Limited Time Offers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {limitedOffers.map((offer) => (
              <StrikingOfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </section>
      )}

      {/* Shop Beauty Products by Category */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
          Shop Beauty Products by Category
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((category, index) => (
            <Link
              key={index}
              href={category.link}
              className="group flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-red-300 hover:shadow-lg transition-all"
            >
              <div className="text-4xl mb-3">{category.icon}</div>
              <h3 className="text-sm font-medium text-gray-800 text-center group-hover:text-red-500 transition-colors">
                {category.name}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Shop by Concern */}
      <section className="max-w-7xl mx-auto px-4 py-8 pb-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
          Shop by Concern
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {concerns.map((concern, index) => (
            <Link
              key={index}
              href={concern.link}
              className="group p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200 hover:border-red-400 hover:shadow-lg transition-all text-center"
            >
              <h3 className="text-base font-semibold text-gray-800 group-hover:text-red-600 transition-colors">
                {concern.name}
              </h3>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
