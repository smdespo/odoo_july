---
name: Command Elite
colors:
  surface: '#031427'
  surface-dim: '#031427'
  surface-bright: '#2a3a4f'
  surface-container-lowest: '#000f21'
  surface-container-low: '#0b1c30'
  surface-container: '#102034'
  surface-container-high: '#1b2b3f'
  surface-container-highest: '#26364a'
  on-surface: '#d3e4fe'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#d3e4fe'
  inverse-on-surface: '#213145'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#adc6ff'
  on-secondary: '#002e6a'
  secondary-container: '#0566d9'
  on-secondary-container: '#e6ecff'
  tertiary: '#bec6e0'
  on-tertiary: '#283044'
  tertiary-container: '#9ba2bb'
  on-tertiary-container: '#31394d'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#031427'
  on-background: '#d3e4fe'
  surface-variant: '#26364a'
typography:
  display-xl:
    fontFamily: Outfit
    fontSize: 72px
    fontWeight: '700'
    lineHeight: 80px
    letterSpacing: -0.02em
  display-lg:
    fontFamily: Outfit
    fontSize: 60px
    fontWeight: '700'
    lineHeight: 72px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
  headline-md:
    fontFamily: Outfit
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  gutter: 24px
  margin-desktop: 80px
  margin-mobile: 20px
  section-gap: 120px
---

## Brand & Style
The design system for TransitOps is engineered to evoke the precision and authority of a mission-critical operations center. It targets enterprise logistics leaders who require a balance of high-level strategic overview and technical reliability. 

The aesthetic is **Modern Corporate SaaS with a Glassmorphic edge**. It utilizes a "Command Center" visual metaphor—dark, immersive backgrounds punctuated by glowing accent lights. The interface feels sophisticated and futuristic, yet grounded in stability through structured grids and crisp, functional typography. Visuals prioritize depth through translucent layers, subtle blurs, and thin, high-contrast borders that mimic high-end hardware interfaces.

The tone is:
- **Trustworthy:** Professional dark tones provide a "silent partner" background.
- **Innovative:** Electric blue and emerald gradients signal cutting-edge technology.
- **Mission-Critical:** Every element has a purpose, with no unnecessary decoration.

## Colors
The palette centers on a "Deep Space" foundation to ensure high-end professional appeal for marketing environments.

- **Foundational Neutrals:** The primary background is a deep, desaturated navy-charcoal (`#0F172A`). Surface layers use slightly lighter variants to create structural depth.
- **Emerald Accent (Success/Growth):** A vibrant emerald (`#10B981`) is used for primary brand moments and positive metrics.
- **Electric Blue (Action/Tech):** A high-vibrancy blue (`#3B82F6`) provides a secondary accent for interactive elements and highlights.
- **Gradients:** Use "Linear Command" gradients (Emerald to Blue) at 135 degrees for hero CTA buttons and significant value-proposition highlights. 
- **Subtle Overlays:** Use a 5% opacity white or blue tint on glassmorphic cards to distinguish them from the base background.

## Typography
The system employs a dual-font strategy to balance marketing impact with technical utility.

- **Display & Headings:** 'Outfit' provides a geometric, modern, and authoritative presence. Its rounded terminals soften the "hard tech" feel, making it approachable yet professional. Use heavy weights (600-700) for hero sections.
- **Interface & Body:** 'Inter' is used for all body copy and functional UI labels. Its neutral, systematic nature ensures legibility across dense data or long marketing descriptions.
- **Scalability:** Display sizes scale aggressively for desktop to create a premium, editorial feel, but must collapse to defined mobile-specific sizes to maintain hierarchy on smaller screens.

## Layout & Spacing
The layout follows a **structured fluid grid** model that emphasizes breathing room and organized information hierarchy.

- **Grid System:** A 12-column grid for desktop with 24px gutters. Marketing sections often utilize center-aligned 8-column layouts for maximum readability.
- **Rhythm:** An 8px base unit drives all spacing. Component-level padding follows 16px, 24px, or 32px increments.
- **Vertical Spacing:** Large section gaps (120px on desktop, 64px on mobile) separate distinct value propositions, ensuring the "Premium" feel by avoiding clutter.
- **Breakpoints:** 
    - Mobile: 375px+ (4 columns)
    - Tablet: 768px+ (8 columns)
    - Desktop: 1280px+ (12 columns)

## Elevation & Depth
Depth is created through "Technical Layering" rather than traditional heavy shadows.

- **Glassmorphism:** Secondary surfaces use a backdrop-blur (12px to 20px) with a semi-transparent background (`rgba(15, 23, 42, 0.6)`).
- **Subtle Borders:** All containers feature a 1px solid border. Use a low-opacity white (`rgba(255, 255, 255, 0.1)`) for the top and left edges, and a darker navy for the bottom and right to create a "recessed" or "beveled" tech-hardware effect.
- **Glow Effects:** Critical CTA cards or active states use a subtle "Emerald Ambient Glow"—a very soft, wide-radius shadow (`box-shadow: 0 20px 40px rgba(16, 185, 129, 0.15)`).
- **Photography:** Images are treated with a slight desaturation and cool-blue tint to integrate with the dark theme.

## Shapes
The design system utilizes **Rounded (0.5rem / 8px)** geometry. This offers a modern, high-end feel that isn't as aggressive as sharp corners nor as casual as pill shapes.

- **Primary Components:** Buttons and Input fields use the standard 8px radius.
- **Feature Cards:** Use `rounded-lg` (16px) for larger landing page sections to create a distinct, containerized look.
- **Inner Elements:** Nested elements (like icons inside a box) should use a smaller radius (4px) to maintain visual nesting harmony.

## Components
- **Buttons:** Primary CTAs use the Emerald-to-Blue gradient with white text. Secondary buttons use the "Ghost Border" style—1px border with a glassmorphic background blur.
- **Input Fields:** Dark navy backgrounds (`#1E293B`) with 1px borders that glow Blue (`#3B82F6`) on focus.
- **Feature Cards:** Large cards with a 1px border, 20px backdrop blur, and a subtle icon in the top-left using the Emerald accent.
- **Value Proposition Sections:** Alternate between a pure dark background and a slightly lighter "Glass" background to create visual rhythm during the scroll.
- **Navigation:** A sticky top bar with a high blur factor (30px) and a thin bottom border to separate it from the content scroll.
- **Photography Placeholders:** Use a 16:9 aspect ratio with rounded corners and a subtle interior glow to signify high-quality terminal or map screenshots.