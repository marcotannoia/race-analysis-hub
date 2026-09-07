# FantaStats GP Support

Public URL to enter in the iOS version support URL field in App Store Connect:

https://www.race-analysis-hub.it/assistenza.html

Public contact: **marco.tannoia@gmail.com**.

## Content and sources

The page contains the developer's contact information, useful information for reporting problems and frequently asked questions. It is a static page in Italian, accessible without an account, JavaScript or API. It does not replace the privacy policy.

- `frontend/public/assistenza.html`: responsive content and style, consistent with the public site.
- `frontend/public/support-assets/barlow-condensed-600.woff2`: Font hosted on the site.
- `frontend/public/support-assets/Barlow-LICENSE.txt`: Font license.

Vite copies these files to the build directory. Keep them in subsequent full frontend publications as well.

## Publishing the page only

Verify your AWS account, CloudFront alias, and S3 origin first. To publish support only without deploying any other on-premises changes:

```sh
aws s3 cp frontend/public/support-assets/barlow-condensed-600.woff2 s3://f1stats3/support-assets/barlow-condensed-600.woff2 --content-type font/woff2 --cache-control 'public,max-age=86400'
aws s3 cp frontend/public/support-assets/Barlow-LICENSE.txt s3://f1stats3/support-assets/Barlow-LICENSE.txt --content-type 'text/plain; charset=utf-8'
aws s3 cp frontend/public/assistenza.html s3://f1stats3/assistenza.html --content-type 'text/html; charset=utf-8' --cache-control no-cache
aws cloudfront create-invalidation --distribution-id E39KL59ASJLD4 --paths /assistenza.html '/support-assets/*'
```

Wait for the invalidation to complete and compare the public file to the local one. Check desktop/mobile view, email address, and FAQ opening. You don't need to deploy the backend to edit this page.

## Verification of 4 September 2026

Published the three files to S3. CloudFront invalidation `IYWJJYRE826XE07KDV4A2KR5S` complete. Public HTML identical to local via SHA-256; HTTP 200 public font. Visual verification of the page at desktop width and 390 px. No changes made to the URL field in App Store Connect: it must be saved in the app card.

The page is also accessible via the headphones icon in the footer of the site.

## App Privacy Policy

Public page: https://www.race-analysis-hub.it/privacy-app.html. Linked from the support page and native Settings in the next build. No scripts or trackers on the page.
The operational management must respect the deletion of emails within 12 months of the closure of the request. Check in your Render account for log storage and supplier agreements/warranties: they are not certified by the publication of the page.
