import { CheckCircle } from "lucide-react";
import { Search, BarChart, Brain, GraduationCap, Network } from "lucide-react";

const features = [
  {
    icon: <Search className="text-white w-5 h-5" />,
    title: "Vetted Local Opportunities",
    description:
      "We help investors discover vetted real estate opportunities in their local market.",
    points: [
      "Thoroughly vetted properties",
      "Local market expertise",
      "Quality-focused listings",
      "Pre-screened investments",
    ],
  },
  {
    icon: <BarChart className="text-white w-5 h-5" />,
    title: "Market Insights & Data",
    description:
      "We provide insights on rental demand, income trends, and local market data.",
    points: [
      "Rental demand analysis",
      "Income trend tracking",
      "Market performance data",
      "Predictive analytics",
    ],
  },
  {
    icon: <Brain className="text-white w-5 h-5" />,
    title: "Smart Market Tracking",
    description:
      "We track market heat and help filter properties based on investor goals.",
    points: [
      "Market heat indicators",
      "Goal-based filtering",
      "Investment opportunity scoring",
      "Real-time market updates",
    ],
  },
  {
    icon: <GraduationCap className="text-white w-5 h-5" />,
    title: "Neighborhood Grading",
    description:
      "We rate neighbourhoods using A–D grades based on investment potential and risk.",
    points: [
      "A–D grading system",
      "Investment potential analysis",
      "Risk assessment",
      "Comparative neighborhood data",
    ],
  },
  {
    icon: <Network className="text-white w-5 h-5" />,
    title: "Professional Network",
    description:
      "We connect them with trusted mortgage agents, lenders, and real estate agents.",
    points: [
      "Verified mortgage agents",
      "Trusted lenders",
      "Professional real estate agents",
      "End-to-end support",
    ],
  },
];

export default function WhatWeDo() {
  return (
    <section className="w-full bg-gradient-to-b from-[#f5f6fa] to-white py-20 px-6 md:px-20">
      <div className="text-center mb-14">
        <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded-full">
          🔍 What We Do
        </span>
        <h2 className="text-3xl md:text-4xl font-bold mt-4">
          Your Complete Investment Partner
        </h2>
        <p className="text-gray-500 max-w-2xl mx-auto mt-2">
          From discovery to management, we provide everything you need to build
          a successful real estate investment portfolio.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-2xl hover:shadow-sm transition"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl mb-4 mx-auto">
              <div className="flex items-center justify-center w-full h-full">
                {feature.icon}
              </div>
            </div>

            <h3 className="text-lg justify-center flex items-center font-semibold mb-1">
              {feature.title}
            </h3>
            <p className="text-sm text-center text-gray-600 mb-4">
              {feature.description}
            </p>

            <ul className="space-y-1 text-sm">
              {feature.points.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
