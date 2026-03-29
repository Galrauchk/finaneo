// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://finaneo.fr',
  output: 'static',
  integrations: [
    tailwind(),
    sitemap({
      filter: (page) =>
        ![
          'https://finaneo.fr/mentions-legales/',
          'https://finaneo.fr/politique-confidentialite/',
          'https://finaneo.fr/contact-merci/',
        ].includes(page),
      serialize: (item) => {
        const url = item.url;
        const path = url.replace('https://finaneo.fr', '');

        if (path === '/') {
          item.priority = 1.0;
          item.changefreq = 'weekly';
        } else if (
          ['/credit-immobilier/', '/assurance-emprunteur/', '/epargne/', '/investissement/', '/defiscalisation/', '/rachat-credit/', '/simulateurs/'].includes(path)
        ) {
          item.priority = 0.9;
          item.changefreq = 'weekly';
        } else if (
          ['/guides/', '/simulateurs/credit-immobilier/', '/simulateurs/epargne/'].includes(path)
        ) {
          item.priority = 0.8;
          item.changefreq = 'weekly';
        } else if (path.startsWith('/guides/') && path !== '/guides/') {
          item.priority = 0.7;
          item.changefreq = 'monthly';
        } else if (['/contact/', '/a-propos/'].includes(path)) {
          item.priority = 0.3;
          item.changefreq = 'yearly';
        }

        item.lastmod = '2026-03-29';
        return item;
      },
    }),
    mdx(),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
  },
});
