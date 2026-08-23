# CVLeo GitHub Pages — Dashboard Redesign

Static academic portfolio for GitHub Pages.

## Structure

- `index.html` — page structure and section layout.
- `assets/css/styles.css` — visual design and responsive dashboard styling.
- `assets/js/app.js` — rendering logic, filters, pagination, chart interaction, timelines and carousel.
- `assets/data/*.js` — editable data files for publications, experience, projects, events, awards and testimonials.

## Main redesign notes

- Dashboard-style academic homepage based on the approved preview.
- Publications keep search, filters, pagination and interactive chart.
- Publication cards include role, badges, tags, links and metrics.
- Metrics are controlled from JSON using `showMetrics:false` / `indexed:false`.
- The only non-indexed publication is:
  `Hacia una nueva praxis de ciencia abierta dominada por datos masivos e inteligencia artificial generativa`.
- Experience keeps the three categories: Professional, Academic and Research.
- Experience appears before Portfolio.
- Industrial & Intellectual Property Rights is kept as one record.
- Awards & Honors redesigned as visual cards.

## Deploy

Upload the full contents of this folder to the GitHub Pages branch/repository.
