(function () {
  'use strict';

  const root = document.getElementById('settings');
  const db = window.hijrahSupabase;
  const status = document.getElementById('privacySettingsStatus');
  const nameInput = document.getElementById('privacyResponsibleName');
  const emailInput = document.getElementById('privacyEmail');
  const addressInput = document.getElementById('privacyPostalAddress');
  const savePrivacyButton = document.getElementById('savePrivacySettings');
  let generalSettings = [];

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function setPrivacyStatus(message, isError) {
    if (!status) return;
    status.textContent = message;
    status.style.color = isError ? '#a12622' : '#276749';
  }

  async function requireAdmin() {
    if (!db) {
      location = '/login?next=/admin-cms';
      return false;
    }
    const sessionResult = await db.auth.getSession();
    const session = sessionResult.data && sessionResult.data.session;
    if (!session) {
      location = '/login?next=/admin-cms';
      return false;
    }
    const profileResult = await db.from('profiles').select('role').eq('id', session.user.id).maybeSingle();
    if (profileResult.error || !profileResult.data || profileResult.data.role !== 'admin') {
      document.body.innerHTML = '<main><h1>Geen toegang</h1><p>Alleen beheerders kunnen deze instellingen aanpassen.</p></main>';
      return false;
    }
    return true;
  }

  async function loadGeneralSettings() {
    const result = await db.from('hn_site_settings').select('*').order('key');
    if (result.error) {
      root.textContent = 'Site-instellingen konden niet worden geladen: ' + result.error.message;
      return;
    }
    generalSettings = (result.data || []).filter(function (row) { return row.key !== 'privacy_contact'; });
    root.innerHTML = generalSettings.map(function (row, index) {
      return '<p><b>' + escapeHtml(row.key) + '</b><textarea data-index="' + index + '" style="width:100%;min-height:90px;box-sizing:border-box">' +
        escapeHtml(JSON.stringify(row.value, null, 2)) + '</textarea></p>';
    }).join('') || '<p>Geen algemene instellingen gevonden.</p>';

    const saveButton = document.getElementById('save');
    if (saveButton) saveButton.onclick = async function () {
      saveButton.disabled = true;
      try {
        for (const field of root.querySelectorAll('textarea[data-index]')) {
          const row = generalSettings[Number(field.dataset.index)];
          let value;
          try {
            value = JSON.parse(field.value);
          } catch (_) {
            alert('Ongeldige JSON bij ' + row.key + '. De wijzigingen zijn niet opgeslagen.');
            return;
          }
          const saved = await db.from('hn_site_settings').update({ value: value }).eq('key', row.key);
          if (saved.error) {
            alert('Opslaan mislukt bij ' + row.key + ': ' + saved.error.message);
            return;
          }
        }
        alert('Algemene site-instellingen opgeslagen.');
      } finally {
        saveButton.disabled = false;
      }
    };
  }

  async function loadPrivacySettings() {
    const result = await db.from('hn_site_settings').select('value').eq('key', 'privacy_contact').maybeSingle();
    if (result.error) {
      setPrivacyStatus('Privacygegevens konden niet worden geladen. Vernieuw de pagina of meld dit aan de beheerder.', true);
      return;
    }
    const value = result.data && result.data.value ? result.data.value : {};
    nameInput.value = typeof value.responsible_name === 'string' ? value.responsible_name : '';
    emailInput.value = typeof value.privacy_email === 'string' ? value.privacy_email : '';
    addressInput.value = typeof value.postal_address === 'string' ? value.postal_address : '';
    setPrivacyStatus('Gegevens geladen. Nog niet opgeslagen wijzigingen gaan verloren als je de pagina verlaat.', false);
  }

  async function savePrivacySettings() {
    const responsibleName = nameInput.value.trim();
    const privacyEmail = emailInput.value.trim();
    const postalAddress = addressInput.value.trim();

    if (responsibleName.length > 200 || privacyEmail.length > 254 || postalAddress.length > 500) {
      setPrivacyStatus('Controleer de maximale lengte van de ingevulde velden.', true);
      return;
    }
    if (privacyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(privacyEmail)) {
      setPrivacyStatus('Vul een geldig e-mailadres in of laat het veld leeg.', true);
      emailInput.focus();
      return;
    }

    savePrivacyButton.disabled = true;
    setPrivacyStatus('Opslaan…', false);
    try {
      const value = {
        responsible_name: responsibleName,
        privacy_email: privacyEmail,
        postal_address: postalAddress,
        country: 'Marokko'
      };
      const result = await db.from('hn_site_settings')
        .upsert({ key: 'privacy_contact', value: value }, { onConflict: 'key' })
        .select('key')
        .single();
      if (result.error) {
        setPrivacyStatus('Opslaan mislukt: ' + result.error.message, true);
        return;
      }
      setPrivacyStatus('Privacygegevens opgeslagen. Open de privacyverklaring om de weergave te controleren.', false);
    } catch (_) {
      setPrivacyStatus('Opslaan mislukt door een onverwachte fout. Probeer het opnieuw.', true);
    } finally {
      savePrivacyButton.disabled = false;
    }
  }

  async function run() {
    if (!(await requireAdmin())) return;
    await Promise.all([loadGeneralSettings(), loadPrivacySettings()]);
    if (savePrivacyButton) savePrivacyButton.addEventListener('click', savePrivacySettings);
  }

  run().catch(function () {
    setPrivacyStatus('Het beheercentrum kon niet volledig worden geladen. Vernieuw de pagina en probeer opnieuw.', true);
  });
})();