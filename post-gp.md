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

1. indicare `condizioniGara` con `asciutto`, `misto` o `bagnato`;
2. inserire in `fonteIndicatori` un URL HTTPS che documenti gara e incidenti;
3. inserire posizione di gara e qualifica per tutti i piloti;
4. compilare `errorePilota` per tutti con `nessuno`, `non_fatale` o `fatale`;
5. aggiornare le due classifiche complete;
6. aggiungere, quando disponibili, note, passo gara, gomme e affidabilità;
7. impostare `"pronto": true`;
8. rilanciare `npm run gp`.

Lo script controlla che nessun pilota o elemento della classifica sia assente,
costruisce automaticamente i risultati delle scuderie, registra lo storico,
aggiorna le classifiche, chiude il GP corrente e pubblica il successivo in base
all'ordine del calendario. Aggiorna inoltre
`backend/data/statistiche-contesto.json` in modo cumulativo e idempotente: un
GP già applicato non può incrementare due volte percentuali e conteggi.

`misto` richiede una parte considerevole di gara su pista bagnata e una parte
considerevole dopo che la pioggia è cessata; poche gocce senza effetto sulle
condizioni di gara restano `asciutto`. Un errore `fatale` termina la gara oppure
ne compromette definitivamente il risultato. Le percentuali generali e fatali
usano entrambe tutte le partenze come denominatore.

Prima di scrivere nel database si può eseguire un controllo completo:

```bash
npm run gp -- --controlla
```

Dopo l'aggiornamento, il file compilato viene conservato in
`backend/data/archivio-gp/`. Il comando non usa API esterne: i contenuti
editoriali e i risultati inseriti restano quelli verificati manualmente.

I nuovi testi editoriali devono essere forniti e revisionati anche nelle
lingue pubblicate. La procedura amministrativa, gratuita entro la quota F0 e
incrementale è descritta in
[`LOCALIZZAZIONE.md`](LOCALIZZAZIONE.md); non pubblicare un nuovo testo italiano
lasciando attive traduzioni riferite alla versione precedente.

Questa procedura non aggiorna i grafici quantitativi 2026, che provengono dallo
snapshot locale derivato da F1DB. Per aggiungere nuovi GP ai grafici bisogna
rigenerare lo snapshot da una release F1DB, eseguire `npm run verify-data` e
pubblicare il codice aggiornato. Versione, licenza e trasformazioni dello
snapshot sono documentate in `NOTICE.md`.

Le API non espongono una data generica di ultimo aggiornamento. Per capire se
un blocco è cambiato bisogna confrontare il relativo payload o il suo `ETag`,
non una data condivisa tra dati quantitativi e contenuti editoriali.

## Effetto sulla classifica previsionale

La classifica della landing page viene generata dal backend per il GP marcato
come `attuale`. Dopo `npm run gp` passa quindi automaticamente alla gara
successiva e utilizza le nuove classifiche piloti e scuderie. La risposta è
isolata in `GET /api/v1/previsioni/piloti`.

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
