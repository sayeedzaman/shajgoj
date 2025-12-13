'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Truck, RotateCcw, Lock, Star } from 'lucide-react';

export default function Home() {
  const categories = [
    { name: 'Makeup', href: '/category/makeup', color: 'from-red-400 to-red-600' },
    { name: 'Skin Care', href: '/category/skin', color: 'from-purple-400 to-purple-600' },
    { name: 'Hair Care', href: '/category/hair', color: 'from-blue-400 to-blue-600' },
    { name: 'Personal Care', href: '/category/personal-care', color: 'from-indigo-400 to-indigo-600' },
  ];

  const features = [
    {
      icon: <ShoppingBag className="h-8 w-8" />,
      title: 'Authentic Products',
      description: '100% genuine beauty products from trusted brands',
    },
    {
      icon: <Truck className="h-8 w-8" />,
      title: 'Fast Delivery',
      description: 'Quick delivery across Bangladesh',
    },
    {
      icon: <RotateCcw className="h-8 w-8" />,
      title: 'Easy Returns',
      description: 'Hassle-free returns within 7 days',
    },
    {
      icon: <Lock className="h-8 w-8" />,
      title: 'Secure Payment',
      description: 'Safe and secure payment options',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative gradient-bg py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                Discover Your
                <span className="gradient-text block">Beauty Essentials</span>
              </h1>
              <p className="text-xl text-gray-600">
                Shop authentic beauty products with confidence. Fast delivery, easy returns, and secure payments.
              </p>

            </div>
            <div className="relative h-[400px] animate-slide-in-right">
              <div className="absolute inset-0 bg-gradient-to-br from-red-200/50 to-purple-200/50 rounded-3xl blur-3xl"></div>
              <div className="relative h-full flex items-center justify-center">
                <div className="w-80 h-80 bg-white rounded-full shadow-2xl flex items-center justify-center">
                  <ShoppingBag className="h-32 w-32 text-red-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-xl hover:shadow-xl transition-shadow duration-300 border border-gray-100"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-100 to-purple-100 rounded-full text-red-500 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Shop by Category</h2>
            <p className="text-gray-600">Explore our wide range of beauty products</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <Link
                key={index}
                href={category.href}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <div className={`h-64 bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                  <h3 className="text-2xl font-bold text-white">{category.name}</h3>
                </div>
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Featured Products</h2>
            <p className="text-gray-600">Our handpicked selection of trending items</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 group"
              >
                <div className="aspect-square bg-gradient-to-br from-red-100 to-purple-100 flex items-center justify-center relative overflow-hidden">
                  <ShoppingBag className="h-20 w-20 text-red-300 group-hover:scale-110 transition-transform duration-300" />
                  <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    -20%
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2 text-gray-900">Product Name</h3>
                  <div className="flex items-center mb-2">
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 ml-2">(125)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-gray-900">৳800</span>
                      <span className="text-sm text-gray-400 line-through ml-2">৳1000</span>
                    </div>
                    <button className="px-4 py-2 bg-gradient-to-r from-red-500 to-purple-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all duration-200">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/products"
              className="inline-block px-8 py-3 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-800 transition-colors duration-200"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-red-500 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Stay Updated</h2>
          <p className="text-lg mb-8 opacity-90">
            Subscribe to our newsletter for exclusive deals and beauty tips
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-3 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button className="px-8 py-3 bg-white text-red-600 rounded-full font-semibold hover:bg-gray-100 transition-colors duration-200">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}