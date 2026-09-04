# Assistenza FantaStats GP

URL pubblico da inserire nel campo **URL di assistenza** della versione iOS in App Store Connect:

https://www.race-analysis-hub.it/assistenza.html

Contatto pubblico: **marco.tannoia@gmail.com**.

## Contenuto e sorgenti

La pagina contiene il contatto dello sviluppatore, le informazioni utili per segnalare problemi e le domande frequenti. È una pagina statica in italiano, accessibile senza account, JavaScript o API. Non sostituisce l'informativa privacy.

- `frontend/public/assistenza.html`: contenuto e stile responsive, coerenti con il sito pubblico.
- `frontend/public/support-assets/barlow-condensed-600.woff2`: font ospitato sul sito.
- `frontend/public/support-assets/Barlow-LICENSE.txt`: licenza del font.

Vite copia questi file nella directory di build. Mantenerli anche nelle successive pubblicazioni complete del frontend.

## Pubblicazione della sola pagina

Verificare prima account AWS, alias CloudFront e origine S3. Per pubblicare esclusivamente l'assistenza senza distribuire altre modifiche locali:

```sh
aws s3 cp frontend/public/support-assets/barlow-condensed-600.woff2 s3://f1stats3/support-assets/barlow-condensed-600.woff2 --content-type font/woff2 --cache-control 'public,max-age=86400'
aws s3 cp frontend/public/support-assets/Barlow-LICENSE.txt s3://f1stats3/support-assets/Barlow-LICENSE.txt --content-type 'text/plain; charset=utf-8'
aws s3 cp frontend/public/assistenza.html s3://f1stats3/assistenza.html --content-type 'text/html; charset=utf-8' --cache-control no-cache
aws cloudfront create-invalidation --distribution-id E39KL59ASJLD4 --paths /assistenza.html '/support-assets/*'
```

Attendere il completamento dell'invalidazione e confrontare il file pubblico con quello locale. Controllare visualizzazione desktop/mobile, indirizzo email e apertura delle domande frequenti. Non è necessario distribuire il backend per modificare questa pagina.

## Verifica del 4 settembre 2026

Pubblicati i tre file su S3. Invalidazione CloudFront `IYWJJYRE826XE07KDV4A2KR5S` completata. HTML pubblico identico al locale tramite SHA-256; font pubblico HTTP 200. Verifica visiva della pagina a larghezza desktop e 390 px. Nessuna modifica eseguita al campo URL in App Store Connect: deve essere salvato nella scheda dell'app.
