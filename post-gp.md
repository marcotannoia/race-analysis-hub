# Aggiornamento dopo un Gran Premio

Ogni analisi conserva un array `storicoEdizioni`. A gara conclusa questo array
riceve un record strutturato con stagione, posizione in gara e qualifica, nota
sul risultato, passo, gomme e affidabilità. Se lo stesso aggiornamento viene
eseguito di nuovo, il record di quella stagione viene sostituito e non duplicato.

Dalla cartella principale del progetto si usa sempre lo stesso comando:

```bash
npm run gp
```

Se `backend/data/aggiornamento-gp.json` non esiste, il comando lo genera per il
GP attualmente visibile. Il file contiene già tutti i piloti, tutte le scuderie
e le classifiche correnti. Bisogna quindi:

1. inserire posizione di gara e qualifica per tutti i piloti;
2. aggiornare le due classifiche complete;
3. aggiungere, quando disponibili, note, passo gara, gomme e affidabilità;
4. impostare `"pronto": true`;
5. rilanciare `npm run gp`.

Lo script controlla che nessun pilota o elemento della classifica sia assente,
costruisce automaticamente i risultati delle scuderie, registra lo storico,
aggiorna le classifiche, chiude il GP corrente e pubblica il successivo in base
all'ordine del calendario.

Prima di scrivere nel database si può eseguire un controllo completo:

```bash
npm run gp -- --controlla
```

Dopo l'aggiornamento, il file compilato viene conservato in
`backend/data/archivio-gp/`. Il comando non usa API esterne: i contenuti
editoriali e i risultati inseriti restano quelli verificati manualmente.

Questa procedura non aggiorna i grafici quantitativi 2026, che provengono dallo
snapshot locale derivato da F1DB. Per aggiungere nuovi GP ai grafici bisogna
rigenerare lo snapshot da una release F1DB, eseguire `npm run verify-data` e
pubblicare il codice aggiornato. Versione, licenza e trasformazioni dello
snapshot sono documentate in `NOTICE.md`.

## Effetto sulla classifica previsionale

La classifica della landing page viene generata dal backend per il GP marcato
come `attuale`. Dopo `npm run gp` passa quindi automaticamente alla gara
successiva e utilizza le nuove classifiche piloti e scuderie.

La forma recente e la qualifica 2026 dipendono anche dallo snapshot F1DB. Finché
lo snapshot non viene rigenerato, quei fattori restano fermi all'ultima release
documentata. Compatibilità con la pista, gestione gomme, affidabilità e
aggiornamenti tecnici derivano invece dalle analisi editoriali della nuova gara.

Prima della pubblicazione controllare in particolare
`aggiornamentiInArrivo`: un pacchetto soltanto annunciato o non pertinente non
deve essere descritto come un vantaggio verificato. La previsione riduce o
annulla automaticamente il contributo quando il testo indica assenza di
componenti confermati, mancati miglioramenti o scarsa pertinenza con il circuito.

Per rigenerare volontariamente il modulo corrente:

```bash
npm run gp -- --prepara --sovrascrivi
```
