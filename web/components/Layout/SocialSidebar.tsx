"use client";

import { usePathname } from "next/navigation";

interface SocialSidebarProps {
  settings?: any;
}

// Facebook SVG icon
const FacebookIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

// Instagram SVG icon
const InstagramIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

// WhatsApp SVG icon
const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

// X (Twitter) SVG icon
const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// Snapchat SVG icon
const SnapchatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.165-.57-1.856-.285-2.889-.689-3.13-1.273-.029-.074-.043-.149-.043-.225-.015-.254.15-.465.404-.509 3.266-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-.822-.313-1.227-.704-1.227-1.167 0-.36.269-.69.734-.84.149-.058.326-.088.509-.088.119 0 .298.015.464.104.391.18.749.284 1.048.3.193 0 .327-.044.402-.088-.009-.166-.019-.33-.03-.51l-.002-.06c-.105-1.628-.226-3.654.299-4.847C7.859 1.068 11.216.792 12.206.792z" />
  </svg>
);

// Email SVG icon
const EmailIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

export default function SocialSidebar({ settings }: SocialSidebarProps) {
  const pathname = usePathname();
  const isRtl = pathname?.startsWith("/ar");

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "facebook":
        return <FacebookIcon />;
      case "instagram":
        return <InstagramIcon />;
      case "whatsapp":
        return <WhatsAppIcon />;
      case "twitter":
      case "x":
        return <XIcon />;
      case "snapchat":
        return <SnapchatIcon />;
      case "email":
        return <EmailIcon />;
      default:
        return <FacebookIcon />;
    }
  };

  const defaultSocials = [
    { platform: "facebook", url: "#", _id: "1" },
    { platform: "instagram", url: "#", _id: "2" },
    { platform: "whatsapp", url: "#", _id: "3" },
  ];

  const socialLinks =
    settings?.socialLinks && settings.socialLinks.length > 0
      ? settings.socialLinks
      : defaultSocials;

  const getHoverColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "facebook":
        return "#1877F2"; // Facebook Blue
      case "instagram":
        return "#E4405F"; // Instagram Pink
      case "whatsapp":
        return "#25D366"; // WhatsApp Green
      case "twitter":
      case "x":
        return "#000000"; // X Black
      case "snapchat":
        return "#FFFC00"; // Snapchat Yellow
      case "email":
        return "#EA4335"; // Email Red
      default:
        return "#04524B"; // Genoun LLC Main Color
    }
  };

  return (
    <div
      className={`fixed ${
        isRtl ? "left-5" : "right-5"
      } top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-1`}
      style={{
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(20px) saturate(1.1)",
        WebkitBackdropFilter: "blur(20px) saturate(1.1)",
        border: "1px solid rgba(4, 82, 75, 0.15)",
        borderRadius: "18px",
        padding: "6px",
        boxShadow: `
          0 4px 20px 0 rgba(0, 0, 0, 0.15),
          0 2px 8px 0 rgba(0, 0, 0, 0.1),
          inset 0 1px 0px 0 rgba(255, 255, 255, 0.5)
        `,
      }}
    >
      {socialLinks.map((social: any, index: number) => {
        const hoverColor = getHoverColor(social.platform);

        return (
          <a
            key={social._id || index}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300"
            style={{
              background: "rgba(4, 82, 75, 0.08)",
              color: "#4B5563",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = hoverColor;
              e.currentTarget.style.transform = "scale(1.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(4, 82, 75, 0.08)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {/* Icon */}
            <div
              className="relative z-10 transition-all duration-300"
              style={{
                color: "#4B5563",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color =
                  social.platform.toLowerCase() === "snapchat"
                    ? "#000000"
                    : "#FFFFFF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#4B5563";
              }}
            >
              {getSocialIcon(social.platform)}
            </div>

            {/* Tooltip - RTL aware */}
            <div
              className={`absolute ${
                isRtl ? "left-full ml-2" : "right-full mr-2"
              } px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap`}
              style={{
                background: hoverColor,
                color:
                  social.platform.toLowerCase() === "snapchat"
                    ? "#000000"
                    : "white",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.3px",
              }}
            >
              {social.platform.charAt(0).toUpperCase() +
                social.platform.slice(1)}
            </div>
          </a>
        );
      })}
    </div>
  );
}
