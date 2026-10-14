(function () {
  "use strict";

  // Bescherming geldt op alle pagina's. Alleen een door Supabase bevestigde adminrol heft deze op.

  var styleId = "hn-copy-protection-style";
  var style = document.createElement("style");
  style.id = styleId;
  style.textContent = [
    "html.hn-copy-protected body, html.hn-copy-protected body * {",
    "  -webkit-user-select: none !important;",
    "  user-select: none !important;",
    "  -webkit-touch-callout: none;",
    "}",
  ].join("\n");
  (document.head || document.documentElement).appendChild(style);
  document.documentElement.classList.add("hn-copy-protected");

  function isEditable(target) {
    if (!target) return false;
    var tag = String(target.tagName || "").toUpperCase();
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" ||
      !!target.isContentEditable || !!(target.closest && target.closest('[contenteditable="true"],[contenteditable=""]'));
  }

  function blockEvent(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function blockKey(event) {
    var key = String(event.key || "").toLowerCase();
    if ((event.ctrlKey || event.metaKey) && ["c", "x", "u", "s", "a", "p"].indexOf(key) !== -1) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (event.key === "F12" || ((event.ctrlKey || event.metaKey) && event.shiftKey && ["i", "j", "c"].indexOf(key) !== -1)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function protect() {
    document.addEventListener("contextmenu", blockEvent, true);
    document.addEventListener("selectstart", blockEvent, true);
    document.addEventListener("copy", blockEvent, true);
    document.addEventListener("cut", blockEvent, true);
    document.addEventListener("dragstart", blockEvent, true);
    document.addEventListener("keydown", blockKey, true);
  }

  function allowAdmin() {
    adminVerified = true;
    document.removeEventListener("contextmenu", blockEvent, true);
    document.removeEventListener("selectstart", blockEvent, true);
    document.removeEventListener("copy", blockEvent, true);
    document.removeEventListener("cut", blockEvent, true);
    document.removeEventListener("dragstart", blockEvent, true);
    document.removeEventListener("keydown", blockKey, true);
    document.documentElement.classList.remove("hn-copy-protected");
    var oldStyle = document.getElementById(styleId);
    if (oldStyle) oldStyle.remove();
    // Clear any selection restrictions that may have been applied before auth completed.
    document.documentElement.style.removeProperty("-webkit-user-select");
    document.documentElement.style.removeProperty("user-select");
  }

  protect();

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = Array.prototype.find.call(document.scripts, function (s) {
        return s.src && s.src.indexOf(src) !== -1;
      });
      if (existing) {
        if (existing.dataset.hnLoaded === "1") return resolve();
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        // Existing scripts that already executed do not emit another load event.
        if ((src.indexOf("config.js") !== -1 && window.__ENV) ||
            (src.indexOf("supabase.js") !== -1 && window.supabase && window.supabase.createClient) ||
            (src.indexOf("supabase-client.js") !== -1 && window.hijrahSupabase)) resolve();
        return;
      }
      var script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.onload = function () { script.dataset.hnLoaded = "1"; resolve(); };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  var adminVerified = false;
  var authStorageKey = "sb-dejmckimvstfjeickplx-auth-token";

  function hasStoredSession() {
    try {
      var raw = window.localStorage.getItem(authStorageKey);
      if (!raw) return false;
      var saved = JSON.parse(raw);
      return !!(saved && saved.access_token && saved.refresh_token);
    } catch (error) {
      // If storage is unavailable, fail closed and attempt explicit server-side role verification.
      return true;
    }
  }

  async function verifyAdmin() {
    if (adminVerified || !hasStoredSession()) return;
    try {
      if (!window.__ENV) await loadScript("/assets/config.js");
      if (!window.supabase || !window.supabase.createClient) {
        await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/dist/umd/supabase.js");
      }
      if (!window.hijrahSupabase) {
        var clientScriptExists = Array.prototype.some.call(document.scripts, function (script) {
          return script.src && script.src.indexOf("/supabase-client.js") !== -1;
        });
        if (!clientScriptExists) await loadScript("/supabase-client.js");
      }
      var client = window.hijrahSupabase;
      if (!client || !client.auth) return;
      var sessionResult = await client.auth.getSession();
      var user = sessionResult && sessionResult.data && sessionResult.data.session && sessionResult.data.session.user;
      if (!user) return;
      var result = await client.rpc("is_admin");
      if (!result.error && result.data === true) allowAdmin();
    } catch (error) {
      // Fail closed: zonder bevestigde adminrol blijft kopieerbescherming actief.
    }
  }

  // Recheck if a session is created in another tab or after returning from sign-in.
  window.addEventListener("focus", verifyAdmin);
  window.addEventListener("storage", function (event) {
    if (event.key === authStorageKey) verifyAdmin();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", verifyAdmin, { once: true });
  } else {
    verifyAdmin();
  }
})();