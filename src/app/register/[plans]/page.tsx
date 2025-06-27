// Remove "use client" directive
import RegisterPage from "@/app/register/register";
import { pricingPlans } from "@/config/pricing";

interface RegisterPageProps {
  params: Promise<{
    plans: string;
  }>;
}

// This tells Next.js which paths to generate at build time
export function generateStaticParams() {
  return pricingPlans.map((plan) => ({
    plans: plan.name.toLowerCase(),
  }));
}

// Server component that renders the client component
export default async function Page({ params }: RegisterPageProps) {
  const resolvedParams = await params;
  const { plans } = resolvedParams;

  return <RegisterPage plans={plans} />;
}
