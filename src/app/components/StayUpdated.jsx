import React from 'react';

const StayUpdated = () => {
  return (
    <section className="bg-[#080136] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left Side - Text */}
        <div className="max-w-xl">
          <h2 className="text-white text-lg font-semibold mb-1">
            Stay Ahead of the Market
          </h2>
          <p className="text-gray-300 text-sm">
            Get weekly market insights, new property alerts, and exclusive investment opportunities delivered straight to your inbox.
          </p>
        </div>

        {/* Right Side - Input and Button */}
        <div className="flex flex-col sm:flex-row items-stretch w-full sm:w-auto gap-3 sm:gap-2">
          <input
            type="email"
            placeholder="Enter your email address"
            className="rounded-md px-4 py-2 w-full bg-white sm:w-80 focus:outline-none text-sm"
          />
          <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold px-6 py-2 rounded-md hover:scale-105 transition-transform duration-200">
            Subscribe →
          </button>
        </div>
      </div>
    </section>
  );
};

export default StayUpdated;
