# MMEMME Design System

Status: **Brand source of truth for product implementation**  
Applies to: public website, customer web app, Expo mobile app, vendor web portal,
and internal operations console  
Last updated: 27 August 2026

This document translates the approved identity in
[`docs/MME MME BRAND GUIDLINE.pdf`](docs/MME%20MME%20BRAND%20GUIDLINE.pdf) and
[`docs/MME MME.png`](docs/MME%20MME.png) into an accessible, implementation-ready
digital product system. The supplied brand guide owns the logo, its proportions,
brand colors, and display typeface. This document owns their use in product UI.

## 1. Product context

- **What MMEMME is:** a curated Nigerian event marketplace. The first market is
  Lagos couples booking wedding venues and caterers through a managed workflow.
- **Who it serves:** couples first; venue and catering businesses through a web
  portal; MMEMME operators through an internal console.
- **What it must communicate:** celebration without frivolity, choice without
  clutter, and trust without pretending that verification guarantees fulfillment.
- **Project types:** editorial marketing site, searchable marketplace, transactional
  web and mobile apps, vendor onboarding portal, and data-dense operations console.
- **Experience promise:** find a curated venue or caterer, understand the complete
  terms, and secure the booking without scattered social-media conversations.
- **Memorable quality:** the fresh green event marketplace that makes a serious
  booking feel clear, supported, and ready to celebrate.

## 2. Brand foundation

### Brand idea

**Everything for the event, brought together.**

The curved MMEMME symbol represents connection, choice, event spaces, and the
relationship between customers, venues, and vendors. Product layouts should echo
that idea by bringing fragmented decisions into calm, clearly related groups.

### Brand attributes

| Attribute | Express it through | Do not turn it into |
|---|---|---|
| Connected | visible relationships, timelines, grouped choices | tangled decoration or social-network metaphors |
| Trustworthy | evidence, dates, complete terms, calm deep green | vague shields, guarantees, or institutional coldness |
| Energetic | lime accents, active photography, decisive headlines | fluorescent screens or constant animation |
| Accessible | plain language, large targets, obvious next steps | childish copy or oversimplified financial terms |
| Modern Nigerian | real local celebrations, names, locations, and context | generic stock weddings or costume-like visual clichés |

### Aesthetic direction

- **Direction:** modern editorial marketplace with energetic brand geometry.
- **Decoration:** intentional. Photography, type, the connection mark, and blocks
  of brand color create character; ornament does not compete with booking facts.
- **Layout:** hybrid. Marketing can use bold crops and asymmetry; product flows use
  a disciplined grid, predictable alignment, and stable controls.
- **Color:** restrained. Deep green is the primary interface color; lime is a
  memorable accent and branded surface, not default body text.
- **Motion:** intentional and functional. Movement explains navigation or status;
  it never delays search, quoting, checkout, or support.

### Deliberate design risks

1. **Bebas Bold at editorial scale.** Tall uppercase headlines give MMEMME a face
   that generic marketplace sans-serifs do not. The cost is lower readability in
   paragraphs, so it is restricted to short brand-led display text.
2. **Lime as a field, not a label color.** Large lime moments make the identity
   unmistakable. Because lime fails contrast with white, it always carries deep
   green or ink text and never becomes a white-text CTA.
3. **Trust before fantasy.** Vendor pages lead with verified facts, price guidance,
   area, and capacity alongside strong imagery. This is less dreamy than a typical
   wedding directory and more credible for a deposit-taking product.

## 3. Logo system

### Approved forms

- **Horizontal:** the symbol sits between the two `MME` wordmarks. Use in public
  website headers, wide navigation, presentations, and horizontal sponsorships.
- **Stacked:** the symbol sits beside stacked `MME MME` lettering. Use in mobile
  headers, app launch screens, compact cards, documents, and square placements.
- **Symbol-only:** use only for the installed app icon, favicon, avatar, or a compact
  authenticated header where the full wordmark has already appeared. The source
  brand file must provide the export; do not redraw or crop it from a screenshot.

The current PNG is a reference/render asset, not the final multi-size production
asset pack. Before release, obtain designer-exported SVGs and transparent PNGs for
both arrangements, the symbol, and all approved color treatments.

### Approved color treatments

- Deep-green mark on lime.
- Lime mark on deep green.
- Deep-green mark on white or very light neutral.
- Black on white and white on black when brand colors are unavailable.
- White on photography only when the placement has a tested, quiet dark region or
  an approved solid deep-green backing plate.

### Clear space and size

- Clear space on every side is at least the height of one wordmark `M` stem (`1M`).
- Digital minimums: horizontal mark `120px` wide; stacked mark `72px` wide;
  symbol-only `24px`. At smaller sizes, use the symbol-only export.
- The app icon uses the symbol centered in the safe zone with no wordmark. Validate
  iOS masks and Android adaptive-icon safe zones at final export.
- Never place the mark flush to a screen edge. Use at least `space-4` (`16px`) on
  compact mobile headers and `space-6` (`24px`) on web.

These digital clear-space and minimum-size rules extend the supplied guide. If the
brand designer supplies stricter measured construction rules, those supersede them.

### Never

- Stretch, squeeze, rotate, warp, rearrange, or retype the logo.
- Change its proportions, symbol, typography, spacing, or approved arrangement.
- Add gradients, shadows, outlines, bevels, masks, or multiple unapproved colors.
- Recolor it outside the approved deep green, lime, black, and white treatments.
- Place it on busy imagery or a surface with insufficient contrast.
- Use the wordmark as ordinary text or use Bebas Bold to recreate the mark.

### Product naming

Write the product name as **MMEMME** in prose, navigation, stores, metadata, and
accessible labels. The visual logo may display `MME MME` as designed. Screen readers
must receive `MMEMME`, not a letter-by-letter reading of the artwork.

## 4. Color system

### Brand primitives

| Token | Value | Role |
|---|---:|---|
| `brand.deepGreen` | `#294A41` | trust, primary actions, dark branded fields |
| `brand.lime` | `#97C354` | energy, selected accents, progress, branded fields |
| `brand.black` | `#211D1E` | approved monochrome logo treatment only |
| `brand.white` | `#FFFFFF` | approved monochrome logo and surface treatment |

The deep green and lime values are fixed by the supplied brand guide. Do not sample
alternate values from compressed screenshots or the reference PNG.

### Product neutrals

The product uses green-influenced neutrals so operational screens remain coherent
with the brand without becoming saturated.

| Token | Value | Typical use |
|---|---:|---|
| `neutral.0` | `#FFFFFF` | raised surfaces, inputs |
| `neutral.25` | `#FBFCF8` | main page canvas |
| `neutral.50` | `#F4F7F3` | subdued surface, skeleton |
| `neutral.100` | `#E8EEE9` | soft border and separators |
| `neutral.200` | `#D2DDD5` | strong border and disabled control |
| `neutral.400` | `#829088` | placeholder and decorative icon |
| `neutral.600` | `#53625C` | secondary text |
| `neutral.800` | `#283A34` | strong secondary text |
| `neutral.950` | `#15231F` | primary text and price |

### Semantic colors

Semantic colors communicate states and never replace a written label or icon.

| Meaning | Strong | Soft surface | Border | Customer wording example |
|---|---:|---:|---:|---|
| Success | `#237A4B` | `#E8F5EC` | `#A9D6B8` | Booking confirmed |
| Warning | `#8A5700` | `#FFF4D8` | `#E6C777` | Quote expires today |
| Error | `#B42318` | `#FDECEA` | `#E9A6A1` | Payment was not completed |
| Info | `#246B8E` | `#E9F4FA` | `#AAD0E2` | Waiting for vendor confirmation |

Verification uses deep green, not generic success green, because verification is a
recorded evidence status—not a promise of service quality.

### Semantic aliases

```text
canvas                 neutral.25
surface                neutral.0
surface.subtle         neutral.50
text.primary           neutral.950
text.secondary         neutral.600
text.inverse           neutral.0
border.default         neutral.100
border.strong          neutral.200
action.primary         brand.deepGreen
action.primaryText     neutral.0
action.accent          brand.lime
action.accentText      neutral.950
focus.ring              brand.lime
trust.surface          #EAF1ED
trust.text             brand.deepGreen
```

### Contrast rules

- Deep green on white is `9.77:1`; white on deep green is the same and is approved.
- Deep green on lime is `4.77:1`; approved for normal text and controls.
- Ink on lime is `7.93:1`; preferred for small text on lime.
- White on lime is only `2.05:1` and is prohibited for text, icons, and controls.
- Lime on white is prohibited for meaningful text. Use deep green for the label and
  lime for its background, border, underline, progress fill, or decorative mark.
- Secondary text must use `neutral.600` or darker on light surfaces. Placeholders do
  not replace visible labels.
- Recheck actual font size and weight with automated WCAG contrast tests; these
  ratios do not excuse low-opacity overlays or text over uncontrolled images.

### Color proportions

For customer-facing screens, aim for roughly 70% light neutrals, 20% deep green and
green-tinted neutrals, and no more than 10% lime. This is a composition guide, not a
pixel quota. Operations screens use even less lime so alerts retain their meaning.

### Dark surfaces and dark mode

The MVP is light-first. Deep-green hero, navigation, and footer surfaces are part of
the light theme; they are not a full dark mode. Do not ship an automatic dark theme
until listing media, maps, hosted checkout handoff, charts, and every semantic state
have been reviewed together. If dark mode is later added, redesign surfaces and
reduce saturated accents rather than simply inverting tokens.

## 5. Typography

### Type families

- **Brand display — Bebas Bold:** supplied primary brand face. Use for logo-adjacent
  campaigns, hero statements, major section openers, and short numeric moments.
  It is uppercase-only and must not carry sentences, instructions, prices, forms,
  tabs, or booking terms.
- **Product/UI — DM Sans:** readable at small sizes, friendly without looking
  childish, and clear across native and web. Use for body copy, controls, prices,
  forms, statuses, navigation, and operations data.
- **Data fallback — DM Sans with tabular numerals:** use `font-variant-numeric:
  tabular-nums` for amounts, references, timers, and reconciliation columns.
- **Technical references — JetBrains Mono:** internal-only transaction IDs,
  correlation IDs, webhook references, and developer diagnostics.

Confirm the exact licensed `Bebas Bold` font file with the identity designer before
distribution. In code, expose it through the alias `MMEMMEDisplay` so a licensed
file can replace a temporary Bebas-family build without changing components. Bundle
font files with Expo and self-host WOFF2 on web; never make a core flow depend on a
third-party font CDN. Use `font-display: swap` and preload only required weights.

### Type scale

All values are CSS pixels on web and density-independent points on native.

| Style | Compact/mobile | Wide web | Line height | Weight/family | Use |
|---|---:|---:|---:|---|---|
| `display.hero` | 52 | 80 | 0.94 | Bebas Bold | marketing hero, max 2 lines |
| `display.section` | 40 | 56 | 0.98 | Bebas Bold | branded section opener |
| `heading.1` | 36 | 48 | 1.08 | DM Sans 700 | page title |
| `heading.2` | 28 | 36 | 1.15 | DM Sans 700 | main section |
| `heading.3` | 22 | 24 | 1.25 | DM Sans 700 | card or subsection |
| `body.large` | 18 | 20 | 1.55 | DM Sans 400 | lead text |
| `body.default` | 16 | 16 | 1.50 | DM Sans 400 | default body and input |
| `body.small` | 14 | 14 | 1.45 | DM Sans 400/500 | metadata and help |
| `label` | 14 | 14 | 1.25 | DM Sans 600 | form and control label |
| `caption` | 12 | 12 | 1.35 | DM Sans 500 | timestamps, legal support |
| `overline` | 12 | 12 | 1.20 | DM Sans 700 | category, tracked `0.08em` |

### Typography rules

- Sentence case is the default. Bebas Bold is visually uppercase by design; do not
  force uppercase body or button copy.
- Marketing line length: `45–65ch`. Product body line length: `45–72ch`. Legal and
  cancellation text may reach `75ch` but must be broken into titled sections.
- Use real naira symbols and localized grouping: `₦2,800,000`, not `NGN 2800000` in
  customer UI. Pair exact totals with clear qualifiers such as `from` or `deposit`.
- Do not use condensed display type for dense lists, long vendor names, receipts,
  terms, dates, prices, or verification evidence.
- Support dynamic type to 200% without clipping, overlapping, or hiding actions.
- Never bake important text into images, including campaign headlines.

## 6. Photography and media

### Art direction

Use real Nigerian event spaces, food, teams, and celebrations. Images should feel
observational, warm, and active: a venue being prepared, a table at human height,
food with real texture, or people interacting naturally. Show the service being
delivered, not only empty luxury rooms.

- Favor daylight or believable warm event light with true-to-life skin and food.
- Preserve Nigerian context. Use actual Lagos areas, architecture, textiles, menus,
  and celebrations when the listing represents them.
- Balance wide establishing shots with detail and human-scale service moments.
- Avoid generic Western wedding stock, fake handshake imagery, heavy presets,
  over-smoothing, excessive bokeh, collages, watermarks, and AI-generated vendor
  evidence.
- Vendor listing media must belong to the vendor or have documented permission.
  Verification evidence and identity documents are never public imagery.

### Product crops

- Listing card: `4:3`, focal point centered enough for responsive crop.
- Venue/caterer hero: `3:2` on web and `4:3` on mobile.
- Marketing editorial: `3:2`, `4:5`, or `16:9` according to layout—never arbitrary
  near-duplicates.
- Vendor avatar or symbol: `1:1`; do not force a wide venue photo into a circle.
- Serve AVIF/WebP where supported, retain JPEG fallback, specify dimensions, and
  reserve aspect-ratio space to prevent layout shift.

### Image overlays

Do not place long text over vendor images. Short white labels require a deep-green
backing at `92%` opacity; gradients over images are not a default readability fix.
Logo placement on photography follows the same quiet-region rule.

## 7. Iconography and illustration

- Use one outline icon family across web and native; Lucide is the web baseline and
  platform-equivalent SVG paths should be used on native where possible.
- Default stroke is `1.75–2px`; sizes are `16`, `20`, and `24`. Do not mix filled,
  outlined, emoji, and hand-drawn icon styles in one flow.
- Icons support visible text. Only universally understood navigation actions may be
  icon-only, and they still require an accessible label and tooltip on web.
- Verification, payments, cancellations, and disputes always pair icon, color, and
  plain-language status.
- The MMEMME symbol may become a low-contrast crop or framing device in marketing,
  but never behind transactional copy and never distorted into an illustration.

## 8. Spacing, shape, and elevation

### Spacing

Use a `4px` base and prefer the semantic steps below.

| Token | Value | Use |
|---|---:|---|
| `space.0` | 0 | reset only |
| `space.1` | 4 | icon optical adjustment |
| `space.2` | 8 | tight internal gap |
| `space.3` | 12 | label/control relationship |
| `space.4` | 16 | default component padding |
| `space.5` | 20 | compact card padding |
| `space.6` | 24 | standard section/card padding |
| `space.8` | 32 | section grouping |
| `space.10` | 40 | mobile section separation |
| `space.12` | 48 | compact page separation |
| `space.16` | 64 | web section separation |
| `space.20` | 80 | marketing separation |
| `space.24` | 96 | large editorial separation |

Use comfortable density in customer flows and compact density only in the
operations console. Related items sit closer to one another than unrelated groups.

### Radius

| Token | Value | Use |
|---|---:|---|
| `radius.none` | 0 | tables and edge-to-edge media |
| `radius.sm` | 6 | badges and compact controls |
| `radius.md` | 10 | inputs and buttons |
| `radius.lg` | 16 | product cards and sheets |
| `radius.xl` | 24 | editorial feature panels |
| `radius.full` | 999 | avatar and status dot only |

Radii express hierarchy. Do not make every surface a floating rounded rectangle.
Listing media may inherit a card's top radius; tables and grouped rows remain calm
and mostly rectangular.

### Borders and elevation

- Default border: `1px solid neutral.100`.
- Strong or selected border: `1px solid brand.deepGreen`.
- Focus ring: `3px brand.lime` with a `2px` light-surface offset.
- `elevation.1`: `0 1px 2px rgba(21,35,31,.06)` for raised inputs/cards.
- `elevation.2`: `0 8px 24px rgba(21,35,31,.10)` for menus and sticky summaries.
- `elevation.3`: `0 20px 48px rgba(21,35,31,.16)` for dialogs only.
- On native, use subtle platform shadows/elevation that visually match these levels.
- A border is preferred to a shadow for ordinary structure. Never use colored glow.

## 9. Layout and responsive behavior

### Breakpoints and grid

| Viewport | Grid | Page gutter | Behavior |
|---|---|---:|---|
| `< 600px` | 4 columns | 16–20 | single-column flows, bottom actions |
| `600–899px` | 8 columns | 24 | two-up results where content permits |
| `900–1199px` | 12 columns | 32 | desktop navigation and side summaries |
| `≥ 1200px` | 12 columns | 48–64 | full marketplace/editorial composition |

- Public maximum content width: `1280px`.
- Reading and form maximum width: `720px`; auth and short forms: `480px`.
- Operations maximum width: `1440px`, with denser grids where scanning benefits.
- Mobile respects safe areas and one-handed reach. Primary transactional actions may
  sit in a sticky bottom action region, but must not cover content or the keyboard.
- Validate web at `375`, `768`, `1024`, and `1440px`, and native on representative
  small Android devices, current iPhone sizes, and 200% text scaling.

### Marketing website

- The home page opens with one strong Bebas-led statement, a real event photograph,
  and search/brief as the primary action. App-download CTAs are secondary.
- Use controlled asymmetry: image and display type may break the column rhythm in
  editorial sections, while controls stay aligned to the grid.
- Follow with proof: curated supply, what verification means, how booking works,
  visible price guidance, and customer/vendor evidence. Avoid generic feature tiles.
- Deep-green footer and occasional lime editorial fields create brand memory.

### Customer marketplace on web

- Preserve the same information order and state language as mobile.
- Search/results use a stable filter rail or drawer, two-to-three-column listing
  grid, visible applied filters, and shareable URLs.
- Vendor detail uses a media gallery plus a sticky request summary on wide screens;
  mobile collapses to one column and a bottom request action.
- Quote, payment, cancellation, and dispute screens constrain reading width even on
  large displays. Money and consequences are never spread across distant columns.

### Mobile app

- Prefer native navigation patterns, safe-area-aware headers, and clear back labels.
- Home prioritizes brief/search, relevant results, then the trust promise.
- Keep cards large enough to scan but avoid a feed of oversized decorative panels.
- Preserve drafts across connectivity loss and show explicit offline/stale states.
- Use bottom sheets for short contextual choices; use full screens for forms,
  terms, payment recovery, and anything with multiple steps.

### Vendor portal

- Use a calm task-oriented shell: setup checklist, verification status, required
  corrections, listing preview, and submission history.
- Distinguish private evidence from public portfolio media visually and in copy.
- Progress is factual: `3 of 5 sections complete`; submission never implies approval.

### Operations console

- Brand is present in navigation, focus, and selected states; lime is not used as a
  decorative wash across data-heavy views.
- Optimize for scanning: stable columns, tabular figures, persistent filters,
  reasoned empty states, visible timestamps, and correlation IDs in mono.
- Financial and state transitions require explicit labels and confirmation; status
  cannot rely on color alone.

## 10. Component principles

### Buttons

| Variant | Treatment | Use |
|---|---|---|
| Primary | deep-green fill, white label | one main action per region |
| Accent | lime fill, ink label | marketing conversion or selected brief step |
| Secondary | light surface, deep-green border/label | alternative action |
| Ghost | transparent, deep-green label | low-priority toolbar action |
| Destructive | error fill or error border/label | cancellation/refund after confirmation |

- Minimum target is `44×44`; default height is `48`, large is `56`.
- Labels describe the outcome: `Request this venue`, `Accept quote`, `Pay ₦750,000`.
- Loading preserves width, disables repeat input, and keeps a readable verb such as
  `Submitting request…`. Do not replace the entire label with a spinner.

### Inputs and forms

- Visible label above every field; helper or requirement text below when needed.
- Default input height is `52–56`; border becomes deep green on focus with the lime
  focus ring. Error state adds error border, icon, and actionable text.
- Group related fields under plain-language headings. Long flows disclose progress
  and preserve completed answers.
- Validate on blur or submit, not on every keystroke before a user can finish.
- Never use placeholder text as the only label. Never clear user input after a
  network error.

### Listing card

Information order is fixed:

1. `4:3` owned portfolio image.
2. Category and dated verification indicator.
3. Vendor name and Lagos area.
4. Capacity or service range.
5. Honest price guidance with `From` where appropriate.
6. Clear action or whole-card link with a descriptive accessible name.

Do not add ratings until verified reviews exist. Do not display `Available` without a
live, authoritative availability source; use `MMEMME confirms your date`.

### Verification disclosure

- Compact label: **MMEMME Verified** with the last checked date.
- Expanded disclosure lists exactly what was checked and the expiry date.
- Always include: `Verification records checks completed by MMEMME. It is not a
  guarantee of service quality or fulfillment.`
- Stale or expired verification removes the positive treatment and publication must
  follow product policy. Never silently retain a green badge.

### Price and payment summary

- Put the payable amount in the strongest product type, not Bebas Bold.
- Label total, deposit due now, later balance, gateway status, cancellation effect,
  and who receives support. Use full naira formatting.
- The primary button repeats the immediate amount.
- Hosted-checkout return shows `Confirming your payment` until the signed webhook and
  server verification succeed. Never show confirmation based on a return URL alone.

### Status and timeline

- Status badges use a semantic surface, icon, and customer-readable label.
- Timeline entries show action, actor category where helpful, date/time, and next
  step. Internal enum names never appear.
- Recommended customer labels include:

| Domain state | Customer label | Supporting line |
|---|---|---|
| `requested` | Request sent | MMEMME is reviewing your details. |
| `operations_review` | Checking with the vendor | We have not confirmed availability yet. |
| `quote_ready` | Quote ready | Review the complete terms before it expires. |
| `accepted_awaiting_payment` | Waiting for payment | Your booking is not confirmed until payment succeeds. |
| `confirmed` | Booking confirmed | Your receipt and next steps are ready. |
| `disputed` | Support case open | MMEMME is reviewing the issue with you. |

### Empty, loading, offline, and error states

- Skeletons reserve final layout dimensions and appear only when content is expected.
- Empty states say what the filter or account contains and offer one relevant next
  action. Avoid celebratory illustration for serious financial emptiness.
- Offline states identify what remains available, what was saved, and when retry is
  safe. Never imply that a payment or booking action was repeated.
- Errors use human language, preserve input, expose a safe retry where idempotent,
  and provide support/reference details for payment uncertainty.

## 11. Motion and feedback

### Motion tokens

```text
duration.instant  80ms
duration.fast     160ms
duration.base     240ms
duration.slow     360ms
ease.enter        cubic-bezier(.16, 1, .3, 1)
ease.exit         cubic-bezier(.7, 0, .84, 0)
ease.move         cubic-bezier(.65, 0, .35, 1)
```

- Press feedback: `80–120ms`; menu/sheet: `160–240ms`; page or success-state
  transition: up to `360ms`.
- Animate opacity and transform where possible; avoid layout-janking height and
  width animation in result lists.
- One-time branded motion may reveal the connection mark on launch or marketing,
  but app launch must remain fast and the animation must be skippable.
- Use haptics only for meaningful success, selection, or destructive confirmation.
  Never haptic every tap.
- Respect `prefers-reduced-motion` and native reduce-motion settings. Reduced motion
  removes parallax, auto-animation, and large transforms while preserving status.

## 12. Voice and content

### Voice

MMEMME sounds warm, capable, direct, and locally literate. It celebrates the event
while being exact about money, verification, availability, and responsibility.

- **Warm:** `Tell us what you're planning.`
- **Specific:** `Deposit due now: ₦750,000.`
- **Honest:** `We're checking this date with the vendor.`
- **Supportive:** `Your request is saved. You can finish it when you're back online.`

Avoid inflated luxury language, fear-based selling, slang that may date quickly,
legalese in the main flow, and claims such as `guaranteed`, `risk-free`, `instant
availability`, `secure escrow`, or `best vendor` unless literally substantiated.

### Naming and capitalization

- Use `MMEMME`, `MMEMME Verified`, `My bookings`, `Wedding brief`, and `Support`.
- Use sentence case for headings, navigation, buttons, and statuses.
- Write dates as `27 Aug 2026` in compact UI and `27 August 2026` in terms/receipts.
- Use `Lagos`, specific areas such as `Lekki`, and Nigerian English spelling
  consistently. Never assume all users know internal marketplace terminology.

### Trust and availability copy

| Avoid | Use |
|---|---|
| Available now | MMEMME will confirm your date |
| Verified quality | MMEMME checked these details on 12 Jul 2026 |
| Pay securely into escrow | Pay through MMEMME |
| Book instantly | Send booking request |
| Something went wrong | We couldn't submit your request. Your details are saved. |

## 13. Accessibility requirements

Accessibility is a release requirement, not a later visual pass.

- Meet WCAG 2.2 AA for public and authenticated web experiences.
- Minimum normal-text contrast is `4.5:1`; large text is `3:1`; meaningful controls
  and focus indicators meet non-text contrast requirements.
- All web flows work by keyboard with logical focus order, visible focus, skip link,
  landmark structure, and correct heading hierarchy.
- Mobile supports VoiceOver and TalkBack, dynamic type to 200%, meaningful labels,
  announced errors/status changes, and platform-correct focus behavior.
- Targets are at least `44×44`. Do not place destructive and primary actions so
  close that they are easily confused.
- Color never carries meaning alone. Pair status with text and, where useful, icon.
- Forms associate labels, descriptions, and errors programmatically. Move focus to
  the error summary after a failed submit on web.
- Dialogs trap and restore focus; sheets and menus announce their expanded state.
- Media has descriptive alt text when informative and empty alt text when purely
  decorative. Do not repeat adjacent captions.
- Respect zoom, reflow at `320px` CSS width, reduced motion, increased contrast, and
  device safe areas.

## 14. Platform token contract

`packages/tokens` will become the canonical machine-readable source. It must export
primitive tokens, semantic light-theme aliases, typography, spacing, radius,
elevation, and motion as TypeScript values for React Native and generated CSS custom
properties for Next.js. Components consume semantic aliases—not raw hex values.

Representative web variables:

```css
:root {
  --brand-deep-green: #294a41;
  --brand-lime: #97c354;
  --color-canvas: #fbfcf8;
  --color-surface: #ffffff;
  --color-text-primary: #15231f;
  --color-text-secondary: #53625c;
  --color-border: #e8eee9;
  --color-action-primary: #294a41;
  --color-action-primary-text: #ffffff;
  --color-focus-ring: #97c354;
  --font-display: "MMEMMEDisplay", "Arial Narrow", sans-serif;
  --font-ui: "DM Sans", sans-serif;
  --radius-control: 10px;
  --radius-card: 16px;
  --space-unit: 4px;
}
```

Representative native API:

```ts
import { color, radius, space, type, motion } from "@mmemme/tokens";

const primaryButton = {
  minHeight: 48,
  backgroundColor: color.action.primary,
  borderRadius: radius.control,
  paddingHorizontal: space[5],
};
```

Rules:

- Token names describe purpose at component call sites. Raw brand primitives are
  allowed only inside the token package, brand compositions, and approved logo use.
- Web and native may implement platform-specific mechanics, but semantic color,
  hierarchy, spacing intent, content, and state meaning remain aligned.
- Deprecate the former plum, coral, rose, and warm-ivory product palette. Migration
  happens through tokens so individual screens are not recolored ad hoc.
- No component introduces a one-off color, radius, shadow, type size, or duration
  without a documented system decision.

## 15. Asset and implementation checklist

Before visual production is considered complete:

- [ ] Obtain source SVG for horizontal, stacked, and symbol-only marks.
- [ ] Obtain transparent PNG exports at `1x`, `2x`, and `3x` where raster is needed.
- [ ] Confirm the exact Bebas Bold family/version and digital distribution licence.
- [ ] Export favicon, Open Graph mark, iOS icon, Android adaptive foreground, launch
      mark, monochrome icon, and email-safe logo from approved sources.
- [ ] Build `packages/tokens` and generate CSS/React Native outputs.
- [ ] Build accessible web and native component galleries covering every state.
- [ ] Replace legacy plum/coral/rose UI through semantic tokens.
- [ ] Test contrast, keyboard, screen readers, 200% text, reduced motion, `320px`
      reflow, and representative small Android/current iOS devices.
- [ ] Review real vendor photography and every logo placement before release.
- [ ] Take visual-regression baselines at `375`, `768`, `1024`, and `1440px`.

## 16. Design QA checklist

Every customer-facing screen must answer yes:

1. Is the main user goal obvious within five seconds?
2. Are price, date confidence, verification evidence, and consequences visible
   before the user commits?
3. Does the screen use semantic tokens and approved type roles?
4. Is lime used with deep-green/ink content and never white meaningful text?
5. Is there one clear primary action and an explicit disabled/loading state?
6. Does the layout survive long vendor names, naira amounts, and 200% text?
7. Are empty, error, offline, stale, and retry states intentionally designed?
8. Can the entire flow be completed by keyboard or assistive technology?
9. Does the interface avoid implying live availability, guaranteed verification,
   escrow, or successful payment before authoritative confirmation?
10. Is real content doing more visual work than decoration?

## 17. Decisions log

| Date | Decision | Authority and rationale |
|---|---|---|
| 27 Aug 2026 | Deep green `#294A41` and lime `#97C354` are the fixed brand colors. | Supplied MMEMME brand guide. |
| 27 Aug 2026 | Bebas Bold is reserved for short display moments; DM Sans carries product UI. | Preserves the supplied identity while protecting transactional readability. |
| 27 Aug 2026 | Use a hybrid editorial marketing / disciplined product layout. | Lets the public brand feel energetic without weakening booking clarity. |
| 27 Aug 2026 | Lime never carries white meaningful text. | The pairing is only `2.05:1`; deep green or ink passes AA. |
| 27 Aug 2026 | Deprecate the prototype plum/coral/rose palette. | New approved identity is authoritative and must be implemented consistently. |
| 27 Aug 2026 | Product name is `MMEMME`; visual logo may retain `MME MME`. | Separates accessible/product naming from the approved wordmark construction. |
| 27 Aug 2026 | Full dark mode is deferred; deep-green branded fields remain part of light mode. | Avoids an unreviewed token inversion across media and transactional states. |
