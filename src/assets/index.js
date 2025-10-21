// Asset imports utility
// This file provides easy access to all assets in the application

// Images
export const images = {
  // Logo assets
  logo: {
    main: require('./images/logo/trustichain-logo.svg'),
    icon: require('./images/logo/trustichain-icon.png'),
    favicon: require('./images/logo/favicon.ico')
  },
  
  // Icon assets
  icons: {
    wallet: require('./images/icons/wallet-icon.svg'),
    shield: require('./images/icons/shield-icon.svg'),
    blockchain: require('./images/icons/blockchain-icon.svg'),
    arbitration: require('./images/icons/arbitration-icon.svg')
  },
  
  // Illustration assets
  illustrations: {
    hero: require('./images/illustrations/hero-illustration.svg'),
    escrowFlow: require('./images/illustrations/escrow-flow.svg'),
    securityFeatures: require('./images/illustrations/security-features.svg'),
    blockchainNetwork: require('./images/illustrations/blockchain-network.svg')
  },
  
  // Background assets
  backgrounds: {
    gradient: require('./images/backgrounds/gradient-bg.jpg'),
    pattern: require('./images/backgrounds/pattern-bg.svg'),
    glassEffect: require('./images/backgrounds/glass-effect.png')
  }
};

// Fonts
export const fonts = {
  geist: {
    // Geist font is loaded from Google Fonts CDN
    // No local files needed
  }
};

// Helper function to get image by path
export const getImage = (path) => {
  return require(`./images/${path}`);
};

// Helper function to get font by name
export const getFont = (name) => {
  return require(`./fonts/${name}`);
};

export default {
  images,
  fonts,
  getImage,
  getFont
};
