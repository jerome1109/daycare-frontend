"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";

interface PaymentResponse {
  success: boolean;
  message: string;
  data?: {
    paymentId: string;
    status: string;
    transactionId: string;
    paymentMethod: string;
    amount: string;
  };
}

function PaymentReturnContent() {
  const { token, makeAuthenticatedRequest } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get payment details from URL parameters
        const token = searchParams.get("token");
        const PayerID = searchParams.get("PayerID");
        const paymentId = searchParams.get("paymentId");
        const paymentMethod = searchParams.get("paymentMethod");

        if (!token || !paymentMethod) {
          throw new Error("Missing required payment parameters");
        }

        console.log("Verifying payment with params:", {
          token,
          PayerID,
          paymentMethod,
        });

        // Call the verification endpoint
        const response = (await makeAuthenticatedRequest(
          `/subscription/payment/return?token=${token}&PayerID=${PayerID}&paymentMethod=${paymentMethod}&paymentId=${paymentId}`,
          {
            method: "GET",
          }
        )) as PaymentResponse;

        console.log("Payment verification response:", response);

        // Check if response is successful
        if (response?.success) {
          // Navigate to success page with payment details
          router.push(
            `/parent/payment/success?transactionId=${token}&paymentMethod=${paymentMethod}`
          );
        } else {
          // If response is not successful, throw error with message
          throw new Error(response?.message || "Payment verification failed");
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        // Navigate to error page with error message
        router.push(
          `/parent/payment/error?error=${encodeURIComponent(
            error instanceof Error ? error.message : "Failed to verify payment"
          )}`
        );
      }
    };

    if (token) {
      verifyPayment();
    }
  }, [token, searchParams, makeAuthenticatedRequest, router]);

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Processing Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-gray-600">Processing your payment...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentReturnPage() {
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
      <PaymentReturnContent />
    </Suspense>
  );
}
