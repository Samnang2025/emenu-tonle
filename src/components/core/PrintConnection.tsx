"use client";
import { useEffect } from "react";
import { connectWS } from "@/helper/directPrint";
import axios from "axios";

// Configure global client-side axios interceptor to bypass CORS using Next.js Rewrites
if (typeof window !== "undefined") {
  axios.interceptors.request.use(
    (config) => {
      if (config.url && config.url.includes(".tsdsolution.net/api/")) {
        // e.g., https://tonle.tsdsolution.net/api/DriverController/setting
        // -> /api/proxy/tonle/DriverController/setting
        const match = config.url.match(/https:\/\/([^.]+)\.tsdsolution\.net\/api\/(.+)/);
        if (match) {
          const projectName = match[1];
          const path = match[2];
          config.url = `/api/proxy/${projectName}/${path}`;
          console.log(`[AxiosProxy] Rewrote request to: ${config.url}`);
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
}

export default function PrintConnection() {
  useEffect(() => {
    connectWS();
  }, []);

  return null;
}
