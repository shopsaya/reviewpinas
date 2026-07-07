# ReviewPinas

Free CSC (Civil Service Exam) practice quizzes. React PWA — works offline, no sign-up.

## Stack
- **GitHub** — source of truth, question banks live in `src/data/banks/*.json`
- **Netlify** — auto-deploys on push (`netlify.toml` included, SPA redirect configured)
- **Firebase** — not required yet; add Analytics later when measuring real usage

## Run locally
```
npm install
npm run dev
```

## Deploy (one time)
1. Create a GitHub repo and push this folder.
2. Netlify → Add new site → Import from GitHub → pick the repo.
   Build command and publish dir are read from `netlify.toml` automatically.
3. Site is live at `<name>.netlify.app`. Custom domain can be attached later.

## Adding questions
Each subject is one JSON file in `src/data/banks/`:
```json
{
  "q": "Question text",
  "options": ["A", "B", "C", "D"],
  "answer": 2,            // index of the correct option (0-based)
  "explanation": "Why C is correct."
}
```
Add the object to the `questions` array, commit, push — Netlify redeploys.

To add a new subject: create the JSON file, then import it in `src/App.jsx`
and add it to the `BANKS` array.

## Service worker note
`public/sw.js` caches the app shell for offline use. When deploying changes,
bump the `VERSION` string in `sw.js` so returning visitors get the update.

## Legal
Original practice material only. Not affiliated with or endorsed by the
Civil Service Commission. Never add content sourced from actual exams (RA 9416)
or copied from other publishers.
