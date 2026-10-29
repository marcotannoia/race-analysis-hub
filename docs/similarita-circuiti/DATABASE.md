# Persistenza dei circuiti nel database

Importazione completata nel database PostgreSQL configurato dall'app e verificata con una nuova connessione dopo il commit. I dati riletti ricostruiscono esattamente il catalogo JSON originario, comprese fonti, metodi, qualità, contesto e avvisi.

| Tabella | Contenuto importato |
|---|---|
| `catalog.circuit_similarity_profile` | 23 profili, 22 colonne di misura per profilo: 506 valori |
| `ratings.circuit_similarity` | 253 coppie uniche e 5.566 dettagli per criterio |

Ogni profilo è identificato da stagione, versione del metodo e identificativo circuito F1DB. I confronti collegano due profili della stessa stagione/versione e salvano una sola orientazione della coppia. Chiavi uniche, vincoli sui valori e riferimenti impediscono duplicati, coppie invertite o circuiti inesistenti.

## Valori e provenienza

Le misure numeriche sono colonne `numeric` con quattro decimali; i conteggi sono interi; la pioggia è un booleano; `downforce_level` ammette solo **basso, medio, alto**.

`source_observations` conserva i 22 oggetti originali con valore, fonte, metodo e indicazione di stima. `profile_context` conserva il resto della scheda, comprese le edizioni meteo e le caratteristiche geometriche di riferimento. `dataset_metadata`, `criteria_definitions` e gli SHA-256 conservano contesto della raccolta, scale, pesi e identità della sorgente.

`ratings.circuit_similarity.details` contiene le 22 percentuali individuali, i valori confrontati, le fonti e la qualità di entrambi i circuiti. La percentuale finale è disponibile nella colonna `similarity_percent`.

Le tabelle appartengono agli schemi privati già utilizzati dal backend. RLS è attiva; i ruoli `anon` e `authenticated` non ricevono accesso. Le stime non vengono trasformate in dati ufficiali dalla persistenza.

## Migrazione e importazione

Migrazione: `supabase/migrations/20261029095008_circuit_similarity_profiles.sql`.

```sh
# Controlla il piano e i riferimenti senza scrivere.
node backend/scripts/importaSimilaritaCircuitiPostgres.js

# Applica migrazione e dati in un'unica transazione.
node backend/scripts/importaSimilaritaCircuitiPostgres.js --apply
```

Lo script usa la configurazione PostgreSQL esistente, TLS verificato, parametri SQL e un lock di importazione. Migrazione e 276 righe sono confermate solo dopo la verifica integrale dei dati salvati. Un errore causa rollback. Se esistono già dati per la stessa stagione/versione, prima dell'aggiornamento conserva un backup locale in `output/backup-circuiti/` con permessi riservati.

Una seconda importazione dello stesso catalogo non modifica righe e non crea duplicati. Il servizio `backend/services/persistenzaSimilaritaCircuiti.js` espone anche `leggiCatalogoPostgres` per ricostruire il catalogo dal database. Il salvataggio non cambia i pesi previsionali né distribuisce una nuova versione del backend.

## Query di consultazione

```sql
select circuit_id, turn_count, downforce_level, rain_prevalent,
       average_speed_kmh, elevation_change_m
from catalog.circuit_similarity_profile
where season = 2026
  and methodology_version = 'similarita-multicriterio-v2'
order by circuit_id;

select circuit_a_id, circuit_b_id, similarity_percent
from ratings.circuit_similarity
where season = 2026
  and methodology_version = 'similarita-multicriterio-v2'
order by similarity_percent desc;

select source_observations -> 'gLateralePerKm' as valore_e_provenienza
from catalog.circuit_similarity_profile
where season = 2026 and circuit_id = 'mexico-city';
```

Esito della lettura dopo il commit: [verifica-database.json](verifica-database.json).
