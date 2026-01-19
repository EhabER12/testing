"use client";

import { useEffect, useState } from "react";

export interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  _id: string;
}

export interface HeroButton {
  text: string;
  url: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  _id?: string;
}


export interface SocialLink {
  platform: string;
  url: string;
  _id?: string;
}


export interface Settings {
  siteName: string;
  siteDescription: string;
  logo: string;
  favicon: string;
  socialLinks: SocialLink[];
  contactEmail: string;
  contactPhone: string;
  whatsappNumber?: string;
  address: string;
}

// Default settings
const defaultSettings: Settings = {
  siteName: "Travemia Tours",
  siteDescription: "Your next adventure starts here",
  logo: "",
  favicon: "",
  socialLinks: [],
  contactEmail: "",
  contactPhone: "",
  address: "",
};

/**
 * Hook to access website settings in client components
 */
export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.__SETTINGS__) {
      setSettings(window.__SETTINGS__ as Settings);
    }
    setLoaded(true);
  }, []);

  return { settings, loaded };
};

declare global {
  interface Window {
    __SETTINGS__: any;
  }
}
