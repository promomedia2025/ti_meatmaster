"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function AutoSelect() {
  const params = useSearchParams();
  const selected = params.get("select");

  useEffect(() => {
    console.log("AutoSelect fired, param:", selected);

    if (!selected) return;

    // Find the element by menu_id
    const el = document.getElementById(selected);
    console.log("Found element:", el);

    if (!el) return;

    // Scroll
    el.scrollIntoView({ behavior: "smooth", block: "center" });

    // Auto-click
    el.click();
  }, [selected]);

  return null;
}
