# من سلیقت رو بلدم! — Cloudflare Pages

## Files
- `index.html`: website frontend (updated to call `/api/recommend`)
- `functions/api/recommend.js`: server-side endpoint using Cloudflare Workers AI

## Deploy from an Android phone
1. Sign in to GitHub and create a **public or private** repository.
2. Upload `index.html` to the repository root.
3. Create folders `functions/api` and upload `recommend.js` inside `functions/api/`.
4. Sign in to Cloudflare, open Workers & Pages, create a Pages project, and connect the GitHub repository.
5. Build settings for this plain HTML site:
   - Framework preset: None
   - Build command: `exit 0`
   - Build output directory: `/` (if the dashboard rejects `/`, use `.`)
6. After the first deploy, open the Pages project → Settings → Bindings → Add → Workers AI.
   - Variable name: `AI`
   - Save, then trigger a new deployment.
7. Test the site and try two book titles.

## Notes
- The website calls `/api/recommend`; the AI model runs server-side, so no API key is exposed in the HTML.
- The free Workers AI allocation is limited and may be exhausted. Requests can stop working when the daily quota is reached.
- The original website stores the "already read" list in the visitor's browser localStorage.
