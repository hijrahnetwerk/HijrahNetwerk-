(function () {
  const db = window.hijrahSupabase;

  if (!db) {
    console.error("Hijrah Netwerk: Supabase client niet gevonden.");
    return;
  }

  async function loadCountries() {
    const container = document.querySelector('[data-source="countries"]');

    if (!container) return;

    const { data, error } = await db
      .from("countries")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Landen laden mislukt:", error);
      return;
    }

    if (!data || data.length === 0) {
      container.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:30px;color:#5c5346;">
          Er zijn momenteel geen actieve landen beschikbaar.
        </div>
      `;
      return;
    }

    container.innerHTML = data.map(country => {
      const name = country.name || "Onbekend land";
      const description = country.description || "Praktische informatie over dit land.";
      const code = (country.code || "").toLowerCase();

      return `
        <article class="card country-card" data-country="${escapeHtml(code)}">
          <div class="country-media">
            <span class="flag-emoji">${getFlagEmoji(code)}</span>
            <span class="city-count">Bekijk steden</span>
          </div>

          <div class="country-body">
            <h3>${escapeHtml(name)}</h3>
            <p>${escapeHtml(description)}</p>

            <div class="country-footer">
              <span class="badge">Actief</span>
              <a href="#" class="country-link">
                Bekijk land →
              </a>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getFlagEmoji(code) {
    const flags = {
      ma: "🇲🇦",
      eg: "🇪🇬",
      tr: "🇹🇷",
      id: "🇮🇩",
      my: "🇲🇾",
      ae: "🇦🇪",
      sa: "🇸🇦",
      qa: "🇶🇦",
      om: "🇴🇲",
      tn: "🇹🇳",
      dz: "🇩🇿"
    };

    return flags[code] || "🌍";
  }

  document.addEventListener("DOMContentLoaded", loadCountries);
})();
