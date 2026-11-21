# Hijrah Netwerk — vaste ontwerpstandaard voor beheerpagina's

## Bron van waarheid
De pagina `/admin-cms` is de vaste visuele en structurele referentie voor alle beheerpagina's van Hijrah Netwerk. Deze keuze geldt blijvend voor nieuwe én bestaande beheeronderdelen. De gebruiker hoeft dit niet per opdracht opnieuw te vermelden.

## Wat gelijk moet blijven
- Dezelfde lichte CMS-omgeving: witte zijbalk, witte bovenbalk en een zachte achtergrond (`#f7f5f1`).
- Dezelfde zijbalkbreedte, uitlijning, navigatie-afstanden, actieve navigatiestatus en mobiele werking.
- Dezelfde typografie en hiërarchie: heldere paginatitels, subtiele bovenlabels, rustige beschrijvingen en consistente tekstgroottes.
- Dezelfde componenttaal: kaarten, panelen, tabellen, formulieren, zoekvelden, statuslabels en knoppen.
- Dezelfde afgeronde hoeken, dunne warme randen, lichte schaduwen en consistente witruimte.
- Dezelfde HN-kleuren: bruin `#684a25`, roest `#df842c`, subtiel goud `#c9a227`, wit en de CMS-achtergrond `#f7f5f1`.
- Dezelfde responsive regels en toegankelijk zichtbare focus-states.

## Wat per beheerpagina mag verschillen
De paginatitel, inhoud, gegevens, acties en relevante menu-items mogen verschillen. De navigatie-items blijven afgestemd op de rol en functie van de pagina. Een admin-menu wordt nooit zichtbaar gemaakt voor gewone leden of bezoekers.

## Technische regel
Gebruik gedeelde CMS-componenten en centrale tokens waar mogelijk. Voeg geen afzonderlijke, afwijkende admin-shell of willekeurige lokale CSS toe als dezelfde CMS-component kan worden hergebruikt. CSS die later wordt geladen mag de CMS-standaard niet onbedoeld overschrijven.

## Controle vóór oplevering
Controleer de pagina op desktop en mobiel naast `/admin-cms`. Controleer minimaal: zijbalk, bovenbalk, paginatitel, kaarten/panelen, formulieren, tabellen, knoppen, actieve navigatie en responsive gedrag. Noem een pagina pas CMS-gelijk wanneer deze visueel is gecontroleerd; alleen dezelfde kleuren gebruiken is niet voldoende.
