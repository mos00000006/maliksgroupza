// Professional, self-hosted vector module icons. No external font or CDN required.
// SVG markup is constant and never assembled from user-controlled input.
const paths = {
  "home": "<path d=\"m3 10 9-7 9 7v11h-6v-7H9v7H3z\"/>",
  "debtors": "<circle cx=\"8.5\" cy=\"7.5\" r=\"3\"/><path d=\"M2.5 20v-2a6 6 0 0 1 12 0v2\"/><rect x=\"15.5\" y=\"5\" width=\"6\" height=\"12\" rx=\"1\"/><path d=\"M17.5 9h2m-2 3h2\"/>",
  "suppliers": "<path d=\"m3 7 9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10M8 5l9 4\"/>",
  "stock": "<rect x=\"2.5\" y=\"12\" width=\"9\" height=\"9\" rx=\"1\"/><rect x=\"12.5\" y=\"12\" width=\"9\" height=\"9\" rx=\"1\"/><rect x=\"7.5\" y=\"2.5\" width=\"9\" height=\"8.5\" rx=\"1\"/><path d=\"M7 16h1m9 0h1m-6-9h1\"/>",
  "backoffice": "<rect x=\"4\" y=\"6\" width=\"16\" height=\"15\" rx=\"2\"/><path d=\"M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M8 11h8M8 15h8M8 19h5\"/>",
  "dispatching": "<path d=\"M2 6h12v12H2zM14 10h4l4 4v4h-8M2 18h2\"/><circle cx=\"7\" cy=\"18\" r=\"2\"/><circle cx=\"18\" cy=\"18\" r=\"2\"/><path d=\"M17 10v4h5\"/>",
  "headoffice": "<path d=\"M5 21V5l7-3 7 3v16M2 21h20M10 21v-5h4v5M8 8h2m4 0h2M8 12h2m4 0h2\"/>",
  "system": "<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M10 2h4l.6 2.3 1.8.8 2.1-1.1 2.8 2.8-1.1 2.1.8 1.8 2.3.6v4l-2.3.6-.8 1.8 1.1 2.1-2.8 2.8-2.1-1.1-1.8.8L14 22h-4l-.6-2.3-1.8-.8-2.1 1.1-2.8-2.8 1.1-2.1-.8-1.8L1 14v-4l2.3-.6.8-1.8L3 5.5l2.8-2.8 2.1 1.1 1.8-.8z\"/>",
  "widget": "<rect x=\"3\" y=\"3\" width=\"8\" height=\"8\" rx=\"1\"/><rect x=\"13\" y=\"3\" width=\"8\" height=\"5\" rx=\"1\"/><rect x=\"13\" y=\"10\" width=\"8\" height=\"11\" rx=\"1\"/><rect x=\"3\" y=\"13\" width=\"8\" height=\"8\" rx=\"1\"/>",
  "help": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M9.5 9a2.6 2.6 0 1 1 4.3 2c-1.2 1-1.8 1.6-1.8 3.2M12 18h.01\"/>",
  "lock": "<rect x=\"5\" y=\"10\" width=\"14\" height=\"11\" rx=\"2\"/><path d=\"M8 10V7a4 4 0 0 1 8 0v3M12 15v2\"/>",
  "exit": "<path d=\"M12 2v10\"/><path d=\"M6.4 5.5a9 9 0 1 0 11.2 0\"/>",
  "tills": "<rect x=\"3\" y=\"4\" width=\"18\" height=\"17\" rx=\"2\"/><path d=\"M6 8h12M7 12h2m3 0h2m3 0h1M7 16h2m3 0h2m3 0h1\"/>",
  "cashoffice": "<path d=\"M4 7V5a2 2 0 0 1 2-2h12v4M5 7h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM21 12h-5a2 2 0 0 0 0 4h5\"/>"
};

export const SUITE_ICONS = Object.freeze(Object.fromEntries(
  Object.entries(paths).map(([id,shape])=>[id,
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true">'+shape+'</svg>'
  ])
));

export function suiteIconMarkup(id){
  return SUITE_ICONS[id] || SUITE_ICONS.help;
}
