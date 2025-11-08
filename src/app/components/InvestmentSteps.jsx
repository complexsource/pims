import { Lightbulb, User, Search, LineChart, BarChart3 } from "lucide-react";

const steps = [
  {
    icon: <User className="w-6 h-6 text-white" />,
    title: "Create Account",
    description:
      "Sign up and complete your investor profile to access exclusive investment opportunities.",
    step: "01",
  },
  {
    icon: <Search className="w-6 h-6 text-white" />,
    title: "Explore Properties",
    description:
      "Browse our curated selection of high-potential investment properties with detailed analytics.",
    step: "02",
  },
  {
    icon: <LineChart className="w-6 h-6 text-white" />,
    title: "Analyze & Invest",
    description:
      "Review investment projections and secure your property through our streamlined process.",
    step: "03",
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-white" />,
    title: "Manage Portfolio",
    description:
      "Track performance, collect returns, and reinvest to grow your real estate portfolio.",
    step: "04",
  },
];

export default function InvestmentSteps() {
  return (
    <section className="bg-[#f9fbfd] py-20 px-4 md:px-20 text-center">
      <div className="max-w-3xl mx-auto mb-12">
        <span className="inline-flex items-center gap-2 px-4 py-1 mb-4 text-sm font-medium bg-purple-100 text-purple-600 rounded-md">
          <Lightbulb className="w-4 h-4" />
          How It Works
        </span>

        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
          Start Your Investment Journey
        </h2>
        <p className="text-gray-500 mt-3">
          Our streamlined process makes real estate investing accessible,
          transparent, and profitable for investors of all levels.
        </p>
      </div>

      <div className="grid grid-cols-1  sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, i) => (
          <div
            key={i}
            className="relative bg-white rounded-2xl p-6 shadow-sm transition-transform duration-300 transform hover:scale-105  flex flex-col items-center text-center"
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-500 rounded-xl w-14 h-14 flex items-center justify-center mb-4">
              {step.icon}
            </div>
            <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {step.step}
            </div>
            <h3 className="font-semibold text-lg mb-2 text-gray-900">
              {step.title}
            </h3>
            <p className="text-sm text-gray-500">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <button className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-6 py-3 rounded-lg shadow-md transition">
          Get Started Now →
        </button>
      </div>
    </section>
  );
}
