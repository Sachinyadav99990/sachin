# DecisionMirror (local)

A small client-side decision intelligence demo. Open `index.html` in a browser to run.

Quick options:

- Open directly: double-click `index.html` or drag into a browser.
- Serve locally (recommended) using Python 3:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

Windows helper:

```powershell
./run-local.bat
```

Notes:
- All data is stored in `localStorage` under the key `decisionMirrorState`.
- This is a static app - no backend required.

Browser test setup:

1. Install dependencies:

```bash
npm install
```

2. Run Playwright tests:

```bash
npm test
```

If `npm` is not installed, install Node.js from https://nodejs.org/ before running these commands.
