import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1E1B2E",
        muted: "#6B6880",
        line: "#ECEAF2",
        brand: {
          DEFAULT: "#6366F1",
          50: "#EEF0FF",
          100: "#E0E3FF",
          600: "#4F46E5",
          700: "#4338CA"
        },
        accent: {
          DEFAULT: "#F43F5E",
          50: "#FFF1F3"
        },
        success: {
          DEFAULT: "#059669",
          50: "#ECFDF5"
        },
        danger: {
          DEFAULT: "#DC2626",
          50: "#FEF2F2"
        },
        warning: {
          DEFAULT: "#D97706",
          50: "#FFFBEB"
        },
        info: {
          DEFAULT: "#0EA5E9",
          50: "#F0F9FF"
        }
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem"
      },
      boxShadow: {
        soft: "0 1px 2px rgba(30, 27, 46, 0.04), 0 8px 24px rgba(99, 102, 241, 0.08)",
        sm: "0 1px 2px rgba(30, 27, 46, 0.05)",
        md: "0 4px 12px rgba(30, 27, 46, 0.06), 0 2px 4px rgba(30, 27, 46, 0.04)",
        lg: "0 12px 32px rgba(99, 102, 241, 0.12), 0 4px 12px rgba(30, 27, 46, 0.06)",
        xl: "0 20px 48px rgba(99, 102, 241, 0.18), 0 8px 20px rgba(30, 27, 46, 0.08)",
        glow: "0 0 0 4px rgba(99, 102, 241, 0.12)"
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
        "accent-gradient": "linear-gradient(135deg, #F43F5E 0%, #FB7185 100%)",
        "auth-gradient": "linear-gradient(135deg, #4F46E5 0%, #7C3AED 45%, #EC4899 100%)",
        "page-gradient": "radial-gradient(120% 80% at 0% 0%, rgba(99, 102, 241, 0.08) 0%, transparent 55%), radial-gradient(100% 70% at 100% 0%, rgba(244, 63, 94, 0.06) 0%, transparent 50%)"
      }
    }
  },
  plugins: []
};

export default config;
