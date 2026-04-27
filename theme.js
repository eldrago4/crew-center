// chakra.config.js
const { defineConfig, createSystem, defaultConfig } = require('@chakra-ui/react') ;

const config = defineConfig({
    // Define your theme customizations here
    theme: {
        tokens: {
            // Example: You can add custom colors with value objects
            // colors: {
            //   brand: {
            //     50: { value: '#E6FFFA' },
            //     100: { value: '#B2F5EA' },
            //     // ...
            //   },
            // },
        },
        // Example: You can add custom font sizes
        // fontSizes: {
        //   '2xl': { value: '1.5rem' },
        //   '3xl': { value: '1.875rem' },
        // },
    },
    // Set default color palette to light mode
    globalCss: {
        html: {
            colorPalette: "gray", // You can change this to any color palette
        },
    },
    // You can add other global configurations here if needed:
    // cssVarsRoot: ":where(:root, :host) ",
    // cssVarsPrefix: "ck",
    // strictTokens: true, // Set to true to enforce only defined tokens
}) ;

// Create the styling system by passing the default config and your custom config
const system = createSystem(defaultConfig, config) ;

// Export the system to be used in ChakraProvider
module.exports = system;