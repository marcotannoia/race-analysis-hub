# Verifica licenze e rimozione FIA — 4 settembre 2026

## Esito
Le licenze esaminate non presentano un divieto di distribuzione nell’App Store. Questo non certifica i diritti su tutti i contenuti o l’approvazione Apple.

- BBH Bartle e Bungee Hairline: SIL OFL 1.1; testi locali confrontati con Google Fonts, uguali normalizzando le terminazioni di riga. Licenze presenti nelle risorse native. Varianti rinominate FantaStats.
- CircuitLayouts: testo MIT locale coincidente con bacinger/f1-circuits. Copre il contributo del repository, non garantisce eventuali diritti ulteriori sulle sagome.
- F1DB: CC BY 4.0, autore, licenza e modifiche attribuiti in NOTICE.md e nei crediti nativi. Non concede automaticamente marchi o diritti esterni alla licenza.
- Dipendenze backend: precedente censimento di 108 pacchetti non-dev con licenze permissive; lockfile non modificato in questo rilascio.
- FIA: rimosse le sezioni web e native; API home restituisce sempre aggiornamentiLive=null; monitor automatico non avviato dal server. Documenti storici non cancellati; parser storico non eseguito dal server.

## Punti ancora aperti per Apple
La provenienza/originalità di tutti i testi editoriali e i diritti ulteriori sulle risorse e raccolte non sono interamente dimostrati. Non dichiarare che l’app non contiene contenuti terzi. Non è ancora possibile attestare integralmente “dispongo dei diritti necessari” sulla sola base di questo controllo. Il binario selezionato in App Store Connect non è stato verificato; la nuova versione nativa richiede un nuovo archivio e caricamento.

Riferimenti: https://developer.apple.com/app-store/review/guidelines/#intellectual-property ; https://github.com/f1db/f1db/blob/main/LICENSE ; https://github.com/bacinger/f1-circuits/blob/master/LICENSE.md ; https://openfontlicense.org
