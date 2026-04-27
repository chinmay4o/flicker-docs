import CSS_COLORS from "../constants/cssColors";
import { generateItemFromHash } from "../common/hashAlgo";
import { ANIMALS } from "../constants/cursorNames";

const ACTIVE_DURATION_MS = 700;
const IDLE_DELAY_MS = 3000;

// Pick legible text color (dark or light) based on background luminance.
// Uses the WCAG-style weighted RGB → luminance approximation.
function pickTextColor(rgbStr) {
  const m = String(rgbStr).match(/\d+(?:\.\d+)?/g);
  if (!m || m.length < 3) return "#1b1b1d";
  const [r, g, b] = m.slice(0, 3).map(Number);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.58 ? "#1b1b1d" : "#f9f7f1";
}

export default class RemoteCursor {
  constructor(cm, siteId, position) {
    this.cm = cm;
    this.activeTimer = null;
    this.idleTimer = null;

    const color = generateItemFromHash(siteId, CSS_COLORS);
    const name = generateItemFromHash(siteId, ANIMALS);

    this.createCursor(color);
    this.createFlag(color, name);
    this.cursor.appendChild(this.flag);

    cm.getWrapperElement().appendChild(this.cursor);

    // Position immediately without transition (no .smooth class yet),
    // then enable smooth transitions for subsequent moves. setTimeout(0)
    // ensures the browser has flushed the initial layout before transitions
    // are enabled — works even when the tab is not focused (rAF can pause).
    this.set(position);
    setTimeout(() => {
      this.cursor.classList.add("smooth");
    }, 0);

    this._onScroll = () => this._reposition();
    cm.on("scroll", this._onScroll);

    if (typeof ResizeObserver !== "undefined") {
      this._resizeObserver = new ResizeObserver(() => this._reposition());
      this._resizeObserver.observe(cm.getWrapperElement());
    }
  }

  createCursor(color) {
    const textHeight = this.cm.defaultTextHeight();
    this.cursor = document.createElement("div");
    this.cursor.classList.add("remote-cursor");
    this.cursor.style.backgroundColor = color;
    this.cursor.style.height = textHeight + "px";
    // Initialize transform so the subsequent transition has a known start
    this.cursor.style.transform = "translate(0px, 0px)";
  }

  createFlag(color, name) {
    this.flag = document.createElement("span");
    this.flag.classList.add("flag");
    // Convert rgba(...,0.5) → rgb(...) so doc text doesn't bleed through.
    const opaque = color.replace(
      /rgba?\(\s*([^,]+),\s*([^,]+),\s*([^,)]+)(?:,[^)]*)?\)/,
      "rgb($1,$2,$3)"
    );
    this.flag.style.backgroundColor = opaque;
    this.flag.style.color = pickTextColor(opaque);
    this.flag.textContent = name;
  }

  set(position) {
    this.lastPosition = position;
    this._reposition();
    this._activate();
  }

  _reposition() {
    if (!this.lastPosition) return;
    // Use viewport-relative coords for both target and parent, then take the
    // delta. This sidesteps a CM5 quirk where "local" coords include
    // padding-top but not padding-left of .CodeMirror-lines.
    const coords = this.cm.cursorCoords(this.lastPosition, "window");
    const wrapperRect = this.cm.getWrapperElement().getBoundingClientRect();
    const x = Math.max(0, coords.left - wrapperRect.left);
    const y = coords.top - wrapperRect.top;
    this.cursor.style.transform = `translate(${x}px, ${y}px)`;
  }

  _activate() {
    clearTimeout(this.activeTimer);
    clearTimeout(this.idleTimer);
    this.cursor.classList.remove("idle");
    // Force reflow so the active animation re-triggers if already active
    void this.cursor.offsetWidth;
    this.cursor.classList.add("active");

    this.activeTimer = setTimeout(() => {
      this.cursor.classList.remove("active");
    }, ACTIVE_DURATION_MS);

    this.idleTimer = setTimeout(() => {
      this.cursor.classList.add("idle");
    }, IDLE_DELAY_MS);
  }

  detach() {
    clearTimeout(this.activeTimer);
    clearTimeout(this.idleTimer);
    if (this._onScroll) this.cm.off("scroll", this._onScroll);
    if (this._resizeObserver) this._resizeObserver.disconnect();
    if (this.cursor.parentElement) this.cursor.remove();
  }
}
