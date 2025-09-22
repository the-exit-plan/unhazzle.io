# Unhazzle.io Website

A modern, minimalistic website for Unhazzle - Infrastructure without the hassle.

## Overview

This website is built with vanilla HTML5, CSS3, and JavaScript to reflect Unhazzle's mission of simplicity and removing complexity from infrastructure administration. The design emphasizes clean aesthetics, accessibility, and performance.

## Features

- **Fully Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices
- **Modern CSS**: Uses CSS Grid, Flexbox, and custom properties for maintainable styling
- **Vanilla JavaScript**: No frameworks or dependencies for optimal performance
- **Accessibility**: Semantic HTML, proper ARIA labels, and keyboard navigation
- **Performance Optimized**: Minimal resources, lazy loading, and efficient animations
- **SEO Ready**: Proper meta tags, semantic markup, and structured content

## Design Principles

### Minimalism
- Clean, uncluttered layouts
- Purposeful use of whitespace
- Simple, effective typography
- Focused color palette

### Consistency with Mission
- Emphasizes simplicity over complexity
- Visual representation of "before/after" complexity reduction
- Professional, trustworthy appearance
- Modern without being flashy

### User Experience
- Intuitive navigation
- Clear call-to-actions
- Fast loading times
- Smooth interactions

## File Structure

```
services/website/
├── index.html          # Main HTML file
├── styles.css          # All CSS styles
├── script.js           # JavaScript functionality
└── README.md           # This file
```

## Color Palette

- **Primary**: #2563eb (Blue)
- **Secondary**: #64748b (Slate)
- **Accent**: #06b6d4 (Cyan)
- **Success**: #10b981 (Green)
- **Warning**: #f59e0b (Amber)
- **Neutrals**: Various shades of gray

## Typography

- **Font Family**: Inter (with fallbacks)
- **Scale**: Modular scale using CSS custom properties
- **Weights**: 300, 400, 500, 600, 700

## Sections

1. **Header/Navigation**: Sticky header with smooth scroll navigation
2. **Hero**: Main value proposition with visual complexity comparison
3. **Features**: Six key benefits of using Unhazzle
4. **About**: Company mission with statistics and platform preview
5. **CTA**: Call-to-action section with primary actions
6. **Contact**: Contact information and form
7. **Footer**: Additional links and company information

## Development

### Local Development

Simply open `index.html` in a web browser or serve with a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

### Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- IE11+ (with graceful degradation)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Performance Considerations

- No external dependencies (except Google Fonts)
- Optimized images and assets
- Efficient CSS with minimal specificity
- Lazy loading for images
- Smooth animations with `transform` and `opacity`

## Customization

### Colors
Update the CSS custom properties in `:root` to change the color scheme.

### Typography
Modify the font imports and CSS custom properties for typography changes.

### Content
Update the HTML content directly in `index.html`.

### Animations
Animations can be customized in the CSS and JavaScript files.

## Accessibility Features

- Semantic HTML5 elements
- Proper heading hierarchy
- Alt text for images
- ARIA labels where needed
- Keyboard navigation support
- Focus indicators
- Color contrast compliance

## Future Enhancements

Potential additions while maintaining simplicity:

- Blog integration
- Documentation portal
- Pricing page
- Customer testimonials
- Case studies
- Interactive demos

## License

Copyright 2025 Unhazzle. All rights reserved.
