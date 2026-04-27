import Peer from "peerjs";
import CodeMirror from "codemirror";

import Controller from "./controller";
import Broadcast from "./broadcast";
import Editor from "./editor";

if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
} else {
  const textarea = document.querySelector("#editor textarea");

  const cm = CodeMirror.fromTextArea(textarea, {
    lineWrapping: true,
    lineNumbers: false,
    indentWithTabs: true,
    tabSize: 4,
    indentUnit: 4,
    autofocus: false,
    spellcheck: false,
    mode: null,
    theme: "flickerdocs",
    viewportMargin: Infinity,
    scrollbarStyle: "null",
    extraKeys: {
      Tab: function (codemirror) {
        codemirror.replaceSelection("\t");
      },
    },
  });

  const placeholder = document.createElement("div");
  placeholder.className = "cm-placeholder";
  placeholder.textContent =
    "Share the link to invite collaborators to your document.";
  cm.getWrapperElement().appendChild(placeholder);
  const updatePlaceholder = () => {
    placeholder.style.display = cm.getValue().length === 0 ? "block" : "none";
  };
  cm.on("change", updatePlaceholder);
  updatePlaceholder();

  new Controller(
    location.search.slice(1) || "0",
    location.origin,
    new Peer({
      debug: 3,
    }),
    new Broadcast(),
    new Editor(cm)
  );

  // Wire the share pill: click anywhere on it → trigger controller's copy logic
  // (still bound to .copy-container) → animate the pill into "Copied" state.
  const sharePill = document.querySelector(".share-pill");
  const copyContainer = document.querySelector(".copy-container");
  if (sharePill && copyContainer) {
    sharePill.addEventListener("click", () => {
      // Invoke whatever Controller bound to .copy-container (its copyToClipboard)
      if (typeof copyContainer.onclick === "function") copyContainer.onclick();
      sharePill.classList.add("is-copied");
      setTimeout(() => sharePill.classList.remove("is-copied"), 1500);
    });
  }

  // Auto-pick legible text color for peer-list pills based on bg luminance.
  // Pills are added/removed by Controller as peers join/leave, so observe.
  const pickTextColor = (rgbStr) => {
    const m = String(rgbStr).match(/\d+(?:\.\d+)?/g);
    if (!m || m.length < 3) return "#1b1b1d";
    const [r, g, b] = m.slice(0, 3).map(Number);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.58 ? "#1b1b1d" : "#f9f7f1";
  };

  const peersList = document.querySelector("#peerId");
  if (peersList) {
    const fixPeer = (peer) => {
      const bg = peer.style.backgroundColor;
      if (bg) peer.style.color = pickTextColor(bg);
    };
    peersList.querySelectorAll("span.peer").forEach(fixPeer);
    new MutationObserver((mutations) => {
      mutations.forEach((m) =>
        m.addedNodes.forEach((node) => {
          if (!node.querySelectorAll) return;
          node.querySelectorAll("span.peer").forEach(fixPeer);
        })
      );
    }).observe(peersList, { childList: true, subtree: true });
  }
}
