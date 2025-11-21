"use client";

import { Utensils, Store, Sparkles } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();

  // Extract language from pathname (e.g., /en/Discovery -> "en")
  const lang = pathname.split("/")[1] || "el";



}
