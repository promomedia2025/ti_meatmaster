"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PiraeusBankAuthorizePage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const successFlag = searchParams.get("successflag");
  
  // Extract language from pathname
  const lang = pathname.split("/")[1] || "el";
  
  const isSuccess = successFlag?.toLowerCase() === "success";
  const isFailure = successFlag?.toLowerCase() === "failure";

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-lg p-8 text-center">
        {isSuccess ? (
          <>
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-4">
              Η πληρωμή ολοκληρώθηκε επιτυχώς!
            </h1>
            <p className="text-gray-400 mb-6">
              Η πληρωμή σας έχει επιβεβαιωθεί με επιτυχία.
            </p>
          </>
        ) : isFailure ? (
          <>
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-4">
              Η πληρωμή απέτυχε
            </h1>
            <p className="text-gray-400 mb-6">
              Δυστυχώς, η πληρωμή δεν μπόρεσε να ολοκληρωθεί.
            </p>
          </>
        ) : (
          <>
            <XCircle className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-4">
              Άγνωστη κατάσταση
            </h1>
            <p className="text-gray-400 mb-6">
              Δεν ήταν δυνατή η επεξεργασία της κατάστασης πληρωμής.
            </p>
          </>
        )}

        <div className="space-y-3">
          <Link href={`/${lang}`}>
            <Button className="w-full bg-primary hover:bg-primary/90">
              Επιστροφή στην Αρχική
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
