# Race Analysis Hub

Race Analysis Hub è un progetto indipendente per consultare dati e analisi
editoriali sul campionato mondiale di Formula 1.

Il progetto comprende:

- un frontend React/Vite;
- un backend REST Node.js/Express;
- un database MongoDB con piloti, scuderie, gare, classifiche e analisi;
- grafici Chart.js delle posizioni di qualifica e gara derivate da F1DB.

Le API v1 sono pubbliche, anonime e di sola lettura. Non richiedono
autenticazione e accettano esclusivamente `GET`, `HEAD` e `OPTIONS`.

## Documentazione API

Swagger è la documentazione ufficiale e interattiva:

```text
http://localhost:5002/api/docs
```

La specifica OpenAPI 3.1 in formato JSON è disponibile su:

```text
http://localhost:5002/api/v1/openapi.json
```

Istanza attualmente pubblicata:

```text
https://f1-stats-5v93.onrender.com/api/docs
https://f1-stats-5v93.onrender.com/api/v1/openapi.json
```

Il contratto pubblico corrente è `v1`; la versione applicativa documentata è
`1.2.0`. Il referente tecnico è Marco Tannoia
(`marco.tannoia@gmail.com`).

## Origine dei grafici

Il frontend non interroga provider esterni per costruire i grafici. Le
posizioni di gara e qualifica provengono dallo snapshot locale derivato da
F1DB; il backend prepara le serie numeriche e Chart.js le visualizza nelle
pagine di piloti e scuderie. Versione, hash dell'archivio, licenza e
trasformazioni sono registrati nello snapshot e nelle risposte API.

Quando F1DB pubblica una nuova release, scaricare e decomprimere
`f1db-json-splitted.zip`, quindi rigenerare e verificare lo snapshot:

```bash
npm run sync-f1db -- /percorso/alla/distribuzione-f1db
npm run verify-data
```

Il flusso post-GP rimane separato e serve ad aggiornare i testi editoriali:

1. compilare `risultatiPiloti` con `posizioneGara` e
   `posizioneQualifica`;
2. controllare slug, stagione e annotazioni;
3. impostare `pronto` a `true`;
4. eseguire prima il controllo e poi la registrazione.

```bash
npm run gp -- --controlla
npm run gp
```

I risultati F1DB `DNF`, `DNS`, `DSQ` o `NC` vengono mantenuti come punti
mancanti nei grafici, senza trasformarli in posizioni numeriche inventate.

## Avvio locale

Installare le dipendenze:

```bash
npm ci --prefix backend
npm ci --prefix frontend
```

Avviare il backend dalla cartella `backend`:

```bash
npm run dev
```

In un secondo terminale, avviare il frontend dalla cartella `frontend`:

```bash
npm run dev
```

Il backend usa `http://localhost:5002`. Creare `backend/.env` partendo da
`backend/.env.example`; le credenziali MongoDB non devono mai essere inserite
nel repository.

## Controlli prima del rilascio

```bash
npm test
npm run lint
npm run build
npm run lint:api
npm run verify-data
npm run verify-db
```

`verify-db` richiede un collegamento valido al database e deve confermare che
esista una sola gara con stato `attuale`.

Altri comandi amministrativi:

```bash
npm --prefix backend run seed
npm run set-current -- slug-del-gran-premio
```

## Pubblicazione su Render

`render.yaml` configura un unico Web Service: Render compila il frontend e il
backend Express serve sia l'applicazione sia le API. `MONGO_URL` deve essere
impostata come variabile segreta nel pannello Render.

L'istanza gratuita è adatta a sviluppo e dimostrazioni, non a una consegna con
tempi di risposta prevedibili: dopo 15 minuti senza traffico viene sospesa e la
prima richiesta successiva può impiegare circa un minuto per riattivarla. Per
un'API consegnata a una società è raccomandata un'istanza di servizio a
pagamento; il piano del workspace e il tipo di istanza sono impostazioni
distinte su Render.

## Marchi, fonti e responsabilità

Il nome del prodotto e della repository è intenzionalmente neutro. I termini
“Formula 1”, “F1” e “Grand Prix” sono usati soltanto in modo descrittivo; il
progetto non utilizza loghi ufficiali.

> This website is unofficial and is not associated in any way with the Formula
> 1 companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP,
> GRAND PRIX and related marks are trade marks of Formula One Licensing B.V.

Le fonti sono indicate per trasparenza editoriale. Una citazione, da sola, non
attribuisce automaticamente il diritto di ripubblicare contenuti, statistiche
o database di terzi. Prima di un utilizzo commerciale, il titolare del progetto
deve verificare di avere i diritti necessari per ciascun dato e contenuto
pubblicato. Vedere anche `NOTICE.md`.

Le classifiche 2026, i risultati di gara e qualifica 2023-2025 e i grafici
quantitativi 2026 provengono dallo snapshot locale derivato da
[F1DB v2026.11.0](https://github.com/f1db/f1db/releases/tag/v2026.11.0).
F1DB è distribuito con licenza
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), che consente anche
l'uso commerciale con attribuzione. Race Analysis Hub filtra, rinomina e
normalizza il sottoinsieme utilizzato; i dettagli sono in `NOTICE.md`.

Il codice e i contenuti editoriali originali sono distribuiti con tutti i
diritti riservati. Il sottoinsieme di dati derivato da F1DB resta soggetto alla
CC BY 4.0; i marchi e gli altri contenuti di terzi restano soggetti ai diritti
dei rispettivi titolari.
