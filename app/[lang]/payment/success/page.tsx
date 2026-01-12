"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const orderId = searchParams.get("orderId");
  const transactionId = searchParams.get("transactionId");
  
  // Extract language from pathname
  const lang = pathname.split("/")[1] || "el";

  useEffect(() => {
    // Simulate loading to ensure payment status is updated
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 rounded-lg p-8 text-center">
          <Skeleton className="h-20 w-20 mx-auto mb-6 rounded-full" />
          <Skeleton className="h-8 w-3/4 mx-auto mb-4" />
          <Skeleton className="h-4 w-full mb-6" />
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <Skeleton className="h-3 w-32 mx-auto mb-1" />
            <Skeleton className="h-6 w-24 mx-auto" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-3 w-48 mx-auto mt-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-lg p-8 text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-white mb-4">
          Η πληρωμή ολοκληρώθηκε επιτυχώς!
        </h1>
        <p className="text-gray-400 mb-6">
          Η παραγγελία σας έχει υποβληθεί και η πληρωμή έχει επιβεβαιωθεί.
        </p>
        
        {orderId && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400 mb-1">Αριθμός Παραγγελίας</p>
            <p className="text-lg font-semibold text-white">#{orderId}</p>
          </div>
        )}

        {transactionId && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400 mb-1">Αριθμός Συναλλαγής</p>
            <p className="text-sm text-white font-mono">{transactionId}</p>
          </div>
        )}

        <div className="space-y-3">
          {orderId && (
            <Link href={`/${lang}/order/${orderId}`}>
              <Button className="w-full bg-primary hover:bg-primary/90">
                Προβολή Παραγγελίας
              </Button>
            </Link>
          )}
          <Link href={`/${lang}`}>
            <Button variant="outline" className="w-full">
              Επιστροφή στην Αρχική
            </Button>
          </Link>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Θα λάβετε email επιβεβαίωσης για την παραγγελία σας.
        </p>
      </div>
    </div>
  );
}

