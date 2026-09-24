(function () {
  "use strict";

  let adminCopyAllowed = false;

  async function checkAdmin() {
    try {
      if (!window.hijrahSupabase) return;
      const { data: { user } } = await window.hijrahSupabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await window.hijrahSupabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      adminCopyAllowed = profile?.role === "admin";
    } catch (error) {
      console.warn("HN kopieerrechten konden niet worden gecontroleerd.", error);
    }
  }

  function isEditable(target) {
    if (!target) return false;

    const tag = target.tagName;

    return (
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      target.isContentEditable
    );
  }

  document.addEventListener("contextmenu", function (event) {
    if (!isEditable(event.target)) {
      event.preventDefault();
    }
  });

  document.addEventListener("selectstart", function (event) {
    if (!isEditable(event.target)) {
      event.preventDefault();
    }
  });

  document.addEventListener("copy", function (event) {
    if (!isEditable(event.target)) {
      event.preventDefault();
    }
  });

  document.addEventListener("cut", function (event) {
    if (!isEditable(event.target)) {
      event.preventDefault();
    }
  });

  document.addEventListener("dragstart", function (event) {
    if (!isEditable(event.target)) {
      event.preventDefault();
    }
  });

  document.addEventListener("keydown", function (event) {

    const key = event.key.toLowerCase();

    if (isEditable(event.target)) {
      return;
    }

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
      event.ctrlKey &&
      event.shiftKey &&
      ["i", "j", "c"].includes(key)
    ) {
      event.preventDefault();
    }
  });

})();
