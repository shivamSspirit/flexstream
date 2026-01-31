# Melee Markets UI/UX Analysis
## Complete Design System Extraction from Screenshots

---

## 1. Color Palette

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MELEE COLOR SYSTEM                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  BACKGROUNDS                                                                │
│  ───────────                                                                │
│  Base:           #0a0a0a (Pure dark, almost black)                         │
│  Card:           #111111 (Slightly elevated)                               │
│  Card Hover:     #161616 (Subtle lift)                                     │
│  Input/Field:    #1a1a1a (Form backgrounds)                                │
│                                                                             │
│  PRIMARY ACCENT (The "Melee Green")                                        │
│  ─────────────────────────────────                                         │
│  Live/Active:    #22c55e (Bright green - status indicators)                │
│  Winner:         #22c55e (Same green for winner badges)                    │
│  PnL Positive:   #22c55e (Profit numbers)                                  │
│  CTA Button:     #22c55e (Primary actions)                                 │
│  Chart Lines:    #22c55e (Winning outcome line)                            │
│                                                                             │
│  SECONDARY ACCENTS                                                          │
│  ─────────────────                                                          │
│  Yellow/Pending: #fbbf24 (Pending status, Draw outcome)                    │
│  Purple/Alt:     #a855f7 (Secondary outcome lines)                         │
│  Blue/Info:      #3b82f6 (Links, info states)                              │
│  Red/Negative:   #ef4444 (Errors, negative PnL)                            │
│                                                                             │
│  TEXT                                                                       │
│  ────                                                                       │
│  Primary:        #ffffff (White - titles, important)                       │
│  Secondary:      #9ca3af (Gray - metadata, labels)                         │
│  Muted:          #6b7280 (Darker gray - hints)                             │
│  Accent:         #22c55e (Green - highlights)                              │
│                                                                             │
│  BORDERS                                                                    │
│  ───────                                                                    │
│  Default:        rgba(255,255,255,0.06) (Almost invisible)                 │
│  Hover:          rgba(255,255,255,0.12) (Subtle on hover)                  │
│  Active:         #22c55e (Green border for selected)                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Typography

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MELEE TYPOGRAPHY                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FONT FAMILY                                                                │
│  ───────────                                                                │
│  Primary:        Inter (or system sans-serif)                              │
│  Monospace:      JetBrains Mono (for numbers, SOL amounts)                 │
│                                                                             │
│  HIERARCHY                                                                  │
│  ─────────                                                                  │
│  Page Title:     24px, font-weight: 600, white                             │
│  Card Title:     16px, font-weight: 600, white                             │
│  Market Size:    14px, font-weight: 500, #22c55e (green)                   │
│  Labels:         12px, font-weight: 400, #9ca3af (gray)                    │
│  Badge Text:     11px, font-weight: 500, uppercase                         │
│  PnL Numbers:    16px, font-weight: 700, monospace, green                  │
│  Percentages:    14px, font-weight: 600, white                             │
│                                                                             │
│  SPECIAL TREATMENTS                                                         │
│  ──────────────────                                                         │
│  SOL Amounts:    Always green (#22c55e), monospace                         │
│  Time Left:      Red countdown (#ef4444) when urgent                       │
│  Winner Text:    Green with checkmark icon                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MELEE LAYOUT PATTERNS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  HEADER (Sticky)                                                            │
│  ────────────────                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ [Logo]  Explore  Leaderboard  │  Refer Friends  [Suggest Market]  [User]│
│  └──────────────────────────────────────────────────────────────────────┘  │
│  Height: 64px                                                               │
│  Background: #0a0a0a with subtle bottom border                             │
│                                                                             │
│  MARKET CARD (Horizontal Layout)                                            │
│  ───────────────────────────────                                            │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ ┌──────────┐  Title of Market                    Status    Size    │    │
│  │ │          │  ─────────────────                  ───────   ────    │    │
│  │ │  IMAGE   │  Time Left: 1D:09:54:04            ● Live   19.17 SOL│    │
│  │ │  120x120 │                                                       │    │
│  │ │          │  ○ Outcome A ████████████░░ 64.2%                    │    │
│  │ │          │  ○ Outcome B ████░░░░░░░░░░ 26.6%                    │    │
│  │ └──────────┘                                                       │    │
│  │              ✓ Winner: [Outcome]                                   │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│  Card: rounded-xl (12px), bg-[#111], p-4                                   │
│  Image: rounded-lg (8px), object-cover                                     │
│                                                                             │
│  GRID                                                                       │
│  ────                                                                       │
│  Desktop: 3 columns, gap-4 (16px)                                          │
│  Tablet: 2 columns                                                          │
│  Mobile: 1 column                                                           │
│                                                                             │
│  LEADERBOARD PODIUM                                                         │
│  ─────────────────                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │           [2]              [1]              [3]                     │   │
│  │         ┌─────┐          ┌─────┐          ┌─────┐                  │   │
│  │         │ AVA │          │ AVA │          │ AVA │                  │   │
│  │         └─────┘          └─────┘          └─────┘                  │   │
│  │        username         username         username                  │   │
│  │     PnL: +$2,470      PnL: +$9,389      PnL: +$1,592              │   │
│  │     Vol: $2,044       Vol: $25,373      Vol: $568                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  Center card (1st place) is larger and highlighted                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Component Patterns

### Status Badges
```
● Live        → Green dot + "Live" text, green background/10
● Pending     → Yellow dot + "Pending" text, yellow background/10
● Resolved    → Green checkmark + "Resolved" text, green background/10
● Ended       → Gray text, no dot
```

### Winner Indicator
```
✓ Winner: [Outcome Name]
- Green checkmark icon (✓)
- "Winner" label in green
- Outcome name in white
- Background: rgba(34, 197, 94, 0.1)
- Border-left: 3px solid #22c55e
```

### Market Size Display
```
Market Size
19.17 SOL

- Label: 12px, gray, uppercase
- Value: 14px, green (#22c55e), font-weight: 500
- Always right-aligned
```

### Progress Bars (Outcome Percentages)
```
○ Liverpool ████████████████░░░░ 64.2%
○ Draw      ██████░░░░░░░░░░░░░░ 26.6%
○ Newcastle ██░░░░░░░░░░░░░░░░░░  9.2%

- Small colored dot (matches outcome color)
- Outcome name
- Progress bar (filled portion matches dot color)
- Percentage (right-aligned)
```

### Price Chart
```
- Multi-line chart showing outcome probabilities over time
- Each outcome has different color (green, yellow, purple)
- Y-axis: 0% to 100%
- X-axis: Time
- Labels on right side showing current % + outcome name
- Time filters: 1D, 1W, 1M, ALL
```

---

## 5. Interaction Patterns

### Card Hover
```css
.card {
  transition: all 0.2s ease;
}
.card:hover {
  background: #161616;
  transform: translateY(-2px);
  border-color: rgba(255,255,255,0.12);
}
```

### Button Styles
```
Primary (Suggest a Market):
- Background: #22c55e
- Text: black, font-weight: 600
- Padding: 8px 16px
- Border-radius: 8px
- Hover: brightness(1.1)

Secondary (Refer Friends):
- Background: transparent
- Text: #22c55e
- Border: none
- Hover: underline
```

### Tab Navigation
```
All | Live | Pre Launch | Pending Resolution | Ended

- Active: White text, subtle underline or background
- Inactive: Gray text (#9ca3af)
- No borders between tabs
- Horizontal scroll on mobile
```

---

## 6. Key UI Insights

### What Makes Melee Feel Premium:
1. **Minimal borders** - Cards differentiate through background, not lines
2. **Consistent green accent** - #22c55e is THE color (like Spotify)
3. **Horizontal cards** - Image left, content right (scannable)
4. **Data density** - Shows key info without clutter
5. **Visual thumbnails** - Team logos, crypto icons make cards recognizable
6. **Status clarity** - Live/Resolved/Pending instantly visible

### What Makes It Feel "Degen":
1. **SOL amounts in green** - Money is always highlighted
2. **PnL prominently displayed** - Profit is the goal
3. **Countdown timers** - Urgency and FOMO
4. **Winner badges** - Social proof of outcomes
5. **Leaderboard prominence** - Status game

---

## 7. Comparison: Melee vs Current Flex

| Aspect | Melee | Current Flex |
|--------|-------|--------------|
| Card Layout | Horizontal (image + content) | Vertical (stacked) |
| Primary Color | Green (#22c55e) | Mint (#E0FF62) |
| Card Background | #111 | #0c0c0c |
| Status Badges | Colored dots + text | Text only |
| Winner Display | Prominent green badge | Not implemented |
| Market Size | Green, right-aligned | Gray, bottom |
| Image/Thumbnail | Large, left side | Small/none |
| Progress Bars | Colored by outcome | Single green |

---

## 8. Recommended Changes for Flex

1. **Switch to horizontal card layout** (image left, content right)
2. **Use consistent green accent** (keep #E0FF62 but use more)
3. **Add prominent status badges** with colored dots
4. **Show market size in accent color** (always visible)
5. **Add winner badges** with checkmark
6. **Include team/topic thumbnails** in cards
7. **Simplify progress bars** (one per outcome, colored)
8. **Add countdown urgency** (red when < 1 hour)

---

*Analysis based on Melee Markets alpha (January 2026)*
