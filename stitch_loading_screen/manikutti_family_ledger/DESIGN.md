# Design System Document: The Heritage Ledger

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Sanctuary"**
Finance is often associated with stress and rigid, cold grids. This design system rejects that premise. Our goal is to transform family finance tracking into an editorial, high-end experience that feels more like a premium lifestyle magazine than a banking ledger. 

We move beyond the "standard template" by embracing **intentional asymmetry** and **tonal depth**. Rather than boxing content into rigid cells, we allow elements to breathe. We use overlapping modules and a dramatic typography scale to create a visual rhythm that guides the eye. This is a "sanctuary"—a place of calm, clarity, and sophisticated warmth.

---

## 2. Colors
Our palette is rooted in the "Heritage Teal" and "Sunlight Gold" derived from the brand mark, balanced against high-fidelity whites.

### Core Tokens
*   **Primary (`#006972`):** Used for authoritative actions and brand presence.
*   **Primary Container (`#68c9d6`):** Used for large surface areas like Hero sections or active states.
*   **Secondary (`#735c00`):** Provides a warm, human contrast to the teal.
*   **Secondary Container (`#fdd34d`):** Use for "positive growth" moments or family milestones.
*   **Surface (`#f8f9fa`):** Our clean, expansive canvas.

### The "No-Line" Rule
To achieve a high-end editorial feel, **1px solid borders are prohibited for sectioning.** We define boundaries through background color shifts. For example, a card (using `surface-container-lowest`) should sit on a section background of `surface-container-low`. The edge is defined by the shift in tone, not a line.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
1.  **Base:** `surface` (The foundation).
2.  **Sectioning:** `surface-container-low` (Subtle grouping).
3.  **Active Modules:** `surface-container-lowest` (The "whitest" white, used for primary cards to make them pop).

### The "Glass & Gradient" Rule
Standard flat colors feel static. Use **Glassmorphism** for floating elements (like bottom navigation or modal overlays) using semi-transparent surface colors with a `backdrop-blur`. Enhance CTAs with a subtle gradient transitioning from `primary` to `primary_container` at a 135-degree angle to provide visual "soul."

---

## 3. Typography
We pair the architectural precision of **Manrope** with the utilitarian clarity of **Inter**.

*   **Display & Headlines (Manrope):** These are our "Editorial" voices. Use `display-lg` (3.5rem) and `headline-lg` (2rem) with generous letter-spacing to create an authoritative, premium feel. 
*   **Body & Labels (Inter):** For data-heavy financial tracking, Inter provides the necessary legibility. `body-md` (0.875rem) is our workhorse for transaction details.
*   **Hierarchy as Identity:** Use high contrast in size. A massive `display-sm` balance amount paired with a tiny, uppercase `label-md` "AVAILABLE BALANCE" creates an intentional, curated look.

---

## 4. Elevation & Depth
Depth in this system is a matter of light and layering, not heavy shadows.

*   **The Layering Principle:** Stacking is preferred over shadowing. A `surface-container-highest` element placed on a `surface` background provides all the "elevation" needed for secondary information.
*   **Ambient Shadows:** For floating components (e.g., "Add Transaction" button), use extra-diffused shadows. 
    *   *Value:* 0px 20px 40px
    *   *Color:* `on-surface` at 6% opacity. This mimics natural light.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use `outline-variant` at 15% opacity. Never use 100% opaque borders.
*   **Glassmorphism:** Apply a 12px-20px blur to semi-transparent surface layers to create "frosted glass." This integrates the UI into the background rather than looking like a sticker.

---

## 5. Components

### Buttons
*   **Primary:** Gradient-filled (`primary` to `primary-container`), `xl` (1.5rem) rounding. No shadow unless hovering.
*   **Tertiary:** `on-primary-fixed-variant` text with no container. Used for low-emphasis family settings.

### Financial List Items
*   **Rule:** Forbid divider lines.
*   **Layout:** Use `4` (1rem) spacing between items. Use a `surface-container-low` background on hover to define the interactive area. Leading elements (category icons) should use the `secondary_container` (soft yellow) for warmth.

### Progress Bars (Savings Goals)
*   **Track:** `surface-container-highest`.
*   **Indicator:** `primary` (Teal). 
*   **Style:** `full` rounding. Height should be `2.5` (0.625rem) to feel substantial and high-fidelity.

### Financial Charts
*   **Line/Area:** Use `primary` with a soft `primary-container` gradient fill below the line. 
*   **Grid Lines:** Only horizontal. Use `outline-variant` at 10% opacity. 

### Cards
*   **Style:** `lg` (1rem) rounding. Background `surface-container-lowest`. 
*   **Interaction:** On tap, scale the card to 98%—a tactile, premium physical response.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical margins (e.g., 24px on the left, 32px on the right) for header sections to create an editorial "break."
*   **Do** use `secondary_fixed` (Yellow) for highlights like "Budget Exceeded" or "New Goal Reached"—it feels celebratory, not alarming.
*   **Do** favor vertical whitespace over lines. If in doubt, add more `spacing-8`.

### Don't
*   **Don't** use pure black `#000000` for text. Always use `on-surface` (`#191c1d`) for a softer, premium look.
*   **Don't** use standard "Material Design" shadows. They are too aggressive for this system. Stick to Tonal Layering.
*   **Don't** use high-saturation red for errors. Use the sophisticated `error` token (`#ba1a1a`) which leans more towards a deep, professional ruby.