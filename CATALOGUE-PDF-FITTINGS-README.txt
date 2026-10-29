COMPANY HUB — CATALOGUE PDF FITTINGS GROUP

Copy the app and tests folders into the Company Hub repository, preserving their paths, then commit and deploy normally.

What changes
- The generated wholesale catalogue PDF now has one Fittings section directly after Plumbing.
- The interactive catalogue leaflet uses the same grouping.
- Explicit fitting products and plumbing, bathroom and drainage elbows, bends, couplers, tees, adaptors, connectors, sockets, nipples, reducers, junctions, caps, plugs, traps, valves and related fittings are collected into that section.
- Products within Fittings remain alphabetically ordered, so fitting families and sizes stay easy to find.
- Future matching catalogue products will also be grouped automatically the next time the PDF or leaflet is generated.

What stays unchanged
- No catalogue database records are changed.
- Product codes, saved categories, pictures, prices, QR codes and active/inactive state are untouched.
- Pipes and taps remain in their existing sections.
- Tool sockets, tool adaptors and electrical sockets remain in Tools, TorkCraft or Electrical rather than being mistaken for plumbing fittings.

Files
- app/catalogue-pdf.ts
- app/catalogue-pdf-grouping.ts
- tests/catalogue-pdf-fittings.test.mjs

There is no D1 migration for this patch.

Validation completed locally
- Production build passed.
- Targeted lint passed.
- Three grouping tests passed, covering fitting detection and false-positive protection.

No remote deployment was performed.
