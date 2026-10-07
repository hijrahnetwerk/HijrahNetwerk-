(function () {
  "use strict";

  function isAdminPage() {
    const p = (window.location.pathname || "").replace(/\/$/, "");
    return p === "/admin" || p.startsWith("/admin/") || p.startsWith("/admin-");
  }

  // Admin blijft volledig bruikbaar: geen kopieerblokkade.
  if (isAdminPage()) return;

  function isEditable(target) {
    if (!target) return false;
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
  }

  document.addEventListener("contextmenu", function (event) {
    if (!isEditable(event.target)) event.preventDefault();
  });

  document.addEventListener("selectstart", function (event) {
    if (!isEditable(event.target)) event.preventDefault();
  });

  document.addEventListener("copy", function (event) {
    if (!isEditable(event.target)) event.preventDefault();
  });

  document.addEventListener("cut", function (event) {
    if (!isEditable(event.target)) event.preventDefault();
  });

  document.addEventListener("dragstart", function (event) {
    if (!isEditable(event.target)) event.preventDefault();
  });

  document.addEventListener("keydown", function (event) {
    if (isEditable(event.target)) return;

    const key = event.key.toLowerCase();

    if (
      (event.ctrlKey || event.metaKey) &&
      ["c", "x", "u", "s", "a"].includes(key)
    ) {
      event.preventDefault();
    }

    if (event.key === "F12") {
      event.preventDefault();
    }

    if (
      (event.ctrlKey || event.metaKey) &&
      event.shiftKey &&
      ["i", "j", "c"].includes(key)
    ) {
      event.preventDefault();
    }
  });
})();
