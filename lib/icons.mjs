// Linijinės ikonos (48×48). Pavadinimą nurodote business.json lauke "icon".
const P = {
  // Kelionė
  car: '<path d="M5 31v-6l5-9h19l8 9h6v6"/><path d="M5 31h4m11 0h8m11 0h4"/><circle cx="14.5" cy="31.5" r="4.5"/><circle cx="33.5" cy="31.5" r="4.5"/><path d="M19 16v9h18"/>',
  train: '<rect x="12" y="6" width="24" height="29" rx="6"/><path d="M12 21h24"/><circle cx="18.5" cy="28" r="1.6"/><circle cx="29.5" cy="28" r="1.6"/><path d="M17 42l4-7m10 7l-4-7"/>',
  bus: '<rect x="9" y="7" width="30" height="28" rx="5"/><path d="M9 24h30M15 13h18"/><circle cx="16" cy="30" r="1.6"/><circle cx="32" cy="30" r="1.6"/><path d="M14 35v5m20-5v5"/>',
  walk: '<circle cx="26" cy="8" r="3.5"/><path d="M24 15l-5 10 7 4v12M24 15l6 8 6 2M19 25l-4 6"/>',
  door: '<path d="M14 42V7h20v35"/><path d="M8 42h32"/><circle cx="29" cy="25" r="1.8"/>',
  parking: '<rect x="8" y="8" width="32" height="32" rx="6"/><path d="M19 34V15h7a6 6 0 0 1 0 12h-7"/>',
  // Kepiniai ir gėrimai
  spiral: '<path d="M24 25a3 3 0 0 1 6 0a6 6 0 0 1-12 0a9 9 0 0 1 18 0a12 12 0 0 1-24 0a15 15 0 0 1 30 0a18 18 0 0 1-36 0"/>',
  bun: '<circle cx="24" cy="24" r="17"/><circle cx="24" cy="24" r="7.5"/><path d="M21.5 22.5h.01M26 21.5h.01M24 26.5h.01" stroke-width="3"/>',
  sausage: '<rect x="9" y="16" width="30" height="16" rx="8"/><path d="M4 24h5m30 0h5" stroke-width="5"/><path d="M17 19l3 10m4-10l3 10m4-10l3 10"/>',
  tart: '<path d="M6 25c0-4.5 8-8 18-8s18 3.5 18 8"/><path d="M6 25v4c0 4.5 8 8 18 8s18-3.5 18-8v-4"/><path d="M6 25c0 4.5 8 8 18 8s18-3.5 18-8"/><circle cx="18" cy="23" r="2"/><circle cx="25" cy="21.5" r="2"/><circle cx="31" cy="24" r="2"/>',
  cup: '<path d="M9 20h24v8a12 12 0 0 1-24 0z"/><path d="M33 22h3a5 5 0 0 1 0 10h-3"/><path d="M17 7c-2 3 2 6 0 9m7-9c-2 3 2 6 0 9"/><path d="M7 43h28"/>',
  bread: '<path d="M8 22c0-7 7-11 16-11s16 4 16 11c0 3-2 4-4 4v12H12V26c-2 0-4-1-4-4z"/><path d="M18 18l3 4m4-5l3 4"/>',
  cake: '<path d="M8 40V26h32v14z"/><path d="M8 32c4 3 8 3 12 0s8-3 12 0 6 2 8 0"/><path d="M24 26v-8m0-6c-2 2-2 4 0 6 2-2 2-4 0-6"/>',
  // Bendros
  scissors: '<circle cx="13" cy="35" r="5"/><circle cx="35" cy="35" r="5"/><path d="M17 31L34 8M31 31L14 8"/>',
  star: '<path d="M24 6l5.5 11.5L42 19l-9 8.5 2.5 12.5L24 34l-11.5 6 2.5-12.5L6 19l12.5-1.5z"/>',
  dot: '<circle cx="24" cy="24" r="7"/>',
};

export function icon(name, cls = '') {
  const body = P[name] || P.dot;
  return `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

export const iconNames = Object.keys(P);

export const BEE = `<svg class="bee" id="bee" viewBox="0 0 40 33" aria-hidden="true" hidden>
  <ellipse cx="15" cy="9" rx="8" ry="5.5" transform="rotate(-24 15 9)" style="fill:var(--cream);stroke:var(--slate)" stroke-width="1.6"/>
  <ellipse cx="24" cy="8" rx="7" ry="5" transform="rotate(18 24 8)" style="fill:var(--cream);stroke:var(--slate)" stroke-width="1.6"/>
  <clipPath id="bee-body"><ellipse cx="20" cy="21" rx="12" ry="8.5"/></clipPath>
  <ellipse cx="20" cy="21" rx="12" ry="8.5" fill="#D9963A"/>
  <g clip-path="url(#bee-body)" style="fill:var(--slate)"><rect x="15" y="10" width="3.4" height="22"/><rect x="22" y="10" width="3.4" height="22"/></g>
  <path d="M32 21h5" style="stroke:var(--slate)" stroke-width="2" stroke-linecap="round"/>
</svg>`;
