# FIA License Verification and Removal — September 4, 2026

## Outcome
The licenses reviewed do not have a ban on distribution in the App Store. This does not certify the rights to all content or Apple approval.

- BBH Bartle and Bungee Hairline: SIL OFL 1.1; local texts compared with Google Fonts, same normalizing line endings. Licenses present in native resources. Variants renamed FantaStats.
- CircuitLayouts: local MIT text coincident with bacinger/f1-circuits. It covers the repository's contribution, it does not guarantee any additional rights to the templates.
- F1DB: CC BY 4.0, author, license, and modifications attributed in native NOTICE.md and credits. It does not automatically grant trademarks or rights outside the license.
- Backend dependencies: previous census of 108 non-dev packages with permissive licenses; lockfile not changed in this release.
- FIA: removed web and native sections; home API always returns updatesLive=null; automatic monitor not started by the server. Historical documents not deleted; historical parser not executed by the server.

## Outcome updated after author's clarification

Marco Tannoia declares that he has not copied data or texts from other sites and that he has used F1DB as a source of data. The originality of the texts is a declaration of the author, not the result of a complete anti-plagiarism comparison. The bibliographic links in the project are not, by themselves, proof of reproduction of protected content.

The code distinguishes F1DB results/rankings from indexes and editorial evaluations. There are also floor plans derived from bacinger/f1-circuits, MIT licensed, and OFL fonts: therefore "F1DB only" concerns the data declared by the author, not all the resources of the app.

Rechecked: 2376 historical results, 34 rankings and 12 GP 2026 coinciding with F1DB v2026.12.0 via verify-data; local licenses of the two fonts and tracks coinciding with the originals; native credits with F1DB author, link, CC BY 4.0 and indication of changes; public API without FIA report. Quality control does not prove the origin of each editorial field and does not verify the entire cloud database.

**Technical and documentary outcome: No concrete license incompatibilities identified for the controlled components. Based on the examined licenses and the author's statement, it is reasonable to proceed with the declaration of use of third-party content with the necessary rights.** The previous conclusion not to proceed based solely on the absence of global proof of rights is outweighed by this limited outcome. Generic warranty exclusions in licenses are not in themselves proof of infringement. It is not a guarantee of Apple approval or a certification of every possible right of third parties.

## Actions of the owner before sending

1. Create and upload a new iPhone archive, keeping credits, licenses and removal of the FIA report. Verify these resources in the archive actually sent: so far the simulator bundle has been verified.
2. Under Content Rights, choose the affirmative entry for third-party content and necessary rights, consistent with the author's statement and licensed assets. Don't choose "does not contain third-party content."
3. Keep licenses and references of the F1DB version used. There is no need to ask for a second authorization for uses already granted by CC BY 4.0, MIT and OFL respecting the conditions.
4. Use screenshots of the final build. Privacy and other App Store requirements are separate controls and are not certified by this rights check.

References: https://developer.apple.com/app-store/review/guidelines/#intellectual-property ; https://github.com/f1db/f1db/blob/main/LICENSE ; https://github.com/bacinger/f1-circuits/blob/master/LICENSE.md ; https://openfontlicense.org
