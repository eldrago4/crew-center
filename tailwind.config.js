/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/(main)/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    // Add any other directories where you want to use Tailwind
  ],
  theme: {
    extend: {
      // You can extend the default theme here
    },
  },
  plugins: [],
  // To prevent conflicts with Chakra UI, we'll disable Tailwind's preflight
  corePlugins: {
    preflight: false,
  },
  // Only apply Tailwind's base styles to the main section
  blocklist: [
    // Add any specific classes you want to exclude
  ],
}
