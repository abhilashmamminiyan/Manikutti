# Design System Document: The Simple Paper Ledger

## 1. Overview & Creative North Star
**Creative North Star: "The Tactile Cashbook"**
Modern finance software is cluttered with aggressive neon gradients, flashing tickers, and anxiety-inducing charts. **The Simple Paper Ledger** rejects this noise. 

Our guiding vision is the quiet, grounding intimacy of a physical stationery notebook—a Japanese Traveler's Notebook or an artisanal leather-bound family ledger. By translating the warmth of creamy laid paper, vintage fountain pen inks, and tactile passbook stamps into a clean, modern digital experience, we make personal and family expense tracking effortless, intuitive, and reassuringly simple.

---

## 2. Color Palette & Ink Tokens

### Surface & Paper Layers
*   **Parchment Canvas (`#F9F6F0`):** The foundational warmth of unbleached notebook paper.
*   **Crisp Paper Card (`#FFFFFF`):** High-opacity pure sheet for primary transaction surfaces and slips.
*   **Pressed Paper Sheet (`#F3EFE6`):** Secondary grouping layer mimicking heavier cardstock or tab dividers.
*   **Paper Border / Ruled Line (`#E5DFD5`):** Subtle hairline dividers (1px) evoking lined accounting ruled notebooks.

### Fountain Pen Inks
*   **Primary Ink - Deep Navy (`#1A2530`):** Authoritative, ultra-legible fountain pen ink used for headings and key balances.
*   **Body Ink - Charcoal Slate (`#3B4856`):** Standard reading ink for descriptions, categories, and labels.
*   **Muted Ink - Graphite (`#7B8794`):** Timestamps, secondary metadata, and hint text.

### Stamps & Financial Status
*   **Credit / Income Stamp (`#2D6A4F`):** Vintage British racing / forest green ink on soft sage tint (`#E8F5EE`).
*   **Debit / Expense Stamp (`#BA3C2A`):** Terracotta crimson seal on soft bisque blush (`#FDF0ED`).
*   **Transfer Stamp (`#4A6B82`):** Muted slate transfer mark (`#EEF4F8`).
*   **Warning / Due Stamp (`#B87333`):** Warm copper-amber for unpaid utility bills or upcoming loan EMIs.

### Bank Identity Stamps
*   **SBI Passbook Badge:** Classic Indian Navy ink (`#0B4F8A`) on ice-blue linen tint (`#EBF3FA`).
*   **Canara Bank Passbook Badge:** Warm ochre/brass seal (`#9A6700`) on golden parchment tint (`#FDF6E3`).

---

## 3. Typography: Editorial Sans & Monospace Figures

We combine the humanist elegance of **Plus Jakarta Sans** (or **Inter**) with the precision of tabular monospace figures (**JetBrains Mono** or **Space Mono**) for financial balance accuracy.

*   **Display / Big Balances (`display-md` - 2.25rem / 36px, Bold 700):** Clear, uncluttered net worth and total balance with currency glyph (`₹`).
*   **Section Headers (`headline-sm` - 1.25rem / 20px, Semi-bold 600):** Clean, understated title styled like handwritten chapter titles.
*   **Ledger Row Items (`body-md` - 0.9375rem / 15px, Medium 500):** Legible, crisp item names with high contrast against the paper card background.
*   **Numeric Ledger Column (`mono-md` - 0.9375rem / 15px, 600):** Strict tabular numerals ensuring decimals and currency align vertically like an analog accounting register.
*   **Micro Labels & Badges (`label-xs` - 0.6875rem / 11px, Bold 700, Uppercase, Tracking 0.05em):** Rubber-stamp style badge typography.

---

## 4. Elevation, Texture & Tactile Details

*   **Zero Aggressive Drop Shadows:** We avoid heavy artificial drop-shadows. Shadows are ultra-soft and diffused (`0 2px 8px rgba(35, 30, 20, 0.04)`), replicating natural daylight falling on a flat desk.
*   **Ruled Line Grid:** List items are separated by continuous 1px ruled lines (`#EBE6DD`), evoking physical notebook paper.
*   **Tactile "Paper Slip" Form:** Quick expense entry is styled as a detachable paper deposit slip with subtle perforated border styling or corner clip.
*   **Stamp Badges:** Status indicators ("PAID", "VERIFIED", "PENDING", "CONTRA") use rounded bordered pills with uppercase letter-spaced type, resembling physical ink stamps on a passbook.

---

## 5. Components & Layout Patterns

### 1. Dual-Bank Passbook Cards
*   Displays **SBI** and **Canara Bank** balances side-by-side.
*   Shows "Verified Baseline" stamp with timestamp of last statement upload.
*   One-tap quick balance verification modal.

### 2. Paper Slip Quick-Logger
*   Always accessible at the top or via a floating pen button.
*   Single-row flow: Amount (`₹`) -> Bank (`SBI` / `Canara`) -> Category chip -> Quick Note -> "Log Entry".
*   Frictionless speed: logs in under 3 seconds.

### 3. Ruled Notebook Transaction Register
*   Grouped chronologically by day ("Today - 13 Nov", "Yesterday - 12 Nov").
*   Each row features:
    *   Category icon stamp.
    *   Transaction note and bank account badge (`SBI` / `Canara`).
    *   Right-aligned monospace amount (`-₹450.00` in terracotta or `+₹12,500.00` in forest green).
    *   Payment status tag (`Paid` or `Pending`).

### 4. Analog Spend Meter
*   A clean, pencil-drawn progress indicator showing month-to-date spending vs. monthly salary/budget.
*   Includes daily average burn rate indicator (`₹1,240 / day pace`).

---

## 6. Do's and Don'ts

### Do
*   **Do** embrace generous white space and natural paper warmth (`#F9F6F0`).
*   **Do** keep inputs looking like fill-in-the-blank ledger fields.
*   **Do** format all financial amounts with tabular monospace numerals for visual alignment.
*   **Do** offer instant switching between "Personal Ledger" and "Family Ledger".

### Don't
*   **Don't** use neon blues, purples, or harsh gradients.
*   **Don't** use black (`#000000`). Always use deep fountain pen navy or slate (`#1A2530`).
*   **Don't** overcrowd screens with complex nested menus. Keep actions upfront on the "sheet".
*   **Don't** use thick, jarring borders. Stick to gentle 1px parchment ruled lines (`#E5DFD5`).
