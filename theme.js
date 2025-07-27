// chakra.config.js
const { defineConfig, createSystem, defaultConfig } = require('@chakra-ui/react');

const config = defineConfig({
    // Define your theme extensions here.
    theme: {
        extend: {
            // Example: You can add custom colors like this later
            // colors: {
            //   brand: {
            //     50: '#E6FFFA',
            //     100: '#B2F5EA',
            //     // ...
            //   },
            // },
            // Example: You can add custom font sizes
            // fontSizes: {
            //   '2xl': '1.5rem',
            //   '3xl': '1.875rem',
            // },
        },
        // Explicitly set initial color mode to light and disable system color mode
        initialColorMode: 'light',
        useSystemColorMode: false,
    },
    // This is crucial for typegen to know where your config is
    // and where to output the generated types.
    typegen: {
        out: 'src/styled-system/types.d.ts', // Recommended output path for generated types
        path: './theme.js', // Path to this config file itself
    },
    // You can add other global configurations here if needed, e.g.:
    // globalCss: {
    //   "html, body": {
    //     margin: 0,
    //     padding: 0,
    //   },
    // },
    // cssVarsRoot: ":where(:root, :host)",
    // cssVarsPrefix: "ck",
    // strictTokens: true, // Set to true to enforce only defined tokens
});

// Create the styling system by passing the default config and your custom config
const system = createSystem(defaultConfig, config);

// Export the system to be used in ChakraProvider
module.exports = system;
