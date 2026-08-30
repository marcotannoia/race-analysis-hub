# Avvertenze legali e operative

Race Analysis Hub è un progetto indipendente e non ufficiale.

This website is unofficial and is not associated in any way with the Formula 1
companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP,
GRAND PRIX and related marks are trade marks of Formula One Licensing B.V.

I riferimenti al campionato, alle gare, ai piloti e alle scuderie hanno finalità
descrittiva ed editoriale. Il progetto non usa loghi ufficiali e non dichiara
approvazione, sponsorizzazione o affiliazione con Formula One Licensing B.V.,
Formula One World Championship Limited, la FIA, le scuderie o i piloti.

Le classifiche 2026, i risultati di gara e qualifica 2023-2025 e i grafici
quantitativi 2026 derivano da F1DB `v2026.11.0`, distribuito da Marcel Overdijk
e dai contributori di F1DB con licenza Creative Commons Attribution 4.0
International (CC BY 4.0):

- progetto originale: https://github.com/f1db/f1db
- release utilizzata: https://github.com/f1db/f1db/releases/tag/v2026.11.0
- licenza: https://creativecommons.org/licenses/by/4.0/

Race Analysis Hub ha filtrato, rinominato e normalizzato un sottoinsieme dei
dati F1DB. Queste trasformazioni non implicano approvazione da parte degli
autori di F1DB. La CC BY 4.0 permette anche l'uso commerciale, ma chi condivide
o mostra i dati derivati deve mantenere un'attribuzione adeguata, il riferimento
alla licenza e l'indicazione delle modifiche.

## Anagrafiche piloti e scuderie

I numeri vettura, i codici sportivi e le nazionalità dei piloti sono mantenuti
da Race Analysis Hub e verificati anche con la documentazione FIA della
stagione 2026:

- https://www.fia.com/sites/default/files/guide_media_2026_2_0.pdf

I campi `nazionalitaIso2` e `nazionalitaIso3` sono una normalizzazione di Race
Analysis Hub secondo ISO 3166-1 alpha-2 e alpha-3:

- https://www.iso.org/iso-3166-country-codes.html

I colori esadecimali delle scuderie corrispondono ai colori identificativi
pubblicati nella pagina Formula 1 dedicata ai team, verificata l'11 agosto 2026:

- https://www.formula1.com/en/teams

Le abbreviazioni delle scuderie (`MER`, `FER`, `MCL` e analoghe) sono
identificatori editoriali stabili definiti da Race Analysis Hub. Non vengono
presentate come codici ufficiali di Formula 1, FIA o delle singole scuderie. I
nomi, i colori e gli altri riferimenti alle squadre hanno esclusivamente
funzione descrittiva e non implicano affiliazione o approvazione.

La classifica previsionale non proviene da F1DB. È un'elaborazione originale di
Race Analysis Hub che combina i risultati quantitativi attribuiti sopra con
valutazioni editoriali su pista, vettura, gomme, affidabilità e aggiornamenti
tecnici. L'indice è una stima soggetta a errore, non un risultato ufficiale né
una garanzia sulla prestazione futura.

L'ordine e il totale dei Gran Premi 2026 mostrati nella home sono verificati
sul calendario ufficiale Formula 1:

- https://www.formula1.com/en/racing/2026

Gli aggiornamenti tecnici non ancora ufficiali vengono identificati come tali,
collegati alla relativa fonte pubblica e mantenuti neutrali nel calcolo finché
non sono confermati.

## Indicatori bagnato ed errori

Le partenze in carriera, i risultati e gli stati di ritiro usati per gli
indicatori percentuali derivano da F1DB `v2026.11.0`. Le gare con pioggia fino
al 2025 sono state ricontrollate usando anche l'elenco storico pubblicato da
Tudo Sobre Fórmula 1:

- https://www.tudosobreformula1.com.br/corridas-com-pista-molhada-ou-%C3%BAmida

Le condizioni miste e il GP del Canada 2026 sono verificati sui resoconti gara
di Formula 1. Race Analysis Hub considera `mista` una gara con fasi
significative sia su pista bagnata sia su pista asciutta; una pioggia lieve che
non modifica sostanzialmente la pista non è sufficiente.

Le penalità non fatali del Canada 2026 sono state ricontrollate anche nel
resoconto ufficiale FIA:

- https://www.fia.com/news/f1-antonelli-wins-thrilling-canadian-grand-prix-ahead-hamilton-and-verstappen-russell-retires

La percentuale di bravura sul bagnato è il rapporto tra vittorie e gare
bagnate/miste effettivamente disputate. Non è una valutazione soggettiva né usa
il numero assoluto di vittorie. Le percentuali di errore adottano un criterio
conservativo: uscite individuali documentate e penalità di gara registrate. Gli
errori fatali sono un sottoinsieme e vengono divisi per tutte le partenze, non
per gli errori complessivi; sui profili pubblicati la relativa percentuale resta
inferiore a quella generale. I conteggi di supporto restano interni; l'API
espone soltanto le tre percentuali.

Per una scuderia le percentuali rappresentano l'aggregato ponderato delle
carriere dei piloti attualmente associati alla squadra, non l'intera storia
sportiva delle precedenti denominazioni del costruttore.

## Traduzioni

Le versioni inglese, francese, portoghese europeo, spagnola e tedesca dei contenuti
editoriali sono inizialmente generate con Azure Translator e poi salvate nel
database del progetto. Azure non è chiamato dalle API pubbliche o dal
frontend. Procedura, memoria di traduzione e controlli sono documentati in
`LOCALIZZAZIONE.md`.

La chiave e la cache amministrativa non sono incluse nel repository né nel
servizio in produzione. Le API leggono esclusivamente traduzioni già salvate
nel database; non inviano i testi a servizi esterni durante le richieste degli
utenti. Il codice pubblico `pt` identifica il catalogo `pt-PT`.

Le risposte pubbliche di Race Analysis Hub, compresi i testi editoriali
originali restituiti dalle API, sono riutilizzabili secondo la licenza descritta
in `LICENSE.md`. Il riutilizzatore può adattarle nel proprio software, anche per
uso commerciale, senza ottenere accesso in scrittura al database ufficiale.
Quando pubblica una versione modificata deve citare Race Analysis Hub, mantenere
l'attribuzione a F1DB per i dati quantitativi e segnalare le modifiche.

Attribuzione sintetica consigliata:

> Contenuto adattato da Race Analysis Hub — dati quantitativi derivati da F1DB
> v2026.11.0 — modifiche del riutilizzatore — CC BY 4.0.

L'inserimento straordinario del Gran Premio del Bahrein a Sepang nel calendario
2026 è documentato separatamente dalla comunicazione ufficiale di Formula 1 del
26 luglio 2026, perché non era ancora incluso nella release F1DB utilizzata:
https://www.formula1.com/en/latest/article/formula-1-and-fia-confirm-malaysia-will-join-2026-calendar-as-host-venue-for-bahrain-grand-prix.6lL7vjFEM2VVynRHvg1TCf

Le API sono pubbliche e fornite senza garanzia di disponibilità continua o di
assenza di errori. Eventuali requisiti aggiuntivi di servizio, supporto,
continuità o accesso devono essere concordati separatamente.

Referente: Marco Tannoia, `marco.tannoia@gmail.com`.
