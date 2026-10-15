/**
 * Bouchons DOM minimaux permettant de charger les modules de src/js sous node.
 *
 * utils.js importe mathlive, qui touche au DOM dès le chargement du module.
 * activity.js lui-même n'a besoin d'aucun DOM : ses getters nombreQuestions et
 * Tempo interrogent des sliders et retombent sur 10 et 8 quand ils sont absents,
 * d'où le getElementById qui renvoie null.
 */
const noop = () => {};

globalThis.HTMLElement = class {};
globalThis.FontFace = class {
  load() {
    return Promise.resolve(this);
  }
};
globalThis.getComputedStyle = () => ({ getPropertyValue: () => "" });

globalThis.window = {
  location: { host: "localhost", href: "http://localhost/", search: "" },
  addEventListener: noop,
  matchMedia: () => ({ matches: false, addEventListener: noop }),
  localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
  getComputedStyle: globalThis.getComputedStyle,
};

const stubElement = () => ({
  style: {},
  classList: { add: noop, remove: noop, contains: () => false },
  setAttribute: noop,
  appendChild: noop,
  addEventListener: noop,
});

globalThis.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: stubElement,
  createElementNS: stubElement,
  addEventListener: noop,
  body: stubElement(),
  head: stubElement(),
  documentElement: stubElement(),
  fonts: { ready: Promise.resolve(), load: () => Promise.resolve(), add: noop },
};

Object.defineProperty(globalThis, "navigator", {
  value: { userAgent: "node", language: "fr" },
  configurable: true,
});

globalThis.customElements = { define: noop, get: () => undefined };
