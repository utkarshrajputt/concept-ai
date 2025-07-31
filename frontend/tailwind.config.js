/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        // Blob animations for background shapes
        blob: 'blob 7s infinite cubic-bezier(0.68, -0.55, 0.27, 1.55)',
        // Modal animations
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-up': 'slideInUp 0.3s ease-out',
      },
      keyframes: {
        // Custom keyframes for blob animation
        blob: {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0, 0) scale(1)' },
        },
        // Modal animations
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        }
      },
      // --- Customizing Tailwind Typography (Prose) styles ---
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            // General text and paragraph styling
            p: {
              color: theme('colors.gray.700'),
              fontSize: theme('fontSize.base'),
              lineHeight: theme('lineHeight.relaxed'),
              marginBottom: theme('spacing.4'), // More space between paragraphs
            },
            // Headers
            h1: {
              color: theme('colors.gray.900'),
              fontSize: theme('fontSize.4xl'),
              fontWeight: theme('fontWeight.extrabold'),
              marginBottom: theme('spacing.4'),
              marginTop: theme('spacing.12'),
            },
            h2: { // Example: "Git Explained Simply" style
              color: theme('colors.gray.900'),
              fontSize: theme('fontSize.3xl'),
              fontWeight: theme('fontWeight.bold'),
              marginBottom: theme('spacing.4'),
              marginTop: theme('spacing.10'),
              borderBottom: `2px solid ${theme('colors.indigo.500')}`, // Add a line
              paddingBottom: theme('spacing.2'),
            },
            h3: { // Example: "What is Git?" or "Key Ideas:" style
              color: theme('colors.gray.900'),
              fontSize: theme('fontSize.2xl'),
              fontWeight: theme('fontWeight.bold'),
              marginBottom: theme('spacing.3'),
              marginTop: theme('spacing.8'),
            },
            h4: { // Example: "1. Commit" style
                color: theme('colors.gray.800'),
                fontSize: theme('fontSize.lg'),
                fontWeight: theme('fontWeight.semibold'),
                marginBottom: theme('spacing.2'),
                marginTop: theme('spacing.6'),
                display: 'flex',
                alignItems: 'center',
                '&::before': { // Custom bullet/marker for h4
                    content: '""', // Use empty string for custom marker
                    display: 'inline-block',
                    width: theme('spacing.2'),
                    height: theme('spacing.2'),
                    borderRadius: '50%',
                    backgroundColor: theme('colors.purple.500'), // Use purple from your current palette
                    marginRight: theme('spacing.2'),
                    flexShrink: 0,
                },
            },
            h5: {
                color: theme('colors.gray.700'),
                fontSize: theme('fontSize.base'),
                fontWeight: theme('fontWeight.medium'),
                marginBottom: theme('spacing.2'),
                marginTop: theme('spacing.4'),
                textTransform: 'uppercase',
                letterSpacing: theme('letterSpacing.wide'),
            },
            // Text formatting
            strong: {
              color: theme('colors.gray.900'),
              fontWeight: theme('fontWeight.bold'),
              backgroundColor: theme('colors.yellow.100'), // Highlight bold text
              paddingLeft: theme('spacing.1'),
              paddingRight: theme('spacing.1'),
              borderRadius: theme('borderRadius.sm'),
            },
            em: {
              color: theme('colors.gray.600'),
              fontStyle: 'italic',
              borderLeft: `2px solid ${theme('colors.gray.300')}`, // Left border for italics
              paddingLeft: theme('spacing.2'),
            },
            code: {
              backgroundColor: theme('colors.gray.100'),
              color: theme('colors.gray.800'),
              paddingLeft: theme('spacing.1'),
              paddingRight: theme('spacing.1'),
              paddingTop: theme('spacing.0.5'),
              paddingBottom: theme('spacing.0.5'),
              borderRadius: theme('borderRadius.md'),
              fontSize: theme('fontSize.sm'),
              fontWeight: theme('fontWeight.medium'),
            },
            // Lists
            'ol > li': { // Numbered list items (e.g., 1. Commit)
                display: 'flex',
                alignItems: 'flex-start',
                marginBottom: theme('spacing.4'),
                padding: theme('spacing.4'),
                background: `linear-gradient(to right, ${theme('colors.slate.50')}, ${theme('colors.gray.50')})`,
                borderRadius: theme('borderRadius.lg'),
                borderLeft: `4px solid ${theme('colors.indigo.500')}`, // Use indigo for the left border
                boxShadow: theme('boxShadow.sm'),
            },
            'ol > li::marker': { // Hide default marker
                content: '""',
            },
            'ol > li > div:first-child': { // This targets the custom number circle
                flexShrink: 0,
                width: theme('spacing.8'),
                height: theme('spacing.8'),
                background: `linear-gradient(to right, ${theme('colors.indigo.600')}, ${theme('colors.purple.600')})`, // Use your existing indigo/purple gradient
                color: theme('colors.white'),
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: theme('fontSize.sm'),
                fontWeight: theme('fontWeight.bold'),
                marginRight: theme('spacing.3'),
                boxShadow: theme('boxShadow.lg'),
            },
            'ul > li': { // Bullet list items
                display: 'flex',
                alignItems: 'flex-start',
                marginBottom: theme('spacing.3'),
                paddingLeft: theme('spacing.4'),
            },
            'ul > li::before': { // Custom bullet point
                backgroundColor: theme('colors.teal.500'), // Use a teal color for bullets
                borderRadius: '50%',
                content: '""',
                height: theme('spacing.2'),
                width: theme('spacing.2'),
                marginTop: theme('spacing.3'),
                marginRight: theme('spacing.3'),
                flexShrink: 0,
            },
            'li': { // General list item text styling
                color: theme('colors.gray.800'),
                lineHeight: theme('lineHeight.relaxed'),
                fontSize: theme('fontSize.base'),
            }
          },
        },
      }),
    },
  },
  plugins: [
    // Custom formatting replaces need for typography plugin
  ],
}