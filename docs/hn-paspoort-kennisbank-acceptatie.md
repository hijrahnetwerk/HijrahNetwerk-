# HN Paspoort + Kennisbank — ontwerpbesluiten en acceptatiecriteria

Status: concept voor review; nog niet gekoppeld aan live routes of echte toegang.  
Doel: één samenhangende ervaring voor het HN Paspoort, stempels, bijdragen en verdiepende kennisbankinhoud.

## De acht besluiten

### 1. Geen onduidelijke puntenvaluta
In v1 geen abstracte punten die leden moeten leren begrijpen. Elke afgeschermde functie toont concreet welke toegangsvorm geldt: openbaar, account vereist, goedgekeurde bijdrage, handmatige toekenning of vrijwillige financiële steun. Een bijdrage is geen betaling en wordt niet als geldwaarde gepresenteerd.

**Acceptatie:** op elke vergrendelde functie staat vóór de actie wat open is, wat vergrendeld is en hoe toegang verkregen kan worden.

### 2. Geen dubbele beloning voor dezelfde handeling
Een inzending krijgt één beoordeling en kan niet herhaald worden ingediend om dezelfde beloning steeds opnieuw te claimen. Updates kunnen opnieuw beoordeeld worden wanneer ze aantoonbaar nieuwe informatie bevatten.

**Acceptatie:** backend gebruikt een unieke relatie tussen lid, bijdrage en beloning; herhaalde requests leveren geen extra stempel of toegang op.

### 3. Geen automatische beloning voor onbewezen claims
Een inzending is niet hetzelfde als een goedgekeurde bijdrage. Reviews, ervaringen, lokale tips en stadsfiches worden beoordeeld op context, bruikbaarheid, actualiteit, bronvermelding en privacy. Community-ervaringen worden niet als officiële feiten weergegeven.

**Acceptatie:** statussen zoals Ingediend, In beoordeling, Aanpassing nodig, Goedgekeurd en Afgewezen; alleen Goedgekeurd kan een beloning activeren. Elke inhoudspagina toont een passende bronstatus.

### 4. Toegang moet voorspelbaar zijn
Vermijd een onverwachte betaalmuur na een lange tekst. De basisinformatie blijft leesbaar. Toon bij verdieping de reden voor de beperking, vereisten, alternatieven en of de toegang blijvend of tijdelijk is. Een abonnement of periodieke betaling is in v1 niet nodig.

**Acceptatie:** vóór een bijdrage of betaling zijn voorwaarden, toegangsomvang en eventuele duur zichtbaar; een afwijzing of wijziging leidt niet stilzwijgend tot verlies van reeds toegezegde blijvende toegang.

### 5. HN-regels zijn beheerbaar via het adminpaneel
Beheerders moeten toegangsmatrix, stempelbeschrijving, bijdragecriteria, status, toekenningswijze en handmatige uitzonderingen kunnen beheren zonder codewijzigingen. Alle wijzigingen aan toegang en beloningen worden gelogd.

**Acceptatie:** alleen bevoegde admins kunnen regels wijzigen; wijzigingen registreren wie, wat en wanneer heeft aangepast. Een admin-preview maakt duidelijk wat leden zullen zien.

### 6. Meet voortgang en kwaliteit, niet alleen klikken
Gebruik meetpunten die aantonen of de community waarde levert: eerste behaalde stempel, ingediende en goedgekeurde bijdragen, tijd tot beoordeling, ontgrendelde functies die daadwerkelijk worden gebruikt, herhaalde bijdragen en afgewezen/spam-inzendingen. Meet niet meer persoonsgegevens dan nodig.

**Acceptatie:** rapporteer geaggregeerde aantallen en conversies; geen openbare ranglijst op basis van activiteit of donatiebedrag.

### 7. Houd de eerste versie eenvoudig
Geen puntenwinkel, abonnementenstructuur of openbare competitie in v1. Geen gamification die mensen onder druk zet om persoonlijke verhalen of gevoelige gegevens te delen. Stempels bevestigen nuttige voortgang en bijdragen; ze mogen geen oordeel zijn over iemands religieuze inzet of hijrah-succes.

**Acceptatie:** geen scorebord, streaks, schaarste-timers of verliesdreiging; leden kunnen hun profiel en badges verbergen waar die instellingen bestaan.

### 8. Beperk v1 tot drie duidelijke bijdragevormen en één toegangsmatrix
Start met:
1. Lokale informatie of een bron toevoegen/bijwerken.
2. Een persoonlijke ervaring met context delen.
3. Een bestaande fiche of bron controleren.

Vrijwillige financiële steun kan als aparte optie worden aangeboden, maar mag niet de enige weg zijn. Een beheerde toegangsmatrix koppelt een goedgekeurde bijdrage of expliciete admin-toekenning aan specifieke functies. Het interactieve paspoort toont de zeven fasen: Oriënteren, Onderzoeken, Voorbereiden, Vertrekken, Aankomen, Integreren en Delen.

**Acceptatie:** elke stempel heeft criteria en een duidelijke volgende stap; een lid kan zien welke bijdrage nog nodig is en wat die concreet ontgrendelt.

## Gedeelde ontwerpregels

- Eén HN-ontwerpsysteem voor paspoort, kennisbankartikelen, voortgang, bijdrageformulieren en toegangsmeldingen.
- Merkkleuren: bruin `#674C2E`, roest `#DD842A`, goud `#C6A15B`, wit `#FFFFFF`; goud zichtbaar inzetten voor voortgang en verdiende stempels.
- Professionele, volwassen uitstraling; mobiel responsief, toetsenbordtoegankelijk en duidelijke focusstatus.
- De voorbeeldartikelsjabloon mag geen verzonnen interview, lidmaatschapscijfers, aanpassingsclaims of prijsinformatie als feiten tonen. Placeholderinhoud moet herkenbaar als voorbeeld gemarkeerd zijn tot er gecontroleerde redactionele inhoud is.
- Een bezoekerspreview, demo-schakelaar of CSS-blur is nooit echte toegangsbeveiliging.

## Technische randvoorwaarden vóór livegang

1. Lees de huidige Supabase-schema's, bestaande RPC's en RLS-regels voordat nieuwe tabellen of regels worden toegevoegd.
2. Toegang wordt server-side afgedwongen; afgeschermde tekst mag niet volledig naar een onbevoegde browser worden gestuurd en alleen visueel verborgen worden.
3. Beoordeling en beloning zijn transactioneel/idempotent; een client kan zichzelf geen stempel, rol of toegang geven.
4. Admin-functies vereisen server-side rolcontrole en auditlogging.
5. Test anonieme gebruiker, ingelogd lid zonder bijdrage, lid met ingediende bijdrage, goedgekeurde bijdrager en admin.
6. Eerst feature branch en preview/test; geen productie-deploy of merge naar `main` zonder expliciete goedkeuring.

## Wat deze conceptpreview wel en niet doet

`concept-paspoort-kennisbank.html` toont de visuele samenhang en laat een bezoeker, lid en bijdrager als demo wisselen. De knoppen simuleren toestanden en versturen niets. Het is geen authenticatie, betaling, databasekoppeling of echte autorisatie. De bestaande `paspoort.html`, `kennisbank.html` en `admin-paspoort.html` zijn niet vervangen door deze preview.
