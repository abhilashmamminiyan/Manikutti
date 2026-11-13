# Design System Document: The Handwritten Pen & Paper Ledger

## 1. Overview & Creative North Star
**Creative North Star: "The Living Diary & Fountain Pen"**
This design system captures the deeply human, tactile, and mindful act of writing your daily expenses with a fountain pen in a physical lined notebook. It completely rejects sterile, impersonal digital grids in favor of the warmth of real lined paper, blue margin lines, handwritten ink strokes, washi-tape sticky notes, and official hand-stamped bank seals.

When a user adds an expense, they are not "submitting a database form"—they are **writing an ink line into their personal notebook**.

---

## 2. Color Palette & Ink Materials

### Paper Surfaces
*   **Notebook Parchment (`#FFFDF7`):** The creamy, natural hue of heavy journal paper.
*   **Ruled Line Blue (`#DDE6EE`):** Faint, nostalgic blue notebook lines (1px) spaced every 44px.
*   **Left Margin Red (`#E57373`):** The iconic notebook margin line (1.5px) dividing the date margin from the journal body.
*   **Desk / Surface Background (`#EFECE6`):** Warm oak desk background upon which the notebook rests.
*   **Sticky Note Yellow (`#FFF9D2`):** Textured yellow memo paper for quick dual-bank balances (SBI & Canara).

### Fountain Pen Inks
*   **Classic Blue-Black Ink (`#1A2E40`):** Authoritative fountain pen ink for expense descriptions and notes.
*   **Royal Ink Navy (`#0E3A75`):** Heading ink, total balances, and bank account tags.
*   **Debit Terracotta Crimson (`#A82A2A`):** Red ink used for outgoing debits and expenses (`-₹450`).
*   **Credit Hunter Green (`#1E5E3A`):** Green ink for incoming salary and deposits (`+₹85,000`).
*   **Graphite Pencil (`#606B75`):** Subdued secondary notes, timestamps, and categories.

### Rubber Stamps
*   **SBI Passbook Ink Stamp:** Deep indigo stamp (`#0B4F8A`) in an archival double-lined rectangular seal.
*   **Canara Bank Stamp:** Golden-brass stamp (`#8C6000`) in an archival seal.
*   **Cleared Stamp:** Vintage green ink rubber stamp (`#1E5E3A`) stamped at a subtle -2° angle.

---

## 3. Typography: Hand-Crafted Organic Penmanship

We pair natural handwritten scripts with legible cursive and clean monoline pen figures:

*   **Primary Handwriting (Kalam / Caveat / Patrick Hand):**
    *   `display-lg` (32px, Bold): Notebook cover & Monthly titles ("November 2026 Cashbook").
    *   `body-lg` (18px, Medium): Expense narration ("Fresh cow milk & vegetables from Nilgiris").
    *   `amount-num` (19px, Bold): Tabular ink numerals written cleanly on the baseline rule.
*   **Secondary Notes & Hints (Indie Flower / Patrick Hand - 14px):** Margin date stamps, category annotations, and daily tallies.
*   **Stamp Typography (Monospace Caps - 11px):** "SBI VERIFIED", "CNB CLEARED", "PAID".

---

## 4. Tactile Anatomy of the Paper Sheet

1. **Spiral Binder or Book Spine:** Realistic spiral wire loops down the left spine.
2. **Left Margin Gutter:** 60px margin on the left with a red vertical rule; holds the day and date stamps ("13 Fri", "12 Thu").
3. **Writing Baseline Alignment:** Every transaction sits precisely on a 44px ruled horizontal blue line. Text does not float aimlessly.
4. **Interactive Pen Form:** The input row looks like a blank ruled line with a blinking pen tip cursor (`|`).
5. **Sticky Note Bank Passbooks:** Dual-bank summary (SBI & Canara Bank) appears as a yellow post-it note held with a brass paperclip at the top right of the notebook.
6. **Built-in Screen Thumb Index Tabs (Executive Organizer Model):**
   * As modeled after physical executive organizers and planners, the bookmark tabs sit **directly inside the screen/page itself along the right margin**, eliminating horizontal screen overflow.
   * Four die-cut thumb index tabs stacked along the right edge of the paper:
     * `DATE Tab` (Soft Sky Blue `#BCD7EF` / text `#15365A`): Filters by month (November 2026, October 2026, All Dates).
     * `PAYEE Tab` (Soft Peach `#F6CEBF` / text `#5C2518`): Filters by recipient / merchant.
     * `BANK Tab` (Soft Sage Green `#C6E6CD` / text `#164624`): Filters by SBI or Canara Bank account.
     * `SORT Tab` (Soft Lavender `#E2D1E8` / text `#482054`): Sorts by Date (Newest/Oldest) and Amount (High/Low).
   * **Printed Executive Header**: Blue month banner (`2026 NOVEMBER`), week & day indicator (`WK 46 | DAY 317 FRIDAY`), and bold calendar day number (`13`).
   * **Fore-Edge Stack & Leather Trim**: Stacked page fore-edge sliver and saddle-leather casing framing the screen.
   * **Bottom Calendar Matrix**: Authentic printed month calendar strip at the footer tracking daily activity.
7. **Mobile Pocket Diary Adaptations:**
   * **Red Margin Gutter**: Calibrated to 46px-50px on mobile screens (compared to 72px on desktop), allowing dates like "13 Nov" to sit comfortably in the margin while maximizing horizontal writing width for transaction notes.
   * **Touch-Friendly Index Strip**: On mobile viewports (< 640px), index bookmarks shift from side-protruding tabs into a horizontal scrollable tab strip at the top of the notebook to prevent horizontal viewport overflow.
   * **Numeric Keypad Ready**: Amount input utilizes `inputmode="decimal"` for instantaneous mobile numeric keyboard launch.
   * **Compact Passbook Memo**: Dual-bank sticky note stacks SBI and Canara Bank balances side-by-side in a 2-column layout to preserve vertical space.
   * **Zero Horizontal Scroll**: Strict `overflow-x: hidden` with truncated descriptions and flex alignment ensures 100% compliance down to 320px mobile viewports.

---

## 5. Do's and Don'ts

### Do
*   **Do** write entries directly on the blue ruled lines.
*   **Do** format amounts as if inked with a pen (`-₹1,420.00` in crimson ink, `+₹85,000.00` in forest ink).
*   **Do** include subtle organic imperfections: slight hand-drawn underlines, ink stamps with subtle angle variations (-1° to 1.5°), and paperclip accents.
*   **Do** animate newly added expenses with a gentle fade-and-ink-bleed transition.

### Don't
*   **Don't** use rigid rectangular input boxes with grey borders. Use handwritten underline fields.
*   **Don't** use pure digital black (`#000000`). Always use Blue-Black Fountain Pen Ink (`#1A2E40`).
*   **Don't** use standard sans-serif system fonts for the ledger body; preserve the handwritten journaling soul throughout.
