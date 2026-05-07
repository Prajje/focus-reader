# focus reader

Paste any blog URL, switch between **original**, **bionic**, and **spaced** reading modes. No accounts, no storage — refresh and it's gone.

- **Original**: fetched page as-is.
- **Bionic**: bolds the leading characters of each word.
- **Spaced**: generous line height, narrow line length, sans-serif — easier on attention.

## Run locally

Open `index.html` in a browser. (Some browsers need a local server for ES modules — `python3 -m http.server` works.)

## How it works

Fetches the URL via the AllOrigins CORS proxy, drops the HTML into a sandboxed iframe with a `<base>` tag for relative links, then walks the iframe DOM to apply transforms. Toggling modes re-renders without refetching.

## Caveats

- Sites that need JS to render (SPAs) will appear blank — only static HTML is fetched.
- Some sites block proxies or have aggressive bot protection.
- Mixed-content (http resources on https page) may not load.

## Stack

Vanilla HTML / CSS / JS, three modules, no build step. Hosted on GitHub Pages.
