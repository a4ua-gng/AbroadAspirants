# Abroad Aspirants

A student-led study-abroad community from India. This build includes a draggable flight globe, an opportunity board, application templates and a browser-local application guide.

## Preview

Open `index.html` in a modern browser, or serve the repository root with `python3 -m http.server 8000` and open `http://localhost:8000`.

## Editing

- `index.html` contains the page structure, community links and team.
- `styles.css` contains the visual theme. The brand gradient runs from `#7B2FF7` through `#2563EB` to `#38BDF8`.
- `content.js` contains program listings, document templates and curated answers.
- `globe.js` contains the canvas renderer and route definitions. Its land mask in `globe-data.js` is derived from public-domain [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/) geometry distributed via [world.geo.json](https://github.com/johan/world.geo.json).
- `assets/himalayas.webp` is a generated aerial background inspired by the Himalayas.

Saved programs and motion preferences use local browser storage. Application guide messages live in the current tab. Live peer chat opens in the community’s WhatsApp group.

## Hosting

The repository root is a buildless static site. To publish on GitHub Pages, select **Settings → Pages → Deploy from a branch → main → / (root)**. The intended public domain is `abroadaspirant.in`. Follow [GitHub’s custom-domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) to add and verify the domain and configure DNS.
