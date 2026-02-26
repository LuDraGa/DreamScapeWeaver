# Design System

## Color Palette

### Base Colors

```javascript
// Dark background (body)
background: "#080c14"  // Deep blue-black

// Cards and surfaces
cardBackground: "rgba(15,23,42,0.6)"  // Translucent slate with blur
cardBorder: "#1e293b"  // Dark slate borders

// Text colors
textPrimary: "#f1f5f9"    // Off-white (headings, labels)
textSecondary: "#94a3b8"  // Light slate (descriptions)
textMuted: "#64748b"      // Muted slate (subtle text)
```

### Accent Colors

```javascript
// Primary accent (buttons, links, active states)
primary: "#6366f1"        // Indigo
primaryLight: "#818cf8"   // Light indigo (hover states)
primaryMuted: "#a5b4fc"   // Muted indigo (selected states)

// Semantic colors
success: "#10b981"        // Green
warning: "#f59e0b"        // Amber
error: "#ef4444"          // Red
```

### Gradient Accents

```javascript
// Logo/brand gradient
brandGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)"  // Indigo → Purple

// Card hover effects (subtle)
cardHoverGradient: "linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05))"
```

## Typography

### Font Stack

```css
font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif
```

Load from Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
```

### Type Scale

```javascript
// Headings
h1: "text-xl font-semibold"      // 20px, 600 weight (page titles)
h2: "text-lg font-medium"        // 18px, 500 weight (section headers)
h3: "text-base font-medium"      // 16px, 500 weight (card titles)

// Body text
body: "text-sm"                  // 14px, 400 weight (default)
bodySmall: "text-xs"             // 12px, 400 weight (captions, meta)

// Special
button: "text-sm font-medium"    // 14px, 500 weight
input: "text-sm"                 // 14px, 400 weight
```

### Text Color Usage

```jsx
// Page titles
<h1 style={{ color: "#f1f5f9" }}>Create Story</h1>

// Section headers
<h2 style={{ color: "#f1f5f9" }}>Dreamscape Generator</h2>

// Descriptions/hints
<p style={{ color: "#64748b" }}>Enter your story seed or generate one</p>

// Labels
<label style={{ color: "#94a3b8" }}>Word Count</label>

// Muted text (timestamps, counts)
<span style={{ color: "#64748b" }}>Created 3 days ago</span>
```

## Spacing

### Scale

```javascript
// Padding/margin scale (Tailwind units)
1: "4px"    // p-1, m-1
2: "8px"    // p-2, m-2
3: "12px"   // p-3, m-3, gap-3
4: "16px"   // p-4, m-4, gap-4
5: "20px"   // p-5, m-5
6: "24px"   // p-6, m-6 (default card padding)
8: "32px"   // p-8, m-8
10: "40px"  // p-10, m-10
```

### Component Spacing

```jsx
// Cards
<div className="rounded-2xl p-6 mb-4">  // 24px padding, 16px bottom margin

// Sections within cards
<div className="space-y-4">  // 16px vertical gap between children

// Form fields
<div className="flex flex-col gap-3">  // 12px vertical gap

// Button groups
<div className="flex gap-2">  // 8px horizontal gap

// Page content
<div className="max-w-4xl mx-auto">  // Max 896px width, centered
```

## Border Radius

```javascript
// Scale
rounded: "4px"     // Small elements (chips, tags)
roundedMd: "6px"   // Inputs, small buttons
roundedLg: "8px"   // Medium buttons
roundedXl: "12px"  // Cards, panels, large buttons
rounded2xl: "16px" // Hero cards, main content areas
roundedFull: "9999px"  // Pills, avatar, circular buttons
```

### Usage

```jsx
// Cards/panels
className="rounded-2xl"

// Buttons (medium)
className="rounded-xl"

// Inputs
className="rounded-lg"

// Pills/chips
className="rounded-full"
```

## Shadows

### Elevation System

```javascript
// No shadow (default for dark theme)
shadow: "none"

// Subtle shadow (hover states)
shadowMd: "0 4px 6px -1px rgba(0, 0, 0, 0.3)"

// Pronounced shadow (modals, dropdowns)
shadowLg: "0 10px 15px -3px rgba(0, 0, 0, 0.4)"

// Glow effect (focus states)
shadowGlow: "0 0 0 3px rgba(99, 102, 241, 0.3)"
```

### Usage

```jsx
// Card hover
<div className="transition-all hover:shadow-md">

// Button focus
<button className="focus:outline-none focus:ring-2 focus:ring-indigo-500">

// Dropdown
<div className="shadow-lg">
```

## Buttons

### Primary Button

```jsx
<button className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
  style={{ background: "#6366f1", color: "#fff" }}>
  Generate
</button>

// Hover state
style={{ background: "#818cf8", color: "#fff" }}

// Disabled state
style={{ background: "#1e293b", color: "#64748b", cursor: "not-allowed" }}
```

### Secondary Button

```jsx
<button className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
  style={{ background: "rgba(99,102,241,0.1)", color: "#a5b4fc" }}>
  Cancel
</button>

// Hover state
style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}
```

### Ghost Button

```jsx
<button className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
  style={{ background: "transparent", color: "#94a3b8" }}>
  Advanced
</button>

// Hover state
style={{ background: "rgba(15,23,42,0.5)", color: "#f1f5f9" }}
```

### Icon Button

```jsx
<button className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
  style={{ background: "transparent", color: "#64748b" }}>
  <I.X className="w-4 h-4" />
</button>

// Hover state
style={{ background: "rgba(15,23,42,0.5)", color: "#f1f5f9" }}
```

## Inputs

### Text Input

```jsx
<input
  className="w-full px-4 py-2 rounded-lg text-sm transition-all"
  style={{
    background: "rgba(15,23,42,0.5)",
    border: "1px solid #1e293b",
    color: "#f1f5f9"
  }}
  placeholder="Enter text..."
/>

// Focus state
style={{
  background: "rgba(15,23,42,0.8)",
  border: "1px solid #6366f1",
  outline: "none"
}}
```

### Textarea

```jsx
<textarea
  className="w-full px-4 py-3 rounded-xl text-sm transition-all resize-none"
  style={{
    background: "rgba(15,23,42,0.5)",
    border: "1px solid #1e293b",
    color: "#f1f5f9",
    minHeight: "120px"
  }}
  placeholder="Enter your story seed..."
/>
```

### Select

```jsx
<select
  className="px-4 py-2 rounded-lg text-sm transition-all"
  style={{
    background: "rgba(15,23,42,0.5)",
    border: "1px solid #1e293b",
    color: "#f1f5f9"
  }}
>
  <option>Option 1</option>
</select>
```

### Slider

```jsx
<input
  type="range"
  min={1}
  max={10}
  value={value}
  className="w-full"
  style={{
    background: "#1e293b",
    height: "4px",
    borderRadius: "999px"
  }}
/>

// Custom thumb styling (in global CSS)
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: #6366f1;
  cursor: pointer;
  border: 2px solid #818cf8;
}
```

## Cards

### Default Card

```jsx
<div className="rounded-2xl p-6 transition-all"
  style={{
    background: "rgba(15,23,42,0.6)",
    border: "1px solid #1e293b"
  }}>
  <h3 style={{ color: "#f1f5f9" }}>Card Title</h3>
  <p style={{ color: "#64748b" }}>Card content</p>
</div>
```

### Clickable Card (Preset Selection)

```jsx
<button className="w-full p-4 rounded-xl text-left transition-all"
  style={{
    background: isSelected
      ? "rgba(99,102,241,0.12)"
      : "rgba(15,23,42,0.6)",
    border: isSelected
      ? "1px solid #6366f1"
      : "1px solid #1e293b"
  }}>
  <div className="flex items-center gap-3">
    <span className="text-2xl">{preset.emoji}</span>
    <div>
      <div style={{ color: "#f1f5f9" }}>{preset.name}</div>
      <div style={{ color: "#64748b" }}>{preset.subtitle}</div>
    </div>
  </div>
</button>
```

## Badges/Chips

### Status Badge

```jsx
<span className="px-2 py-1 rounded-full text-xs font-medium"
  style={{
    background: "rgba(16,185,129,0.15)",
    color: "#10b981"
  }}>
  Active
</span>

// Variants
// Warning: background: "rgba(245,158,11,0.15)", color: "#f59e0b"
// Error: background: "rgba(239,68,68,0.15)", color: "#ef4444"
// Neutral: background: "rgba(100,116,139,0.15)", color: "#94a3b8"
```

### Feedback Chip (Toggle)

```jsx
<button className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
  style={{
    background: isSelected
      ? (chip.positive ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)")
      : "rgba(15,23,42,0.5)",
    color: isSelected
      ? (chip.positive ? "#10b981" : "#ef4444")
      : "#94a3b8"
  }}>
  {chip.label}
</button>
```

## Animations

### Keyframes (Global CSS)

```css
@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
```

### Transition Classes

```jsx
// All properties
className="transition-all duration-200"

// Specific properties
className="transition-colors duration-200"
className="transition-transform duration-200"
className="transition-opacity duration-200"
```

### Loading Skeleton

```jsx
<div className="rounded-xl"
  style={{
    background: "rgba(15,23,42,0.6)",
    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
    height: "120px"
  }}
/>
```

## Icons

SVG icons with currentColor for easy theming:

```jsx
const I = {
  Sparkles: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"/>
    </svg>
  ),
  // ... more icons
}

// Usage
<I.Sparkles className="w-5 h-5" style={{ color: "#6366f1" }} />
```

## Scrollbar

Custom scrollbar styling (Global CSS):

```css
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 999px;
}

::-webkit-scrollbar-thumb:hover {
  background: #334155;
}
```

## Layout

### Page Container

```jsx
<div className="max-w-4xl mx-auto px-4 py-6">
  {/* Page content */}
</div>
```

### Sidebar Layout

```jsx
<div className="flex h-screen overflow-hidden" style={{ background: "#080c14" }}>
  {/* Sidebar */}
  <nav className="w-[200px] py-4 shrink-0"
    style={{
      background: "rgba(15,23,42,0.4)",
      borderRight: "1px solid #1e293b"
    }}>
    {/* Nav items */}
  </nav>

  {/* Main content */}
  <main className="flex-1 overflow-y-auto p-8">
    {/* Page content */}
  </main>
</div>
```

### Grid Layouts

```jsx
// 2-column grid (responsive)
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// 3-column grid (responsive)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// Auto-fit grid (flexible columns)
<div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
```
