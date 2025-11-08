import Image from "next/image";
import { Star, BadgeCheck } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Real Estate Investor",
    portfolio: "$850K Portfolio",
    review:
      "BrickVest transformed my investment strategy. I've seen consistent 12% returns and their analytics helped me avoid costly mistakes.",
    image: "",
  },
  {
    name: "Michael Rodriguez",
    role: "Portfolio Manager",
    portfolio: "$2.1M Portfolio",
    review:
      "The platform's due diligence and market insights are unmatched. I manage multiple properties with confidence using their tools.",
    image: "",
  },
  {
    name: "Jennifer Wang",
    role: "First-Time Investor",
    portfolio: "$320K Portfolio",
    review:
      "As a beginner, BrickVest's educational resources and guided investment process made real estate investing accessible and profitable.",
    image: "",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 px-6 md:px-20 bg-[#f9fafc] text-center">
      <span className="inline-flex items-center gap-2 px-4 py-1 mb-4 text-sm font-medium bg-green-100 text-green-700 rounded-md">
        <BadgeCheck className="w-4 h-4" />
        Success Stories
      </span>

      <h2 className="text-3xl md:text-4xl font-bold mb-2">
        What Our Investors Say
      </h2>
      <p className="text-gray-500 max-w-2xl mx-auto mb-10">
        Real stories from real investors who've built successful portfolios with
        BrickVest.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((item, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-2xl transition-transform duration-300 transform hover:scale-105 text-left hover:shadow-md"
          >
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, idx) => (
                <Star
                  key={idx}
                  className="text-yellow-400 w-4 h-4 fill-yellow-400"
                />
              ))}
            </div>
            <p className="text-gray-700 mb-4 leading-relaxed">
              “{item.review}”
            </p>
            <hr className="my-4" />
            <div className="flex items-center gap-4">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  width={50}
                  height={50}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                  {item.name.split(" ")[0][0]}
                </div>
              )}
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-gray-500">{item.role}</p>
                <p className="text-sm text-green-600">{item.portfolio}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
