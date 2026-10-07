"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/utils/pwa/pushManager";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      registerServiceWorker().catch((err) => {
        console.warn("Service Worker auto-registration ignored:", err);
      });
    }
  }, []);

  return null;
}
