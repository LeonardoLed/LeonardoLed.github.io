# Leonardo Ledesma-Domínguez, personal site

Static academic site for GitHub Pages. No build step.

## Structure

- `index.html`: page structure, in the same order as the navigation.
- `assets/css/styles.css`: all styling. Colors and fonts are variables at the top of the file.
- `assets/js/app.js`: renders publications, experience, events, awards, projects, peer review, courses and testimonials from the data files.
- `assets/data/*.js`: the content. Edit these to update the site.
  - `research-projects.js` is empty for now. The "Research projects" section appears by itself once it has entries.
  - `competitions.js` holds the competitions and industry engagement list.
  - `peer-review.js` has three groups: `published`, `active` (in review) and `rejected`.
- `assets/fonts/`: Young Serif (headings) and Schibsted Grotesk (text), served from the site itself.

## Design notes

- Palette in Tec blue. `--accent` was sampled from the Tecnológico de Monterrey logo in `assets/img/companies/tec.jpeg`.
  Change `--ink`, `--accent` and `--paper` in `styles.css` to re-tint the whole site.
- The side menu can be collapsed with the button at its bottom (desktop). The choice is remembered in the browser.
- The publications chart is a gel: each lane is a year, each band is a publication, and its height shows the type.
- Sections are separated by rules and a date column instead of cards.

## Deploy

Upload the full contents of this folder to the GitHub Pages repository.
