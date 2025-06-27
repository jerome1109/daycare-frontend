"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

function PaymentErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");

  const handleReturnToPayments = () => {
    router.push("/parent/children/info");
  };

  const handleTryAgain = () => {
    router.back();
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-6 w-6 text-red-500" />
            Payment Failed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-gray-600">
              We were unable to process your payment.
            </p>
            {error && (
              <div className="rounded-lg bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <p className="text-sm text-gray-500">
              Please try again or contact support if the issue persists.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleTryAgain}
              className="flex-1"
            >
              Try Again
            </Button>
            <Button onClick={handleReturnToPayments} className="flex-1">
              Return to Payments
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <PaymentErrorContent />
    </Suspense>
  );
}
