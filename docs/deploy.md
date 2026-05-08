# Deploy

Substance Sampler deploys only through GitHub Pages.

Live site:
https://baditaflorin.github.io/substance-sampler/

Repository:
https://github.com/baditaflorin/substance-sampler

## Publishing

GitHub Pages is configured to serve from `main` branch `/docs`.

```sh
npm install
make build
git add docs
git commit -m "chore: publish pages build"
git push
```

The local pre-push hook runs tests, builds the Pages artifact, and runs the Playwright smoke test.

## Rollback

Revert the commit that changed `docs/`, then push `main`.

```sh
git revert <commit>
git push
```

## Custom Domain

No custom domain is configured for v1. To add one later:

1. Add `docs/CNAME` containing the domain.
2. Configure DNS with the provider using GitHub Pages records.
3. Enable HTTPS in the repository Pages settings.

GitHub Pages DNS documentation:
https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

## Pages Gotchas

- GitHub Pages does not support `_headers` or `_redirects`.
- SPA fallback is handled by copying `index.html` to `404.html`.
- The Vite base path is `/substance-sampler/`.
- Service worker scope is `/substance-sampler/`.
