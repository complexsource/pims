import React from "react";
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Navigation,
} from "lucide-react";
import logo from "@/public/logo.png";
import Image from "next/image";
const Footer = () => {
  return (
    <footer className="relative bg-gray-50 py-16 px-6 overflow-hidden">
      <div className="absolute -top-42 left-62 w-96 h-96 bg-purple-300 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute top-42 right-62 w-96 h-96 bg-blue-300 rounded-full blur-3xl opacity-30"></div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-1">
            <div className="text-2xl font-semibold tracking-tight text-gray-900">
              <span className="inline-flex items-center gap-2">
                <Image src={logo} width={32} height={32} alt="Brikvest Logo" />
                <span className="">
                  <span className="font-extrabold text-black">BRIK</span>VEST
                </span>
              </span>
            </div>

            <p className="text-gray-600 mb-8 text-sm leading-relaxed">
              Discover your dream home with BrickVest. We provide cutting-edge
              technology, expert guidance, and personalized service to make your
              real estate journey seamless and successful.
            </p>

            <div className="flex items-center space-x-8 mb-8">
              <div className="text-center">
                <div className="flex items-center mb-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-600">Properties Sold</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">50,000+</div>
              </div>

              <div className="text-center">
                <div className="flex items-center mb-2">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-600">Happy Clients</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">25,000+</div>
              </div>
            </div>

            <div className="flex space-x-3">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                <div className="w-3 h-3 bg-blue-600 rounded-sm mr-2"></div>
                MLS Certified
              </span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
                Licensed
              </span>
            </div>
          </div>

          {/* Explore Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Explore
            </h3>
            <ul className="space-y-4">
              <li>
                <div className="flex items-center justify-between group cursor-pointer">
                  <div>
                    <div className="text-gray-900 font-medium group-hover:text-blue-600">
                      Buy a Home
                    </div>
                    <div className="text-sm text-gray-500">
                      Search properties for sale
                    </div>
                  </div>
                  <div className="text-gray-400 group-hover:text-blue-600">
                    →
                  </div>
                </div>
              </li>

              <li>
                <div className="flex items-center justify-between group cursor-pointer">
                  <div>
                    <div className="text-gray-900 font-medium group-hover:text-blue-600">
                      Sell Your Home
                    </div>
                    <div className="text-sm text-gray-500">
                      Get a free home valuation
                    </div>
                  </div>
                  <div className="text-gray-400 group-hover:text-blue-600">
                    →
                  </div>
                </div>
              </li>

              <li>
                <div className="flex items-center justify-between group cursor-pointer">
                  <div>
                    <div className="text-gray-900 font-medium group-hover:text-blue-600">
                      Rent Properties
                    </div>
                    <div className="text-sm text-gray-500">
                      Find rental homes
                    </div>
                  </div>
                  <div className="text-gray-400 group-hover:text-blue-600">
                    →
                  </div>
                </div>
              </li>

              <li>
                <div className="flex items-center justify-between group cursor-pointer">
                  <div>
                    <div className="text-gray-900 font-medium group-hover:text-blue-600">
                      Find an Agent
                    </div>
                    <div className="text-sm text-gray-500">
                      Connect with local experts
                    </div>
                  </div>
                  <div className="text-gray-400 group-hover:text-blue-600">
                    →
                  </div>
                </div>
              </li>

              <li>
                <div className="flex items-center justify-between group cursor-pointer">
                  <div>
                    <div className="text-gray-900 font-medium group-hover:text-blue-600">
                      Property Management
                    </div>
                    <div className="text-sm text-gray-500">
                      Full-service management
                    </div>
                  </div>
                  <div className="text-gray-400 group-hover:text-blue-600">
                    →
                  </div>
                </div>
              </li>

              <li>
                <div className="flex items-center justify-between group cursor-pointer">
                  <div>
                    <div className="text-gray-900 font-medium group-hover:text-blue-600">
                      Investment Properties
                    </div>
                    <div className="text-sm text-gray-500">
                      Build your portfolio
                    </div>
                  </div>
                  <div className="text-gray-400 group-hover:text-blue-600">
                    →
                  </div>
                </div>
              </li>
            </ul>
          </div>

          {/* Company & Resources Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Company
            </h3>
            <ul className="space-y-3 mb-8">
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600">
                  About BrickVest
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600">
                  Press & Media
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600">
                  Investor Relations
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600">
                  Awards & Recognition
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600">
                  Partner with Us
                </a>
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600">
                  Market Reports
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600">
                  Buying Guide
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600">
                  Selling Guide
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600">
                  Mortgage Calculator
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600">
                  Home Value Estimator
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600">
                  Neighborhood Explorer
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Newsletter Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Contact Us
            </h3>

            <div className="space-y-4 mb-8">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Phone className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Call Us
                  </div>
                  <div className="text-sm text-gray-600">(555) 123-4567</div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Mail className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Email Us
                  </div>
                  <div className="text-sm text-gray-600">
                    hello@brikvest.com
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <MapPin className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Visit Us
                  </div>
                  <div className="text-sm text-gray-600">
                    123 Real Estate Blvd, LA
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8 bg-gradient-to-b from-blue-50 to-white border border-purple-100 rounded-2xl p-5">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Stay Updated
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Get the latest market insights, new listings, and exclusive
                offers.
              </p>

              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 border bg-white border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  aria-label="Subscribe"
                >
                  <Navigation className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                By subscribing, you agree to our Privacy Policy and consent to
                receive updates.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Follow Us
              </h4>
              <div className="flex space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                  <Facebook className="w-5 h-5 text-white" />
                </div>
                <div className="w-10 h-10 bg-blue-400 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-500 transition-colors">
                  <Twitter className="w-5 h-5 text-white" />
                </div>
                <div className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-pink-700 transition-colors">
                  <Instagram className="w-5 h-5 text-white" />
                </div>
                <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-800 transition-colors">
                  <Linkedin className="w-5 h-5 text-white" />
                </div>
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-red-700 transition-colors">
                  <Youtube className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Bottom Gray Bar */}
      <div className="absolute bottom-0 left-0 w-full border-t border-gray-200 bg-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between py-4 px-6 text-xs text-gray-500">
          <span>© 2025 BrickVest. All rights reserved.</span>
          <div className="flex space-x-4 mt-2 md:mt-0">
            <a href="#" className="hover:text-gray-700">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-gray-700">
              Terms of Service
            </a>
            <a href="#" className="hover:text-gray-700">
              Cookie Policy
            </a>
            <a href="#" className="hover:text-gray-700">
              Accessibility
            </a>
          </div>
          <div className="flex items-center space-x-4 mt-2 md:mt-0">
            <span className="flex items-center gap-1">
              <svg
                className="w-3 h-3 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <circle cx="10" cy="10" r="10" />
              </svg>
              Available in 50+ Cities
            </span>
            <span className="flex items-center gap-1">
              <svg
                className="w-3 h-3 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <circle cx="10" cy="10" r="10" />
              </svg>
              SSL Secured
            </span>
            <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px] font-medium">
              MLS® Licensed
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
