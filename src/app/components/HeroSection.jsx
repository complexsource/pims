// components/HeroSection.jsx
import Image from "next/image";
import Link from "next/link";
import house from "@/public/house.png";
import {
  ArrowRight,
  PlayCircle,
  Building2,
  DollarSign,
  Users,
  TrendingUp,
} from "lucide-react";

export default function HeroSection() {
  return (
    <section className="w-full  bg-[#F8FAFC80]  px-8 md:px-20 py-16 flex flex-col md:flex-row items-center justify-between gap-10">
      {/* Left Text */}
      <div className="w-full md:w-1/2 space-y-6">
        <span className="inline-block px-3 py-2 text-sm font-medium bg-blue-100 text-blue-700 rounded-md">
          #1 Real Estate Investment Platform
        </span>

        <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
          Invest in Premium <br />
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            Real Estate
          </span>{" "}
          <br />
          with Confidence
        </h1>

        <p className="text-gray-600 text-base max-w-xl">
          Discover high-yield investment properties with our AI-powered
          platform. Get expert insights, comprehensive analytics, and secure
          transactions for your real estate portfolio.
        </p>

        <div className="flex gap-4 flex-wrap pt-2">
          {/* Gradient Button */}
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-semibold shadow-md">
            Start Investing Today
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Outline Button */}
          <Link
            href={"/properties"}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-100"
          >
            <PlayCircle className="w-4 h-4" />
            Explore Properties
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-10">
          <div className="text-center">
            <Building2 className="w-6 h-6 mx-auto text-blue-600" />
            <p className="text-lg font-semibold">15,000+</p>
            <p className="text-xs text-gray-500">Properties Listed</p>
          </div>
          <div className="text-center">
            <DollarSign className="w-6 h-6 mx-auto text-blue-600" />
            <p className="text-lg font-semibold">$2.5B+</p>
            <p className="text-xs text-gray-500">Total Investment Volume</p>
          </div>
          <div className="text-center">
            <Users className="w-6 h-6 mx-auto text-blue-600" />
            <p className="text-lg font-semibold">12,000+</p>
            <p className="text-xs text-gray-500">Active Investors</p>
          </div>
          <div className="text-center">
            <TrendingUp className="w-6 h-6 mx-auto text-blue-600" />
            <p className="text-lg font-semibold">8.5%</p>
            <p className="text-xs text-gray-500">Average Annual Returns</p>
          </div>
        </div>
      </div>
      {/* Right Image */}
      <div className="w-full md:w-1/2 flex justify-center relative overflow-visible">
        <div className="relative w-[440px] h-[400px] rounded-2xl overflow-visible shadow-xl bg-white">
          {/* Image */}
          <Image
            src={house}
            alt="House"
            fill
            className="object-cover rounded-2xl"
          />

          {/* Top-right growth icon */}
          <div className="absolute -top-4 -right-4 bg-white/70 backdrop-blur-md rounded-md p-2 shadow-md z-10">
            <TrendingUp className="text-green-500 w-4 h-4" />
          </div>

          {/* Bottom metrics bar */}
          <div className="absolute bottom-2 left-2 right-2 bg-white/80 backdrop-blur-md text-gray-900 text-sm flex justify-between py-3 px-4 rounded-xl shadow-md">
            <div className="text-center">
              <p className="text-base font-semibold">$1.2M</p>
              <p className="text-xs text-gray-600">Property Value</p>
            </div>
            <div className="text-center">
              <p className="text-green-600 font-semibold">+15.2%</p>
              <p className="text-xs text-gray-600">Annual ROI</p>
            </div>
            <div className="text-center">
              <p className="text-blue-600 font-semibold">$8.5K</p>
              <p className="text-xs text-gray-600">Monthly Rent</p>
            </div>
          </div>

          {/* Bottom-left security icon (floating out) */}
          <div className="absolute -bottom-3 -left-3 bg-white/70 backdrop-blur-md rounded-md p-2 shadow-md z-10">
            <svg
              className="w-5 h-5 text-blue-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2l7 4v6c0 5-3.5 9.74-7 11-3.5-1.26-7-6-7-11V6l7-4z"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
