---
name: Luminous Exchange
colors:
  surface: '#f8f9ff'
  surface-dim: '#d0dbed'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dee9fc'
  surface-container-highest: '#d9e3f6'
  on-surface: '#121c2a'
  on-surface-variant: '#544249'
  inverse-surface: '#27313f'
  inverse-on-surface: '#eaf1ff'
  outline: '#87717a'
  outline-variant: '#dac0c9'
  surface-tint: '#a43073'
  primary: '#a43073'
  on-primary: '#ffffff'
  primary-container: '#f472b6'
  on-primary-container: '#6d0047'
  inverse-primary: '#ffafd3'
  secondary: '#8f4953'
  on-secondary: '#ffffff'
  secondary-container: '#ffa6b1'
  on-secondary-container: '#7a3842'
  tertiary: '#765469'
  on-tertiary: '#ffffff'
  tertiary-container: '#bb94ab'
  on-tertiary-container: '#4a2d40'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd8e7'
  primary-fixed-dim: '#ffafd3'
  on-primary-fixed: '#3d0026'
  on-primary-fixed-variant: '#85145a'
  secondary-fixed: '#ffd9dc'
  secondary-fixed-dim: '#ffb2bb'
  on-secondary-fixed: '#3b0613'
  on-secondary-fixed-variant: '#73323d'
  tertiary-fixed: '#ffd8ed'
  tertiary-fixed-dim: '#e5bad3'
  on-tertiary-fixed: '#2c1325'
  on-tertiary-fixed-variant: '#5c3d51'
  background: '#f8f9ff'
  on-background: '#121c2a'
  surface-variant: '#d9e3f6'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 56px
    fontWeight: '800'
    lineHeight: 64px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

The design system is centered on a premium, collaborative atmosphere for a community skill exchange. It balances high-end SaaS professionalism with an inviting, soft aesthetic. The visual narrative leverages **Glassmorphism** and **Material Design 3** principles to create an interface that feels both cutting-edge and trustworthy.

The emotional response should be one of "effortless growth." By utilizing soft pastel pinks and elegant gradients, the UI moves away from traditional cold corporate palettes toward a more human-centric, vibrant experience. Whitespace is used aggressively to reduce cognitive load, ensuring that the act of learning and sharing skills feels spacious and organized.

## Colors

The palette is anchored by a sophisticated range of pinks and roses. 
- **Primary (#F472B6):** Used for key actions, active states, and brand highlights.
- **Secondary (#FDA4AF):** Used for supporting elements and softer calls to action.
- **Accent/Surface (#FBCFE8):** Used for large surface areas, light backgrounds, and container fills to maintain the pastel theme.
- **Functional Neutrals:** Charcoal (#1F2937) provides high-legibility for body text, while light grays handle borders and secondary information.

Gradients should be used sparingly for "Hero" moments or primary buttons, typically transitioning from Primary to Secondary at a 135-degree angle.

## Typography

This design system utilizes **Plus Jakarta Sans** for all typographic roles. Its modern, geometric construction and slightly wider stance provide an approachable yet professional character. 

For large displays, use the ExtraBold (800) weight to create a strong visual anchor. Body text should maintain a generous line height (1.5x) to ensure readability against glassmorphic backgrounds. All labels and buttons use SemiBold (600) to ensure clear affordance.

## Layout & Spacing

The layout follows a **Fluid Grid** philosophy with fixed maximum widths for desktop viewing. 
- **Desktop:** 12-column grid, 24px gutters, 80px side margins.
- **Tablet:** 8-column grid, 16px gutters, 40px side margins.
- **Mobile:** 4-column grid, 16px gutters, 16px side margins.

Spacing is based on an 8px root system. To maintain the "SaaS feel," vertical rhythm should be generous, specifically between sections (using `xl` spacing) to reinforce the premium, uncluttered nature of the platform.

## Elevation & Depth

Depth is established through a combination of **Glassmorphism** and soft, multi-layered shadows.

1.  **The Glass Layer:** Primary containers (cards, modals) use a semi-transparent white fill (`rgba(255, 255, 255, 0.7)`) with a `backdrop-filter: blur(12px)`. These elements must have a subtle 1px inner border (`glass_stroke`) to simulate a light-catching edge.
2.  **Shadows:** Use "Ambient Shadows"—diffused, low-opacity shadows with a hint of the primary color (`rgba(244, 114, 182, 0.1)`). 
    *   *Low:* 0px 4px 12px (Subtle components)
    *   *Medium:* 0px 12px 32px (Standard cards)
    *   *High:* 0px 24px 64px (Floating menus and Modals)

## Shapes

The shape language is extremely soft and organic. 
- **Small elements (Buttons, Inputs):** 12px - 16px radius.
- **Standard Cards:** 24px radius.
- **Large Sections/Containers:** 32px - 40px radius.

The goal is to eliminate sharp angles entirely, reinforcing the welcoming and collaborative personality of the brand.

## Components

### Buttons
- **Primary:** Gradient fill (Primary to Secondary), 16px vertical padding, 32px horizontal padding. Pill-shaped (fully rounded). White text.
- **Secondary:** Surface fill (#FBCFE8) with Primary text. No border.
- **Ghost:** Transparent background with Primary border (1px) or just Primary text for low-priority actions.

### Cards
Cards are the flagship component. They feature the `blur(12px)` effect, a 24px corner radius, and a subtle white border. Content inside cards should have at least 24px of internal padding.

### Input Fields
Inputs use a light gray or surface-colored background (#F3F4F6) with a 12px radius. On focus, the border transitions to the Primary color with a soft glow (3px spread, Primary color at 20% opacity).

### Navigation
The navigation bar should be a "floating" glassmorphic element. It sits at the top of the viewport with a subtle shadow, detached from the edges of the screen on desktop (margin-top: 16px).

### Icons
Use **Material Symbols Rounded**. The rounded variation is mandatory to match the typography and shape language. Standard weight (400) or Light (300) is preferred for a premium look.