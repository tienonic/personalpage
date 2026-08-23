# Personal website

This repository contains the static source for Nicholas Melnichenko's personal website.

## Repository structure

- `index.html`: primary page content and structure.
- JavaScript files: page behavior and interactive elements.
- `sitemap.xml`: URLs exposed to search engines.
- Text and metadata files: hosting and crawler configuration.

## Preview locally

Run a static HTTP server from the repository root:

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.

## Update the site

1. Edit the relevant HTML or JavaScript file.
2. Preview the page at desktop and mobile widths.
3. Check internal links, external links, images, and interactive elements.
4. Confirm that `sitemap.xml` still matches the published URLs.
5. Commit and push the verified files to the deployment branch.

## Deployment

The site is designed for static hosting. The hosting provider publishes the repository files without a build step.
