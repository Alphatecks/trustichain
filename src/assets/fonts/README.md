# Fonts Directory

This directory contains Geist font files for the TrustiChain application.

## Font Files

### Geist Font Family
- `geist-regular.woff2` - Regular weight font (WOFF2 format)
- `geist-regular.woff` - Regular weight font (WOFF format)
- `geist-medium.woff2` - Medium weight font (WOFF2 format)
- `geist-medium.woff` - Medium weight font (WOFF format)
- `geist-semibold.woff2` - Semibold weight font (WOFF2 format)
- `geist-semibold.woff` - Semibold weight font (WOFF format)
- `geist-bold.woff2` - Bold weight font (WOFF2 format)
- `geist-bold.woff` - Bold weight font (WOFF format)

### Font CSS
- `fonts.css` - Font declarations and usage classes

## Font Weights Available

- **300** - Light (not included, fallback to system font)
- **400** - Regular
- **500** - Medium
- **600** - Semibold
- **700** - Bold

## Font Formats

- **WOFF2**: Modern format with best compression
- **WOFF**: Fallback format for older browsers
- **TTF/OTF**: Source formats (not included in build)

## Usage

Import the font CSS file in your main CSS or component:

```css
@import '../assets/fonts/fonts.css';

/* Use Geist font */
.geist-font {
  font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Specific weight classes */
.geist-regular { font-weight: 400; }
.geist-medium { font-weight: 500; }
.geist-semibold { font-weight: 600; }
.geist-bold { font-weight: 700; }
```

## Font Loading Strategy

- `font-display: swap` for better performance
- Preload critical fonts in HTML head
- Fallback to system fonts during loading
- Optimized loading with WOFF2 format

## Default Font Stack

The application uses:
- **Geist** (Primary) - Modern, clean font for UI
- **System fonts** - Fallback fonts for better performance
- **Monospace** - Code and technical content
