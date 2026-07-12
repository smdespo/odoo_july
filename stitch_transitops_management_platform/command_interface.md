---
name: Command Interface
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1b1b1d'
  surface-container: '#1f1f21'
  surface-container-high: '#2a2a2b'
  surface-container-highest: '#353436'
  on-surface: '#e4e2e4'
  on-surface-variant: '#c6c6cd'
  inverse-surface: '#e4e2e4'
  inverse-on-surface: '#303032'
  outline: '#909097'
  outline-variant: '#45464d'
  surface-tint: '#bec6e0'
  primary: '#bec6e0'
  on-primary: '#283044'
  primary-container: '#0f172a'
  on-primary-container: '#798098'
  inverse-primary: '#565e74'
  secondary: '#b7c8e1'
  on-secondary: '#213145'
  secondary-container: '#3a4a5f'
  on-secondary-container: '#a9bad3'
  tertiary: '#dec29a'
  on-tertiary: '#3e2d11'
  tertiary-container: '#231500'
  on-tertiary-container: '#957d5a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#131315'
  on-background: '#e4e2e4'
  surface-variant: '#353436'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-base:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  data-tabular:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  grid-margin: 1rem
  grid-gutter: 0.75rem
  cell-padding-x: 0.5rem
  cell-padding-y: 0.25rem
  stack-gap: 1rem
---

## Brand & Style

The design system is engineered for high-stakes transport operations where speed of cognition is paramount. The personality is authoritative, precise, and utilitarian, evoking the atmosphere of a modern mission control center. It prioritizes information density and functional clarity over decorative elements.

The aesthetic follows a **Corporate / Modern** direction with a focus on **High-Density Minimalism**. It utilizes a systematic approach to data visualization, where whitespace is used strictly for grouping and separation rather than "breathing room." The emotional response should be one of complete control, reliability, and calm under pressure. Visual hierarchy is maintained through strict structural alignment and a disciplined color application that guides the eye toward critical status changes.

## Colors

This design system uses a **dark-mode-first** architecture to reduce eye strain for operators during long shifts. The palette is anchored by deep navies and slate grays, creating a sophisticated, low-glare environment.

- **Primary & Neutral:** The background utilizes `surface_background_hex` to provide depth, while `surface_container_hex` creates logical grouping for dashboard widgets and data grids.
- **Semantic Accents:** High-chroma colors are reserved strictly for operational status. 
    - **Emerald (Success):** Used for "Active," "On-Time," or "Available" units.
    - **Amber (Warning):** Used for "Pending," "Maintenance," or "Delayed" states.
    - **Crimson (Danger):** Reserved for "Critical Alerts," "Stoppages," or "Emergency" notifications.
- **Contrast:** Text and primary icons must maintain a minimum 7:1 contrast ratio against container backgrounds to ensure legibility in high-stress scenarios.

## Typography

The typography system is optimized for high-density data consumption. **Inter** is the primary typeface for its exceptional legibility and neutral character. 

- **Data Tables:** For numerical data, timestamps, and vehicle IDs, use **JetBrains Mono**. The monospaced nature ensures that columns of numbers align perfectly, allowing operators to scan for discrepancies quickly.
- **Hierarchy:** Use `label-caps` for table headers and section titles to create clear structural anchors.
- **Scale:** Keep font sizes constrained. The "body-sm" (13px) is the workhorse size for data grids to maximize the number of rows visible on a single screen.

## Layout & Spacing

This design system employs a **Fixed Grid** model for dashboard layouts and a **Fluid Content** model for data-heavy tables. 

- **Grid System:** Use a 12-column grid for the primary dashboard. Widgets should snap to column spans (e.g., Map view spans 8 columns, Side Alert Panel spans 4).
- **Density:** Spacing follows a tight 4px scale. Data grids utilize minimal vertical padding (`cell-padding-y`) to increase information density, relying on subtle 1px horizontal borders for row separation.
- **Breakpoints:** 
    - **Desktop (1440px+):** Full 12-column visibility with persistent side navigation.
    - **Tablet (1024px):** Side navigation collapses to icons; data grids transition to horizontal scroll.
    - **Mobile (768px and below):** Stacking layout; complex tables are replaced by summarized "Status Cards."

## Elevation & Depth

To maintain the "Control Center" aesthetic, depth is communicated through **Tonal Layering** and **Low-Contrast Outlines** rather than heavy shadows.

- **Surface Tiers:** Use three primary levels:
    - **Level 0 (Background):** `surface_background_hex`.
    - **Level 1 (Card/Container):** `surface_container_hex` with a 1px border of `border_color_hex`.
    - **Level 2 (Popovers/Modals):** A slightly lighter slate with a subtle ambient shadow (0px 4px 12px rgba(0,0,0,0.5)) to indicate focus.
- **Interaction:** Hover states on interactive rows or cards should be indicated by a subtle shift in background color (5% lighter) rather than a change in elevation or shadow.

## Shapes

The shape language is strictly **Soft (0.25rem)**. This slight rounding provides a modern touch while maintaining the professional, grid-based structure required for a technical interface. 

- **Buttons & Inputs:** Use the standard 4px (`0.25rem`) radius.
- **Status Badges:** Use a larger radius (up to `0.75rem`) to distinguish them as distinct semantic elements from the structural boxes of the UI.
- **Icons:** Use sharp or slightly softened corners to match the 1.5px stroke weight of the UI icons.

## Components

- **Data Grids:** The core component. Features include sticky headers, zebra striping on hover, and inline status indicators. Text is left-aligned; numerical data is right-aligned using the monospaced font.
- **Status Badges:** Compact labels with high-contrast backgrounds (Emerald, Amber, Crimson). Text inside badges uses `label-caps` for maximum readability at small scales.
- **Buttons:** 
    - *Primary:* Solid fill using a lighter slate/blue to avoid clashing with semantic status colors.
    - *Actionable:* Outline buttons for secondary actions like "Export" or "Filter."
- **Input Fields:** Dark backgrounds with 1px borders. Focus state is indicated by a 1px border glow in the primary color, never using semantic colors (to avoid confusion with errors).
- **Control Panels:** Collapsible sidebars and top bars for global filters (e.g., Date Range, Region, Vehicle Type).
- **Alert Ticker:** A persistent, high-contrast banner at the top or bottom of the interface for real-time critical alerts (Crimson).