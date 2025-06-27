"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { pricingPlans } from "@/config/pricing";

export default function PlansPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-sky-100/20 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-600 to-sky-400 bg-clip-text text-transparent mb-4">
            Choose Your Plan
          </h1>
          <p className="text-sky-600/60 max-w-2xl mx-auto">
            Select the plan that best fits your daycare&apos;s needs. All plans
            include our core features with the ability to upgrade as you grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl bg-white shadow-xl border ${
                plan.isPopular
                  ? "border-sky-400 scale-105"
                  : "border-sky-100 hover:scale-105"
              } transition-transform duration-300`}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-0 right-0 mx-auto w-fit px-3 py-1 bg-sky-500 text-white text-sm rounded-full">
                  Most Popular
                </div>
              )}

              <div className="p-8">
                <h3 className="text-xl font-semibold text-sky-900 mb-2">
                  {plan.name}
                </h3>
                {plan.name == "Enterprise" ? (
                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-bold text-sky-700">
                      Email Us
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-bold text-sky-700">
                      ${plan.price}
                    </span>
                    <span className="text-sky-600/60 ml-2">/month</span>
                  </div>
                )}
                <p className="text-sky-600/80 mb-6">
                  {plan.description} <strong>{plan.email}</strong>
                </p>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center">
                      <Check className="h-5 w-5 text-sky-500 mr-2" />
                      <span className="text-sky-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => router.push(plan.cta.href)}
                  className={`w-full ${
                    plan.isPopular
                      ? "bg-sky-600 hover:bg-sky-900"
                      : "bg-sky-100 text-sky-700 hover:bg-sky-200"
                  }`}
                >
                  {plan.cta.text}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
