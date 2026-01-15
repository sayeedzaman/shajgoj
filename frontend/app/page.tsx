'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import StrikingOfferCard from '@/src/components/offers/StrikingOfferCard';
import ProductCard from '@/src/components/products/ProductCard';
import ProductCardSkeleton from '@/src/components/products/ProductCardSkeleton';
import { Product } from '@/src/types/index';

interface OfferProductItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  imageUrl?: string;
  images?: string[];
}

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
  type: 'hero' | 'deal' | 'brand' | 'limited' | 'deals-you-cannot-miss' | 'top-brands';
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
  showPlainImage?: boolean;
  // Products relationship
  OfferProduct?: Array<{
    id: string;
    Product: OfferProductItem;
  }>;
}

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroOffers, setHeroOffers] = useState<Offer[]>([]);
  const [dealsYouCannotMiss, setDealsYouCannotMiss] = useState<Offer[]>([]);
  const [topBrandsOffers, setTopBrandsOffers] = useState<Offer[]>([]);
  const [limitedOffers, setLimitedOffers] = useState<Offer[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [topSellingProducts, setTopSellingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);

  // Fetch all homepage data on mount - OPTIMIZED: Parallel API calls
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

        // Fetch all data in parallel for faster loading
        const [offersRes, featuredRes, topSellingRes] = await Promise.all([
          fetch(`${apiUrl}/api/offers/active`),
          fetch(`${apiUrl}/api/products/featured?limit=8`),
          fetch(`${apiUrl}/api/products/top-selling?limit=12`)
        ]);

        // Process offers
        let activeOffers: Offer[] = [];
        if (offersRes.ok) {
          activeOffers = await offersRes.json();
        }

        // Hero Banners - Use API offers or fallback to dummy data
        const heroData = activeOffers.filter((o) => o.type === 'hero');
        if (heroData.length > 0) {
          const sortedHero = heroData.sort((a, b) => (b.priority || 0) - (a.priority || 0));
          setHeroOffers(sortedHero);
        } else {
          setHeroOffers(getDummyHeroOffers());
        }

        // Deals You Cannot Miss - New offer type with square layout
        const dealsCannotMissData = activeOffers.filter((o) => o.type === 'deals-you-cannot-miss');
        setDealsYouCannotMiss(
          dealsCannotMissData.sort((a, b) => (b.priority || 0) - (a.priority || 0))
        );

        // Top Brands - New offer type with rectangle layout
        const topBrandsData = activeOffers.filter((o) => o.type === 'top-brands');
        setTopBrandsOffers(
          topBrandsData.sort((a, b) => (b.priority || 0) - (a.priority || 0))
        );

        // Limited Time Offers - Use API offers or fallback to dummy data
        const limitedData = activeOffers.filter((o) => o.type === 'limited');
        if (limitedData.length > 0) {
          setLimitedOffers(
            limitedData.sort((a, b) => (b.priority || 0) - (a.priority || 0)).slice(0, 4)
          );
        } else {
          setLimitedOffers(getDummyLimitedOffers());
        }

        // Process featured products
        if (featuredRes.ok) {
          const featuredData = await featuredRes.json();
          setFeaturedProducts(Array.isArray(featuredData) ? featuredData : []);
        }

        // Process top selling products
        if (topSellingRes.ok) {
          const topSellingData = await topSellingRes.json();
          setTopSellingProducts(topSellingData.products || []);
        }
      } catch (error) {
        console.error('Error loading homepage data:', error);
        // On error, show dummy data
        setHeroOffers(getDummyHeroOffers());
        setLimitedOffers(getDummyLimitedOffers());
      } finally {
        setLoading(false);
        setProductsLoading(false);
      }
    };

    fetchAllData();
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

  // Get the correct link for an offer (either custom URL, single product page, or offers page with multiple products)
  const getOfferLink = (offer: Offer): string => {
    const hasOfferProducts = offer.OfferProduct && offer.OfferProduct.length > 0;

    console.log('🔗 Getting link for offer:', {
      id: offer.id,
      name: offer.name,
      linkType: offer.linkType,
      link: offer.link,
      productId: offer.productId,
      hasOfferProducts,
      offerProductCount: offer.OfferProduct?.length || 0
    });

    if (offer.linkType === 'url' && offer.link) {
      // Use custom URL
      console.log('✅ Using custom URL:', offer.link);
      return offer.link;
    } else if (offer.linkType === 'product') {
      if (offer.productId) {
        // Single product link - go directly to the product page
        const productLink = `/products/${offer.productId}`;
        console.log('✅ Using single product link:', productLink);
        return productLink;
      } else if (hasOfferProducts) {
        // Multiple products - go to offers page with this offer's products
        const productsLink = `/offers?offerId=${offer.id}`;
        console.log('✅ Using multiple products link:', productsLink);
        return productsLink;
      }
    }
    // Fallback to offers page
    console.log('⚠️ Using fallback link: /offers');
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
                    index === currentSlide ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
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
              </>
            )}
          </div>

          {/* Slide Indicators - Outside and below the image */}
          {heroOffers.length > 1 && (
            <div className="flex justify-center gap-1.5 md:gap-2 mt-3">
              {heroOffers.map((_, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`rounded-full transition-all ${
                    index === currentSlide
                      ? 'bg-red-500 w-4 h-1.5 md:w-6 md:h-2'
                      : 'bg-gray-400 w-1.5 h-1.5 md:w-2 md:h-2'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Deals You Cannot Miss - Square Layout */}
      {dealsYouCannotMiss.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
            Deals You Cannot Miss
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dealsYouCannotMiss.map((offer) => (
              <Link
                key={offer.id}
                href={getOfferLink(offer)}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 block aspect-square"
              >
                {offer.showPlainImage && offer.imageUrl ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={offer.imageUrl}
                      alt={offer.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <>
                    <div className="relative h-2/3 bg-gradient-to-br from-red-100 to-purple-100">
                      {offer.imageUrl ? (
                        <Image
                          src={offer.imageUrl}
                          alt={offer.name}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl">🎁</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <div className="bg-red-500 text-white rounded-lg shadow-xl px-2 py-1">
                          <div className="text-lg font-bold">
                            {offer.discountType === 'PERCENTAGE'
                              ? `${offer.discountValue}%`
                              : `৳${offer.discountValue}`}
                          </div>
                          <div className="text-xs">OFF</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 h-1/3 flex flex-col justify-center">
                      <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">
                        {offer.name}
                      </h3>
                      <div className="text-xs font-mono font-bold text-red-600">
                        {offer.code}
                      </div>
                    </div>
                  </>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}


      {/* Top Brands - Rectangle Layout */}
      {topBrandsOffers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
            Top Brands Offers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topBrandsOffers.map((offer) => (
              <Link
                key={offer.id}
                href={getOfferLink(offer)}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 block"
              >
                {offer.showPlainImage && offer.imageUrl ? (
                  <div className="relative aspect-[3/2]">
                    <Image
                      src={offer.imageUrl}
                      alt={offer.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <>
                    <div className="relative aspect-[3/2] bg-gradient-to-br from-red-100 to-purple-100">
                      {offer.imageUrl ? (
                        <Image
                          src={offer.imageUrl}
                          alt={offer.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-6xl">🎁</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <div className="bg-red-500 text-white rounded-lg shadow-xl px-3 py-2">
                          <div className="text-xl font-bold">
                            {offer.discountType === 'PERCENTAGE'
                              ? `${offer.discountValue}%`
                              : `৳${offer.discountValue}`}
                          </div>
                          <div className="text-xs">OFF</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-base font-bold text-gray-900 mb-2">
                        {offer.name}
                      </h3>
                      <div className="text-sm font-mono font-bold text-red-600">
                        {offer.code}
                      </div>
                    </div>
                  </>
                )}
              </Link>
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

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Featured Products</h2>
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
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Top Selling Products</h2>
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

      {/* Stats Section - Before Footer */}
      <section className="bg-gradient-to-br from-red-50 via-pink-50 to-purple-50 py-16 mb-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {/* 100% Authentic */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 md:w-10 md:h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900">100%</h3>
                <p className="text-sm md:text-base text-gray-600 font-medium mt-1">Authentic Products</p>
              </div>
            </div>

            {/* 10000+ Beauty Products */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 md:w-10 md:h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900">10,000+</h3>
                <p className="text-sm md:text-base text-gray-600 font-medium mt-1">Beauty Products</p>
              </div>
            </div>

            {/* 300+ Brands */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 md:w-10 md:h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900">300+</h3>
                <p className="text-sm md:text-base text-gray-600 font-medium mt-1">Premium Brands</p>
              </div>
            </div>

            {/* Free Beauty Consultant */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 md:w-10 md:h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900">Free</h3>
                <p className="text-sm md:text-base text-gray-600 font-medium mt-1">Beauty Consultant</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fixed Chat Button on Right Side */}
      {/* <button
        type="button"
        onClick={() => {
          // Trigger the chat widget to open
          const chatButton = document.querySelector('[data-chat-widget-button]') as HTMLButtonElement;
          if (chatButton) {
            chatButton.click();
          }
        }}
        className="fixed top-1/2 right-0 -translate-y-1/2 bg-gradient-to-l from-rose-500 to-pink-600 text-white px-4 py-8 rounded-l-lg shadow-lg hover:shadow-xl transition-all z-40 flex flex-col items-center gap-2 group hover:px-6"
        style={{ writingMode: 'vertical-rl' }}
      >
        <svg
          className="w-6 h-6 rotate-90"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="font-bold text-sm tracking-wider">CHAT WITH US</span>
      </button> */}
    </div>
  );
}
