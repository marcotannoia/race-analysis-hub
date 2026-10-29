# Piloti, stagioni e storico sui circuiti

Migrazione applicata al database il 29 ottobre 2026. Verifica: 23 piloti, 208 associazioni stagionali, 8.875 risultati su 39 circuiti.

| Entità | Responsabilità |
|---|---|
| `catalog.driver` | Scheda anagrafica; nessuna scuderia e nessun `current_team_id` |
| `catalog.season_driver` | Associazione pilota, stagione e scuderia; ammette più scuderie nello stesso anno |
| `catalog.entry` | Iscrizione al singolo GP, collegata all'associazione stagionale effettiva |
| `catalog.driver_circuit_result` | Risultati di gara, qualifica, sprint e qualifica sprint con FK al circuito e all'associazione stagionale |
| `catalog.driver_circuit_history` | Vista di consultazione con pilota, anno, scuderia effettiva, circuito, layout, posizione e stato |

La scuderia storica è identificata da `season_driver.constructor_id`, chiave esterna verso `f1db.constructor`. `team_id` collega anche la scheda editoriale della scuderia quando presente. Le vecchie scuderie non devono avere una scheda attuale per conservare i risultati.

Un trasferimento crea un'altra associazione, senza modificare la precedente. Il ritorno alla stessa scuderia riusa l'associazione: i singoli GP conservano la sequenza effettiva. Le associazioni non sono intervalli continui di permanenza. Verificato sul caso Lawson/Tsunoda 2025, con due scuderie per ciascun pilota.

## Collegamento ai circuiti e alla somiglianza

`driver_circuit_result.circuit_id` è una FK verso `f1db.circuit`, la stessa entità già referenziata da `catalog.circuit_similarity_profile.circuit_id`. Il circuito può quindi avere più profili, distinti per stagione e versione del metodo.

Lo storico copre 39 circuiti, mentre i profili di somiglianza raccolti coprono i 23 del calendario 2026. Gli altri circuiti storici hanno l'anagrafica e i risultati, senza profili di somiglianza inventati. `circuit_layout_id` permette di distinguere le configurazioni usate negli anni.

```sql
select h.driver_slug, h.season, h.constructor_name,
       h.circuit_name, h.session_type, h.position_number,
       h.retirement_reason, p.downforce_level, p.lateral_g_per_km
from catalog.driver_circuit_history h
left join catalog.circuit_similarity_profile p
  on p.circuit_id = h.circuit_id
 and p.season = 2026
 and p.methodology_version = 'similarita-multicriterio-v2'
where h.driver_slug = 'leclerc' and h.circuit_id = 'monza'
order by h.race_date desc, h.session_type;
```

Il servizio interno `backend/services/storicoPilotaCircuito.js` permette di filtrare pilota, circuito, sessioni, risultati regolari e data limite. Con `primaDel`, esclude gare e profili successivi alla data indicata; se non esiste un profilo precedente restituisce il risultato con profilo nullo. Non usa un profilo futuro per riempire il passato. Il riferimento temporale della vista è la data del GP, anche per le qualifiche.

## Aggiornamento e controlli

Lo storico è ricostruito dai risultati già presenti in F1DB per i piloti catalogati. Inserimenti, correzioni e cancellazioni dei risultati F1DB mantengono sincronizzata la tabella. Aggiungere una nuova scheda pilota con identificativo F1DB recupera automaticamente anche il suo storico.

FK e trigger impediscono di associare un risultato alla scuderia o al pilota sbagliato e di riscrivere l'identità di un'associazione stagionale già creata. Le iscrizioni dei GP mantengono pilota e scuderia originali. Le tabelle sono private e hanno RLS attiva; le funzioni usano i privilegi del chiamante, senza `SECURITY DEFINER`.

La migrazione è transazionale e ha conservato un backup delle anagrafiche e iscrizioni originali in `output/backup-piloti/`. I due script legacy di importazione/sincronizzazione sono stati adattati alla rimozione della scuderia dall'anagrafica.

```sh
node backend/scripts/migraPilotiStagionaliPostgres.js
```

Dopo l'applicazione, questo comando verifica la migrazione e confronta lo storico con la fonte senza riscrivere dati. Esito: [verifica-database.json](verifica-database.json). Non sono stati modificati i pesi della classifica previsionale.
