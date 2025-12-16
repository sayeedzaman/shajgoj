'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Hero slider images - placeholder data
  const heroSlides = [
    { id: 1, image: '/banners/slide1.jpg', alt: 'Vaseline Promotion' },
    { id: 2, image: '/banners/slide2.jpg', alt: 'Himalaya Wellness' },
    { id: 3, image: '/banners/slide3.jpg', alt: 'Nivea Collection' },
    { id: 4, image: '/banners/slide4.jpg', alt: 'Beauty Essentials' },
    { id: 5, image: '/banners/slide5.jpg', alt: 'Skincare Sale' },
    { id: 6, image: '/banners/slide6.jpg', alt: 'Makeup Must-Haves' },
    { id: 7, image: '/banners/slide7.jpg', alt: 'Haircare Specials' },
  ];

  // Auto-slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  // Deals section data
  const dealsCategories = [
    { title: 'PSP', image: '/deals/psp.jpg', link: '/deals/psp' },
    { title: 'Marico Fiera', image: '/deals/marico.jpg', link: '/deals/marico' },
    { title: 'Square Deals', image: '/deals/square.jpg', link: '/deals/square' },
    { title: 'Hot Picks', image: '/deals/hot-picks.jpg', link: '/deals/hot-picks' },
  ];

  // Top brands data
  const topBrands = [
    { title: 'Brand Offer 1', image: '/brands/brand1.gif', link: '/brands/1' },
    { title: 'Brand Offer 2', image: '/brands/brand2.gif', link: '/brands/2' },
    { title: 'Brand Offer 3', image: '/brands/brand3.gif', link: '/brands/3' },
  ];

  // Limited time offers
  const limitedOffers = [
    { title: 'Buy 1 Get 1', image: '/offers/bogo.jpg', link: '/offers/bogo' },
    { title: 'Combo Bundles', image: '/offers/combo.jpg', link: '/offers/combo' },
    { title: 'Special Offers', image: '/offers/special.jpg', link: '/offers/special' },
    { title: 'Clearance Sale', image: '/offers/clearance.jpg', link: '/offers/clearance' },
  ];

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
    { name: 'Acne', link: '/concern/acne' },
    { name: 'Anti-Aging', link: '/concern/anti-aging' },
    { name: 'Dandruff', link: '/concern/dandruff' },
    { name: 'Dry Skin', link: '/concern/dry-skin' },
    { name: 'Hair Fall', link: '/concern/hair-fall' },
    { name: 'Oil Control', link: '/concern/oil-control' },
    { name: 'Pore Care', link: '/concern/pore-care' },
    { name: 'Hyperpigmentation', link: '/concern/hyperpigmentation' },
    { name: 'Hair Thinning', link: '/concern/hair-thinning' },
    { name: 'Sun Protection', link: '/concern/sun-protection' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Carousel Section */}
      <section className="relative w-full max-w-7xl mx-auto px-4 py-6">
        <div className="relative aspect-16/6 md:aspect-21/6 bg-gray-100 rounded-lg overflow-hidden">
          {/* Carousel Images */}
          <div className="relative w-full h-full">
            {heroSlides.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className="w-full h-full bg-linear-to-r from-red-100 to-purple-100 flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2">{slide.alt}</h2>
                    <p className="text-gray-600">Special promotional banner {index + 1}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 text-gray-800" />
          </button>

          {/* Slide Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide ? 'bg-red-500 w-6' : 'bg-white/60'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Deals You Cannot Miss */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
          Deals You Cannot Miss
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {dealsCategories.map((deal, index) => (
            <Link
              key={index}
              href={deal.link}
              className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="absolute inset-0 bg-linear-to-br from-red-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg md:text-xl font-bold text-gray-800">{deal.title}</h3>
                  <p className="text-sm text-gray-600 mt-2">Special Offers</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity"></div>
            </Link>
          ))}
        </div>
      </section>

      {/* Top Brands & Offers */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
          Top Brands & Offers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topBrands.map((brand, index) => (
            <Link
              key={index}
              href={brand.link}
              className="group relative aspect-4/3 bg-gray-100 rounded-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="absolute inset-0 bg-linear-to-br from-blue-50 to-pink-50 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-800">{brand.title}</h3>
                  <p className="text-sm text-gray-600 mt-2">Exclusive Brand Deals</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity"></div>
            </Link>
          ))}
        </div>
      </section>

      {/* Limited Time Offers */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
          Limited Time Offers
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {limitedOffers.map((offer, index) => (
            <Link
              key={index}
              href={offer.link}
              className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="absolute inset-0 bg-linear-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
                <div className="text-center px-4">
                  <h3 className="text-lg md:text-xl font-bold text-gray-800">{offer.title}</h3>
                  <p className="text-sm text-red-600 font-semibold mt-2">Hurry! Limited Stock</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity"></div>
            </Link>
          ))}
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
              className="group p-6 bg-linear-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-red-300 hover:shadow-lg transition-all text-center"
            >
              <h3 className="text-base font-semibold text-gray-800 group-hover:text-red-500 transition-colors">
                {concern.name}
              </h3>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
