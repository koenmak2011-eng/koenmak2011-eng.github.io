import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        board: {
          light: "hsl(var(--board-light))",
          dark: "hsl(var(--board-dark))",
          highlight: "hsl(var(--board-highlight))",
          move: "hsl(var(--board-move))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "shake": {
          "0%,100%": { transform: "translate(0,0) rotate(0)" },
          "10%": { transform: "translate(-8px,-4px) rotate(-2deg)" },
          "20%": { transform: "translate(8px,4px) rotate(2deg)" },
          "30%": { transform: "translate(-6px,3px) rotate(-1deg)" },
          "40%": { transform: "translate(6px,-3px) rotate(1deg)" },
          "50%": { transform: "translate(-4px,2px)" },
          "60%": { transform: "translate(4px,-2px)" },
          "70%": { transform: "translate(-2px,1px)" },
          "80%": { transform: "translate(2px,-1px)" },
        },
        "flash-red": {
          "0%,100%": { backgroundColor: "transparent" },
          "50%": { backgroundColor: "hsl(var(--destructive) / 0.45)" },
        },
        "flash-white": {
          "0%": { backgroundColor: "hsl(0 0% 100% / 0)" },
          "30%": { backgroundColor: "hsl(0 0% 100% / 0.95)" },
          "100%": { backgroundColor: "hsl(0 0% 100% / 0)" },
        },
        "nuke-bloom": {
          "0%": { transform: "scale(0)", opacity: "0", filter: "blur(0)" },
          "20%": { transform: "scale(1.2)", opacity: "1", filter: "blur(0)" },
          "60%": { transform: "scale(8)", opacity: "0.8", filter: "blur(4px)" },
          "100%": { transform: "scale(20)", opacity: "0", filter: "blur(20px)" },
        },
        "bite-chomp": {
          "0%,100%": { transform: "scale(1) rotate(0)" },
          "25%": { transform: "scale(1.4) rotate(-15deg)" },
          "50%": { transform: "scale(0.7) rotate(15deg)" },
          "75%": { transform: "scale(1.3) rotate(-8deg)" },
        },
        "fly-across": {
          "0%": { transform: "translateX(-120vw) translateY(0) rotate(-10deg)" },
          "100%": { transform: "translateX(120vw) translateY(-30px) rotate(10deg)" },
        },
        "swoop-down": {
          "0%": { transform: "translateY(-100vh) translateX(-50vw) rotate(-30deg) scale(0.5)" },
          "50%": { transform: "translateY(0) translateX(0) rotate(0) scale(1.2)" },
          "100%": { transform: "translateY(20vh) translateX(50vw) rotate(20deg) scale(0.6)" },
        },
        "oil-drip": {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "30%": { opacity: "1" },
          "100%": { transform: "translateY(100vh)", opacity: "0.7" },
        },
        "headphone-pulse": {
          "0%,100%": { transform: "scale(1)", filter: "hue-rotate(0)" },
          "25%": { transform: "scale(1.3)", filter: "hue-rotate(90deg)" },
          "50%": { transform: "scale(0.9)", filter: "hue-rotate(180deg)" },
          "75%": { transform: "scale(1.2)", filter: "hue-rotate(270deg)" },
        },
        "rise-up": {
          "0%": { transform: "translateY(40px) scale(0.5)", opacity: "0" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        "win-burst": {
          "0%": { transform: "scale(0) rotate(-180deg)", opacity: "0" },
          "60%": { transform: "scale(1.3) rotate(20deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0)", opacity: "1" },
        },
        "lose-fade": {
          "0%": { transform: "scale(1.5)", opacity: "0", filter: "blur(20px)" },
          "100%": { transform: "scale(1)", opacity: "1", filter: "blur(0)" },
        },
        "draw-slide": {
          "0%": { transform: "translateX(-100vw)", opacity: "0" },
          "50%": { transform: "translateX(0)", opacity: "1" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-10vh) rotate(0)", opacity: "1" },
          "100%": { transform: "translateY(110vh) rotate(720deg)", opacity: "0" },
        },
        "float-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "20%": { transform: "translateY(0)", opacity: "1" },
          "80%": { transform: "translateY(-40px)", opacity: "1" },
          "100%": { transform: "translateY(-80px)", opacity: "0" },
        },
        "wiggle": {
          "0%,100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "shake": "shake 0.6s ease-in-out",
        "flash-red": "flash-red 0.8s ease-in-out",
        "flash-white": "flash-white 0.9s ease-out",
        "nuke-bloom": "nuke-bloom 2s ease-out forwards",
        "bite-chomp": "bite-chomp 0.7s ease-in-out 2",
        "fly-across": "fly-across 1.8s ease-in-out forwards",
        "swoop-down": "swoop-down 1.6s ease-in-out forwards",
        "oil-drip": "oil-drip 2.5s ease-in forwards",
        "headphone-pulse": "headphone-pulse 0.5s ease-in-out 3",
        "rise-up": "rise-up 0.5s ease-out",
        "win-burst": "win-burst 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "lose-fade": "lose-fade 1s ease-out forwards",
        "draw-slide": "draw-slide 0.7s ease-out forwards",
        "confetti-fall": "confetti-fall 3s linear forwards",
        "float-up": "float-up 2s ease-out forwards",
        "wiggle": "wiggle 0.4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
