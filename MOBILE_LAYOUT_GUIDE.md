# Mobile Layout Guide

This guide describes how to make Babeling pages work well on mobile devices using the existing Next.js, shadcn/ui, and Tailwind setup.

The core rule is: write the mobile layout first, then add breakpoint overrides for larger screens.

```tsx
// Good: mobile default, then wider layouts
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" />

// Risky: desktop layout applies to every viewport
<div className="grid grid-cols-3 gap-4" />
```

## Breakpoints

Use Tailwind breakpoints as layout upgrades:

- Default classes apply to phones.
- `sm:` applies at small tablets and larger.
- `md:` applies at medium screens and larger.
- `lg:` applies at desktop sizes and larger.

Prefer the smallest number of breakpoints that solves the layout. Most pages only need default, `sm:`, and `lg:`.

## Page Containers

Every normal page should have side padding on mobile so content does not touch the viewport edges.

```tsx
<div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
  {children}
</div>
```

Use this pattern for pages like upload, library, review, and preferences.

For dense reader surfaces where edge-to-edge content is intentional, still add safe internal padding to controls, popovers, toolbars, and text panes.

## Sections

Use smaller spacing and radius on mobile, then increase slightly on larger screens.

```tsx
<section className="rounded-lg border bg-card p-4 shadow-sm sm:rounded-xl sm:p-5">
  {children}
</section>
```

Avoid putting large page sections inside nested cards. Cards are best for repeated items, modals, and framed tools.

## Grids

Never force multi-column layouts on phones.

```tsx
// Cards or results
<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
  {items}
</div>

// Two-column form area
<div className="grid gap-4 sm:grid-cols-2">
  {fields}
</div>
```

For custom layouts with a center control, stack by default and use a desktop grid at `sm:`.

```tsx
<div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
  <SourceControl />
  <SwapButton />
  <TargetControl />
</div>
```

## Flex Rows

Any row that contains multiple controls should usually stack on mobile.

```tsx
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <StatusText />
  <PrimaryAction />
</div>
```

Use `flex-wrap` for compact filter chips.

```tsx
<div className="flex flex-wrap gap-2">
  {filters}
</div>
```

## Buttons

Primary page actions should be easy to tap and often full-width on phones.

```tsx
<Button className="h-12 w-full rounded-xl px-6 font-semibold sm:w-auto">
  Start reading
</Button>
```

Small secondary controls can stay compact, but make tap targets at least `h-9` on mobile.

```tsx
<Button size="sm" variant="outline" className="h-9 rounded-full px-3 sm:h-8">
  Previous
</Button>
```

For icon-only controls, use stable square dimensions.

```tsx
<Button size="icon" variant="outline" className="h-9 w-9 rounded-full">
  <Repeat className="h-4 w-4" />
</Button>
```

## Tabs

Tabs need to fit within the viewport. Use a grid, smaller mobile text, and truncation.

```tsx
<TabsList className="grid h-12 w-full grid-cols-3 gap-1 bg-transparent p-0 sm:gap-4">
  <TabsTrigger className="min-w-0 overflow-hidden px-1 text-xs sm:px-3 sm:text-sm">
    <Icon className="h-4 w-4 shrink-0" />
    <span className="min-w-0 truncate">Find a book</span>
  </TabsTrigger>
</TabsList>
```

If tab labels are still too long in translated UI strings, keep the icon visible and let the label truncate.

## Text Overflow

Use `min-w-0` on flex/grid children that contain text. Without it, text can force the layout wider than the viewport.

```tsx
<div className="flex min-w-0 items-center gap-3">
  <div className="min-w-0">
    <div className="truncate font-semibold">{title}</div>
    <div className="truncate text-sm text-muted-foreground">{subtitle}</div>
  </div>
  <Badge className="shrink-0" />
</div>
```

Use these utilities deliberately:

- `truncate` for single-line labels.
- `line-clamp-2` or `line-clamp-3` for cards.
- `break-words` for user-generated text that may contain long words or URLs.
- `shrink-0` for icons, badges, and fixed controls.
- `min-w-0` for the text container inside a flex or grid row.

## Forms

Form fields should be full-width on mobile.

```tsx
<div className="flex flex-col gap-4 sm:flex-row">
  <div className="w-full sm:w-1/2">
    <Label>Language</Label>
    <Select />
  </div>
  <div className="w-full sm:w-1/2">
    <Label>Author</Label>
    <Input />
  </div>
</div>
```

Avoid raw `w-1/2` without a mobile default.

```tsx
// Good
className="w-full sm:w-1/2"

// Risky
className="w-1/2"
```

## Fixed Heights

Fixed desktop heights often feel cramped on phones. Increase or relax them on mobile, then restore the compact desktop height later.

```tsx
const panelHeight = activeTab === "import"
  ? "h-[620px] sm:h-[520px]"
  : "h-[360px] sm:h-[320px]";
```

If content can vary significantly, prefer `min-h-*` plus scrolling inside the panel.

```tsx
<div className="min-h-[420px] overflow-y-auto">
  {content}
</div>
```

## Cards

Cards in result grids should not preserve a wide desktop aspect ratio on phones.

```tsx
<article className="flex min-h-40 flex-col rounded-sm border p-4 sm:aspect-[21/10] sm:min-h-0">
  {content}
</article>
```

Use line clamping for titles and stable dimensions for footers so cards do not jump around when content changes.

## Reader-Specific Notes

The reader UI depends on stable token indexes and alignment overlays. When adjusting mobile layout in reader components:

- Do not re-tokenize text on the client.
- Do not change the structure of `words`, `spaces`, or token IDs.
- Prefer changing wrappers, padding, grid/flex layout, and overflow behavior.
- Verify popovers still anchor to the correct token.
- Keep DOM-heavy areas simple; avoid expensive blur/filter effects on large containers.

## Mobile Checklist

Before considering a page mobile-ready, check:

- The page has `px-4` or equivalent side padding.
- No desktop-only grid is active on phones.
- Primary buttons are full-width or easy to tap.
- Icon buttons have stable square dimensions.
- Long labels truncate or wrap intentionally.
- Flex/grid text children use `min-w-0`.
- Filters and tabs do not overflow horizontally.
- Cards are one column on phones.
- Fixed-height panels still have enough room or scroll internally.
- Nothing important is hidden behind sticky nav or browser UI.

## Example: Upload Page Pattern

The upload page uses these patterns:

```tsx
<div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
  <section className="mt-8 rounded-lg border bg-card p-4 shadow-sm sm:mt-10 sm:rounded-xl sm:p-5">
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
      <LanguageSelect />
      <SwapButton />
      <LanguageSelect />
    </div>
  </section>

  <div className="mt-8 sm:mt-10">
    <TabbedInputCard />
  </div>

  <div className="mt-6 flex flex-col gap-4 sm:mt-8 sm:flex-row sm:items-center sm:justify-between">
    <span className="text-sm text-muted-foreground">Translation and alignment may take a moment.</span>
    <Button className="h-12 w-full rounded-xl px-6 font-semibold sm:w-auto">
      Start reading
    </Button>
  </div>
</div>
```

