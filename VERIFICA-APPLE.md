# Verifica licenze e rimozione FIA — 4 settembre 2026

## Esito
Le licenze esaminate non presentano un divieto di distribuzione nell’App Store. Questo non certifica i diritti su tutti i contenuti o l’approvazione Apple.

- BBH Bartle e Bungee Hairline: SIL OFL 1.1; testi locali confrontati con Google Fonts, uguali normalizzando le terminazioni di riga. Licenze presenti nelle risorse native. Varianti rinominate FantaStats.
- CircuitLayouts: testo MIT locale coincidente con bacinger/f1-circuits. Copre il contributo del repository, non garantisce eventuali diritti ulteriori sulle sagome.
- F1DB: CC BY 4.0, autore, licenza e modifiche attribuiti in NOTICE.md e nei crediti nativi. Non concede automaticamente marchi o diritti esterni alla licenza.
- Dipendenze backend: precedente censimento di 108 pacchetti non-dev con licenze permissive; lockfile non modificato in questo rilascio.
- FIA: rimosse le sezioni web e native; API home restituisce sempre aggiornamentiLive=null; monitor automatico non avviato dal server. Documenti storici non cancellati; parser storico non eseguito dal server.

## Esito aggiornato dopo il chiarimento dell’autore

Marco Tannoia dichiara di non avere copiato dati o testi da altri siti e di avere utilizzato F1DB come fonte dei dati. L’originalità dei testi è una dichiarazione dell’autore, non il risultato di un confronto antiplagio completo. I collegamenti bibliografici presenti nel progetto non sono, da soli, prova di riproduzione di contenuti protetti.

Il codice distingue risultati/classifiche F1DB da indici e valutazioni editoriali. Sono inoltre presenti planimetrie derivate da bacinger/f1-circuits, licenziate MIT, e font OFL: pertanto “solo F1DB” riguarda i dati dichiarati dall’autore, non tutte le risorse dell’app.

Ricontrollati: 2376 risultati storici, 34 classifiche e 12 GP 2026 coincidenti con F1DB v2026.12.0 tramite verify-data; licenze locali dei due font e dei tracciati coincidenti con gli originali; crediti nativi con autore F1DB, collegamento, CC BY 4.0 e indicazione delle modifiche; API pubblica senza rapporto FIA. Il controllo di qualità non prova la provenienza di ogni campo editoriale e non verifica l’intero database cloud.

**Esito tecnico-documentale: nessuna incompatibilità concreta di licenza individuata per i componenti controllati. Sulla base delle licenze esaminate e della dichiarazione dell’autore, è ragionevole procedere con la dichiarazione di utilizzo di contenuti terzi con i diritti necessari.** La precedente conclusione di non procedere basata sulla sola assenza di prova globale dei diritti è superata da questo esito circoscritto. Le esclusioni generiche di garanzia nelle licenze non sono di per sé prova di una violazione. Non è una garanzia di approvazione Apple né una certificazione di ogni possibile diritto di terzi.

## Azioni del titolare prima dell’invio

1. Creare e caricare un nuovo archivio iPhone, mantenendo crediti, licenze e rimozione del rapporto FIA. Verificare queste risorse nell’archivio effettivamente inviato: finora è stato verificato il bundle per simulatore.
2. In Diritti sui contenuti scegliere la voce affermativa relativa ai contenuti terzi e ai diritti necessari, coerentemente con la dichiarazione dell’autore e con le risorse licenziate. Non scegliere “non contiene contenuti di terzi”.
3. Conservare licenze e riferimenti della versione F1DB utilizzata. Non serve chiedere una seconda autorizzazione per gli usi già concessi dalla CC BY 4.0, MIT e OFL rispettandone le condizioni.
4. Usare screenshot della build finale. Privacy e altri requisiti App Store sono controlli separati e non risultano certificati da questa verifica dei diritti.

Riferimenti: https://developer.apple.com/app-store/review/guidelines/#intellectual-property ; https://github.com/f1db/f1db/blob/main/LICENSE ; https://github.com/bacinger/f1-circuits/blob/master/LICENSE.md ; https://openfontlicense.org
