# CVLeo GitHub Pages Final v5

Static academic portfolio for GitHub Pages.

Final polish includes:
- Combined publications chart: stacked bars by publication type plus total line.
- Chart interactions: click a year or type segment to filter the publications list.
- Compact publication cards with citation metrics aligned to the right.
- Testimonials carousel with automatic 15-second rotation and hover pause.
- Experience grouped by institution with logo placeholders and timeline roles.

Deploy by uploading the contents of this folder to a GitHub Pages repository.


## Content / design / logic separation

The site is static and GitHub Pages-compatible. The project is now organized so common edits do not require touching the HTML layout or JavaScript logic.

- `index.html`: page structure and sections.
- `assets/css/styles.css`: visual design, colors, spacing and responsive styles.
- `assets/js/app.js`: rendering, filters, pagination, carousel and interactions.
- `assets/data/site-data.js`: editable content data.

### Where to edit content

Open `assets/data/site-data.js` and edit these arrays/objects:

- `publications`: publication cards, links, citations, tags and featured status.
- `experience`: professional, research and academic experience.
- `events`: research stays, congresses and international academic events.
- `awards`: awards and honors.
- `testimonials`: carousel testimonials.

For testimonials, use:

```js
{
  name: 'Person Name',
  role: 'Role / Institution',
  text: 'Testimonial text.',
  photo: 'assets/img/testimonials/person.jpg'
}
```

Leave `photo` as an empty string to keep the placeholder icon.


## Data organization

The site content is now split by section under `assets/data/`:

- `publications.js` — publications, citations, tags, and links.
- `experience.js` — professional, research, and academic experience.
- `events.js` — research stays, congresses, and academic events.
- `awards.js` — awards and honors.
- `testimonials.js` — testimonials.

`index.html` loads all data files before `assets/js/app.js`. To update content, edit the corresponding data file and commit the change to `develop`.
