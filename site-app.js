/* HN public-site
   Live Supabase data voor de publieke website.
   Behoudt het bestaande design en voorkomt eindeloos "laden".
*/

(function () {
  'use strict';

  const esc = (value) => {
    if (value == null) return '';

    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  function getDb() {
    return window.hijrahSupabase || null;
  }

  function showCountriesError(message) {
    const grid = document.querySelector('[data-source="countries"]');

    if (!grid) return;

    grid.innerHTML = `
      <article class="card country-card">
        <div class="country-media">
          <span class="flag-emoji">🌍</span>
        </div>

        <div class="country-body">
          <h3>De landen konden niet worden geladen</h3>
          <p>${esc(message)}</p>
        </div>
      </article>
    `;
  }

  async function waitForSupabase() {
    const maxAttempts = 80;

    for (let i = 0; i < maxAttempts; i++) {
      const db = getDb();

      if (db && typeof db.from === 'function') {
        return db;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error('Supabase kon niet worden geladen.');
  }

  async function loadCountries(db) {
    const grid = document.querySelector('[data-source="countries"]');

    if (!grid) return [];

    try {
      /*
       * We halen alle landen op.
       * Daarna bepalen we zelf welke zichtbaar zijn.
       * Hierdoor zijn we niet afhankelijk van één specifieke
       * statuskolom.
       */
      const result = await db
        .from('countries')
        .select('*')
        .order('name');

      if (result.error) {
        throw result.error;
      }

      const rows = result.data || [];

      const countries = rows.filter(country => {
        // Als is_active bestaat, respecteren we die.
        if (
          Object.prototype.hasOwnProperty.call(country, 'is_active') &&
          country.is_active === false
        ) {
          return false;
        }

        // Als status bestaat, verberg alleen duidelijke inactieve statussen.
        if (country.status != null) {
          const status = String(country.status).toLowerCase().trim();

          const hiddenStatuses = [
            'inactive',
            'inactief',
            'draft',
            'concept',
            'archived',
            'archive',
            'disabled',
            'uitgeschakeld'
          ];

          if (hiddenStatuses.includes(status)) {
            return false;
          }
        }

        return true;
      });

      if (!countries.length) {
        grid.innerHTML = `
          <p class="demo-note">
            Er zijn momenteel nog geen landen beschikbaar.
          </p>
        `;

        return [];
      }

      /*
       * Steden worden apart opgehaald.
       * Als steden niet werken, kunnen de landen nog steeds verschijnen.
       */
      let cities = [];

      try {
        const cityResult = await db
          .from('cities')
          .select('id,name,slug,country_id,is_active');

        if (!cityResult.error) {
          cities = cityResult.data || [];
        }
      } catch (error) {
        console.warn('HN: steden konden niet worden geladen:', error);
      }

      grid.innerHTML = countries.map(country => {
        const countryId = country.id;

        const countryCities = cities.filter(city => {
          if (city.country_id !== countryId) return false;

          if (
            Object.prototype.hasOwnProperty.call(city, 'is_active') &&
            city.is_active === false
          ) {
            return false;
          }

          return true;
        });

        const count = countryCities.length;

        const description =
          country.description ||
          country.beschrijving ||
          country.summary ||
          'Praktische HN-informatie en kennis over dit land.';

        const countryFilterId = country.id;

        return `
          <article class="card country-card">
            <div class="country-media">
              <span class="flag-emoji">✈</span>
              <span class="city-count">
                ${count} ${count === 1 ? 'stad' : 'steden'}
              </span>
            </div>

            <div class="country-body">
              <h3>${esc(country.name || 'Onbekend land')}</h3>

              <p>
                ${esc(description)}
              </p>

              <div class="country-footer">
                <span class="badge">
                  ${count ? 'Beschikbaar' : 'Binnenkort'}
                </span>

                <a
                  href="/kennisbank?country=${encodeURIComponent(countryFilterId)}"
                  class="country-link"
                >
                  Bekijk land →
                </a>
              </div>
            </div>
          </article>
        `;
      }).join('');

      return countries;

    } catch (error) {
      console.error('HN: landen konden niet worden geladen:', error);

      showCountriesError(
        error.message || 'Controleer de verbinding met de database.'
      );

      return [];
    }
  }

  async function loadCities(db) {
    try {
      const result = await db
        .from('cities')
        .select('*')
        .order('name');

      if (result.error) {
        console.warn('HN: steden:', result.error);
        return [];
      }

      return result.data || [];

    } catch (error) {
      console.warn('HN: steden konden niet worden geladen:', error);
      return [];
    }
  }

  async function loadCategories(db) {
    try {
      const result = await db
        .from('categories')
        .select('*')
        .order('name');

      if (result.error) {
        console.warn('HN: categorieën:', result.error);
        return [];
      }

      return (result.data || []).filter(category => {
        if (
          Object.prototype.hasOwnProperty.call(category, 'is_active') &&
          category.is_active === false
        ) {
          return false;
        }

        return true;
      });

    } catch (error) {
      console.warn('HN: categorieën konden niet worden geladen:', error);
      return [];
    }
  }

  async function loadTopics(db) {
    try {
      const result = await db
        .from('topic')
        .select(`
          id,
          title,
          slug,
          summary,
          information_type,
          updated_at,
          country_id,
          city_id,
          category_id,
          categories(name),
          countries(name),
          cities(name)
        `)
        .eq('published', true)
        .order('updated_at', { ascending: false })
        .limit(12);

      if (result.error) {
        console.warn('HN: topics:', result.error);
        return [];
      }

      return result.data || [];

    } catch (error) {
      console.warn('HN: topics konden niet worden geladen:', error);
      return [];
    }
  }

  function updateHeroCounts(countries, cities, categories, topics) {
    const preview = document.querySelector('.hero-preview');

    if (!preview) return;

    const nums = preview.querySelectorAll('.num');

    if (nums[0]) nums[0].textContent = countries.length + '+';
    if (nums[1]) nums[1].textContent = cities.length + '+';
    if (nums[2]) nums[2].textContent = categories.length;
    if (nums[3]) nums[3].textContent = topics.length + '+';
  }

  function updateKnowledgeCategories(categories, topics) {
    const kb = document.querySelector(
      '[data-source="knowledge-categories"]'
    );

    if (!kb) return;

    const categoryCounts = new Map();

    categories.forEach(category => {
      categoryCounts.set(category.id, 0);
    });

    topics.forEach(topic => {
      if (!topic.category_id) return;

      categoryCounts.set(
        topic.category_id,
        (categoryCounts.get(topic.category_id) || 0) + 1
      );
    });

    kb.innerHTML = categories.slice(0, 6).map(category => `
      <div class="card kb-card">
        <div class="kb-icon">✓</div>

        <div>
          <h4>${esc(category.name)}</h4>

          <p>
            ${esc(
              category.description ||
              'Praktische HN-informatie per onderwerp.'
            )}
          </p>

          <span class="count">
            ${categoryCounts.get(category.id) || 0} artikelen
          </span>
        </div>
      </div>
    `).join('') || `
      <p class="demo-note">
        Nog geen actieve categorieën.
      </p>
    `;
  }

  function updateKnowledgePreview(topics) {
    const preview = document.querySelector('.kb-article-preview');

    if (!preview || !topics.length) return;

    const topic = topics[0];

    const tags = preview.querySelector('.tag-row');

    if (tags) {
      tags.innerHTML = `
        <span class="badge">
          ${esc(topic.categories?.name || 'Kennisbank')}
        </span>

        <span class="badge">
          ${esc(
            topic.cities?.name ||
            topic.countries?.name ||
            'HN'
          )}
        </span>
      `;
    }

    const heading = preview.querySelector('h4');

    if (heading) {
      heading.textContent = topic.title || '';
    }

    const paragraph = preview.querySelector('p');

    if (paragraph) {
      paragraph.textContent = topic.summary || '';
    }

    const link = preview.querySelector('a');

    if (link) {
      link.href =
        '/kennisbank?topic=' +
        encodeURIComponent(topic.id);
    }
  }

  function setupSearch() {
    const search = document.querySelector(
      '[data-search-source="global"]'
    );

    if (search) {
      const form = search.closest('form');

      if (form) {
        form.onsubmit = function (event) {
          event.preventDefault();

          const value = search.value.trim();

          if (!value) return;

          window.location.href =
            '/kennisbank?q=' +
            encodeURIComponent(value);
        };
      }
    }

    document.querySelectorAll('.search-chips .chip').forEach(button => {
      button.onclick = function () {
        const value = button.textContent.trim();

        if (!value) return;

        window.location.href =
          '/kennisbank?q=' +
          encodeURIComponent(value);
      };
    });
  }

  function setupSmartSearch() {
    document.querySelectorAll('a').forEach(link => {
      if (
        link.textContent.trim() ===
        'Start de Smart Search'
      ) {
        link.href = '/smart-search';
      }
    });
  }

  function setupNewsletter() {
    /*
     * Nog geen echte e-mailprovider gekoppeld.
     * De bestaande homepage-handler informeert de bezoeker.
     */
  }

  async function load() {
    const db = await waitForSupabase();

    /*
     * Eerst landen laden.
     * Dit is onafhankelijk van topics/categorieën.
     */
    const countries = await loadCountries(db);

    /*
     * De overige data mag nooit verhinderen dat landen zichtbaar worden.
     */
    const [cities, categories, topics] = await Promise.all([
      loadCities(db),
      loadCategories(db),
      loadTopics(db)
    ]);

    updateHeroCounts(
      countries,
      cities,
      categories,
      topics
    );

    updateKnowledgeCategories(
      categories,
      topics
    );

    updateKnowledgePreview(topics);

    setupSearch();
    setupSmartSearch();
    setupNewsletter();

    console.log(
      'HN geladen:',
      countries.length,
      'landen |',
      cities.length,
      'steden |',
      categories.length,
      'categorieën |',
      topics.length,
      'topics'
    );
  }

  document.addEventListener(
    'DOMContentLoaded',
    function () {
      load().catch(function (error) {
        console.error('HN public site:', error);

        /*
         * Alleen tonen als de landen zelf nog op "laden" staan.
         */
        const grid = document.querySelector(
          '[data-source="countries"]'
        );

        if (grid) {
          const loading = grid.querySelector(
            '#countriesLoading'
          );

          if (loading) {
            showCountriesError(
              error.message ||
              'Er is een probleem met de databaseverbinding.'
            );
          }
        }
      });
    }
  );

})();
