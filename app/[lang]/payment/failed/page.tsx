"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PaymentFailedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const orderId = searchParams.get("orderId");
  const reason = searchParams.get("reason");
  
  // Extract language from pathname
  const lang = pathname.split("/")[1] || "el";

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-lg p-8 text-center">
        <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-white mb-4">
          Η πληρωμή απέτυχε
        </h1>
        <p className="text-gray-400 mb-6">
          Δυστυχώς, η πληρωμή δεν μπόρεσε να ολοκληρωθεί.
        </p>

        {reason && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400 mb-1">Αιτία</p>
            <p className="text-sm text-white">{reason}</p>
          </div>
        )}

        <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm text-yellow-200 font-semibold mb-1">
                Τι μπορείτε να κάνετε:
              </p>
              <ul className="text-xs text-yellow-300 space-y-1 list-disc list-inside">
                <li>Ελέγξτε τα στοιχεία της κάρτας σας</li>
                <li>Ελέγξτε ότι έχετε επαρκή διαθέσιμο υπόλοιπο</li>
                <li>Δοκιμάστε με άλλη κάρτα</li>
                <li>Επικοινωνήστε με την τράπεζά σας</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {orderId && (
            <Link href={`/${lang}/order/${orderId}`}>
              <Button variant="outline" className="w-full">
                Προβολή Παραγγελίας
              </Button>
            </Link>
          )}
          <Link href={`/${lang}/checkout`}>
            <Button className="w-full bg-primary hover:bg-primary/90">
              Δοκιμή Ξανά
            </Button>
          </Link>
          <Link href={`/${lang}`}>
            <Button variant="outline" className="w-full">
              Επιστροφή στην Αρχική
            </Button>
          </Link>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Αν το πρόβλημα συνεχίζεται, παρακαλώ επικοινωνήστε με την εξυπηρέτηση πελατών.
        </p>
      </div>
    </div>
  );
}

