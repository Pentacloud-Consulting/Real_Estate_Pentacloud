"use client";

import React from "react";

interface ChannelLogoProps {
  id: string;
  name: string;
  size?: "sm" | "md" | "lg";
}

export function ChannelLogo({ id, name, size = "md" }: ChannelLogoProps) {
  const sizeClasses =
    size === "sm"
      ? "w-8 h-8 rounded-lg p-1.5"
      : size === "lg"
      ? "w-12 h-12 rounded-2xl p-2"
      : "w-10 h-10 rounded-xl p-1.5";

  switch (id) {
    case "meta":
      return (
        <div
          className={`${sizeClasses} bg-white border border-blue-100 shadow-xs flex items-center justify-center shrink-0`}
          title={name}
        >
          {/* Official Meta Infinity Logo */}
          <svg viewBox="0 0 36 24" className="w-full h-full" fill="none" aria-label="Meta">
            <defs>
              <linearGradient id="metaGrad1" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#0064E0" />
                <stop offset="50%" stopColor="#0081FB" />
                <stop offset="100%" stopColor="#0064E0" />
              </linearGradient>
            </defs>
            <path
              d="M10.2 3.2C6.4 3.2 3.2 6.8 3.2 12c0 5.2 3 8.8 6.8 8.8 2.9 0 4.9-1.9 7.6-6.2l1.6-2.6c2.6-4.2 4.9-8.8 8.6-8.8 3.9 0 7 3.7 7 8.8 0 5.2-3.1 8.8-7 8.8-3 0-5.1-2-7.5-6l-1.4-2.3"
              stroke="url(#metaGrad1)"
              strokeWidth="3.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10.2 3.2c3.5 0 5.6 3.5 8.2 7.8l1.6 2.7c2.4 4.1 4.4 7.1 7.8 7.1"
              stroke="#0081FB"
              strokeWidth="3.6"
              strokeLinecap="round"
            />
          </svg>
        </div>
      );

    case "instagram":
      return (
        <div
          className={`${sizeClasses} shadow-xs flex items-center justify-center shrink-0 overflow-hidden`}
          style={{
            background:
              "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)",
          }}
          title={name}
        >
          {/* Official Instagram Camera Glyph */}
          <svg viewBox="0 0 24 24" className="w-full h-full text-white" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Instagram">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" stroke="none" />
          </svg>
        </div>
      );

    case "tiktok":
      return (
        <div
          className={`${sizeClasses} bg-black shadow-xs flex items-center justify-center shrink-0`}
          title={name}
        >
          {/* Official TikTok Musical Note Logo */}
          <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" aria-label="TikTok">
            <path
              d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"
              fill="#25F4EE"
              transform="translate(-0.7, -0.5)"
            />
            <path
              d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"
              fill="#FE2C55"
              transform="translate(0.7, 0.5)"
            />
            <path
              d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
      );

    case "whatzupp":
      return (
        <div
          className={`${sizeClasses} shadow-xs flex items-center justify-center shrink-0`}
          style={{
            background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
          }}
          title={name}
        >
          {/* Official WhatzUpp Chat + Lightning Emblem */}
          <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" aria-label="WhatzUpp">
            <path
              d="M12 2.5C6.75 2.5 2.5 6.53 2.5 11.5c0 1.98.68 3.81 1.83 5.29L3.1 21.2l4.6-1.21a9.8 9.8 0 0 0 4.3.99c5.25 0 9.5-4.03 9.5-9s-4.25-9.48-9.5-9.48z"
              fill="#FFFFFF"
            />
            <path
              d="M8.3 8.8l1.4 5.4 1.6-3.4 1.6 3.4 1.4-5.4"
              stroke="#128C7E"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );

    case "dubizzle":
      return (
        <div
          className={`${sizeClasses} bg-[#E62E2D] shadow-xs flex items-center justify-center shrink-0`}
          title={name}
        >
          {/* Official Dubizzle Stylized 'd' Emblem */}
          <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" aria-label="Dubizzle">
            <path
              d="M15.8 3.5v7.1a5.2 5.2 0 1 0 3.2 4.8V3.5h-3.2zm-2 14.3a2.6 2.6 0 1 1 0-5.2 2.6 2.6 0 0 1 0 5.2z"
              fill="#FFFFFF"
            />
            <circle cx="7" cy="6.8" r="1.7" fill="#FFFFFF" opacity="0.9" />
          </svg>
        </div>
      );

    case "propertyfinder":
      return (
        <div
          className={`${sizeClasses} bg-white border border-red-100 shadow-xs flex items-center justify-center shrink-0`}
          title={name}
        >
          {/* Official Property Finder Red Pin + House Emblem */}
          <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" aria-label="Property Finder">
            <path
              d="M12 2.2C7.69 2.2 4.2 5.69 4.2 10c0 5.67 7.8 11.8 7.8 11.8s7.8-6.13 7.8-11.8c0-4.31-3.49-7.8-7.8-7.8z"
              fill="#EF4444"
            />
            <path
              d="M12 6.3l-4 3.3h1.2v3.6h2.1v-2.2h1.4v2.2h2.1V9.6H16l-4-3.3z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
      );

    case "bayut":
      return (
        <div
          className={`${sizeClasses} bg-[#008034] shadow-xs flex items-center justify-center shrink-0`}
          title={name}
        >
          {/* Official Bayut Stylized 'b' + Roof Emblem */}
          <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" aria-label="Bayut">
            <path
              d="M6.5 4.2v15.6h3.2v-1.3a4.9 4.9 0 1 0 0-8.2V4.2H6.5zm6.3 12.7a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
              fill="#FFFFFF"
            />
            <path
              d="M13.5 4.5l4.2 3.2-1.1 1.4-3.1-2.3-3.1 2.3-1.1-1.4 4.2-3.2z"
              fill="#6EE7B7"
            />
          </svg>
        </div>
      );

    default:
      return (
        <div
          className={`${sizeClasses} bg-slate-800 text-white font-bold text-sm shadow-xs flex items-center justify-center shrink-0`}
        >
          {name[0]}
        </div>
      );
  }
}
