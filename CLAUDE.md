# CLAUDE.md — Finaneo

## Projet

- **Nom** : Finaneo
- **URL** : https://finaneo.fr
- **Client** : Jeffrey Aldebert (jeffrey.aldebert@gmail.com)
- **Activité** : Média SEO finances personnelles — guides, simulateurs et génération de leads sur le crédit immobilier, l'épargne, l'investissement et la défiscalisation.

## Stack

| Couche | Techno |
|--------|--------|
| Framework | Astro 5.18 (SSG, `output: 'static'`) |
| Styling | Tailwind 3.4 + `@tailwindcss/typography` |
| Content | Markdown via content collections (glob loader) |
| Hébergement | Netlify (build `dist/`, functions `netlify/functions/`) |
| DNS | Netlify DNS |
| Email | Brevo (ex-Sendinblue) — `BREVO_API_KEY` en env Netlify |
| Fonts | Google Fonts — Plus Jakarta Sans (principale), Inter (fallback) |
| Node | >=22.12.0 |

## Architecture

```
src/
├── components/        # 12 composants Astro
│   ├── SEOHead.astro          # Meta, OG, JSON-LD, canonical
│   ├── Header.astro           # Nav + menu mobile
│   ├── Footer.astro
│   ├── LeadGenForm.astro      # Formulaire lead (source: credit-immobilier|defiscalisation|rachat-credit)
│   ├── FAQ.astro              # Accordéon FAQ (utilisé sur hubs + articles)
│   ├── Breadcrumb.astro
│   ├── ArticleCard.astro      # Card article pour /guides/
│   ├── HubCard.astro
│   ├── CTAAffiliation.astro   # CTA partenaire (navy gradient)
│   ├── SimulateurCredit.astro # Calculateur mensualités
│   ├── SimulateurEpargne.astro
│   └── TableOfContents.astro
├── layouts/
│   └── BaseLayout.astro       # Layout maître (SEOHead + Header + Footer + scroll reveal)
├── pages/
│   ├── index.astro                    # Homepage
│   ├── credit-immobilier.astro        # Hub
│   ├── assurance-emprunteur.astro     # Hub
│   ├── epargne.astro                  # Hub
│   ├── investissement.astro           # Hub
│   ├── defiscalisation.astro          # Hub
│   ├── rachat-credit.astro            # Hub
│   ├── simulateurs/index.astro
│   ├── simulateurs/credit-immobilier.astro
│   ├── simulateurs/epargne.astro
│   ├── guides/index.astro            # Liste articles
│   ├── guides/[...slug].astro        # Template article dynamique
│   ├── contact.astro
│   ├── contact-merci.astro           # noindex
│   ├── a-propos.astro
│   ├── mentions-legales.astro
│   └── politique-confidentialite.astro
├── content/
│   └── guides/                # 15 articles Markdown
├── styles/
│   └── global.css             # Tailwind directives + custom classes (btn-*, container-site)
└── content.config.ts          # Schema Zod : title, description, category, date, updatedDate?, readingTime?, tags?
```

```
public/
├── images/og-default.webp     # OG image 1200x630
├── illustrations/             # 8 SVG (hero, hubs, simulateur, team)
├── favicon.svg, favicon.ico
├── logo-finaneo.svg
├── robots.txt, llms.txt, llms-full.txt
└── manifest.webmanifest
```

```
netlify/
└── functions/
    └── send-contact-email.ts  # Brevo SMTP — notif admin + confirmation visiteur
```

### Routing

- Hubs : pages statiques Astro (`/credit-immobilier.astro` → `/credit-immobilier/`)
- Articles : collection `guides` + route dynamique `[...slug].astro`
- Simulateurs : pages statiques avec JS client-side

### Couleurs & Design tokens

- `navy` : #0A2540 (fond principal)
- `gold` : #C9A84C (accents, CTA)
- `surface` : #F8FAFC
- Tables : `bg-navy text-white` thead, `text-gold font-semibold` pour meilleures valeurs
- Cards : `bg-surface shadow-card rounded-2xl`
- Animations : classe `.reveal` + IntersectionObserver

## SEO

- **Meta/OG/Twitter** : `SEOHead.astro` — chaque page passe `title`, `description`, `canonical`, `ogImage?`, `jsonLd?`
- **OG image par défaut** : `/images/og-default.webp` (1200×630)
- **Sitemap** : `@astrojs/sitemap` → génère `sitemap-index.xml`. Redirect `/sitemap.xml` → `/sitemap-index.xml` via `netlify.toml`
- **Priorités sitemap** : 1.0 home, 0.9 hubs, 0.8 guides index + simulateurs, 0.7 articles, 0.3 contact/à-propos
- **robots.txt** : Allow all, Disallow `/contact-merci/`, `/api/`, `/.netlify/`. GPTBot et Claude-Web autorisés.
- **llms.txt / llms-full.txt** : Index pour crawlers IA
- **Structured data** : JSON-LD Organization + WebSite (homepage), Article + BreadcrumbList (guides), FAQPage (hubs)
- **Canonical** : auto via `Astro.url.href`, override possible via prop

## Conventions

### Fichiers à ne pas toucher sans raison

- `netlify/functions/send-contact-email.ts` — email critique, testé en prod
- `netlify.toml` — headers sécurité (CSP, HSTS, X-Frame-Options)
- `public/robots.txt`, `public/llms.txt` — indexation

### Patterns de nommage

- Pages hubs : nom du thème en slug (`credit-immobilier.astro`)
- Articles : `slug-descriptif-annee.md` (ex: `taux-immobilier-2026.md`)
- Composants : PascalCase (`LeadGenForm.astro`)
- CSS : Tailwind utility-first, classes custom dans `global.css` layer components

### Process de déploiement

1. `npm run build` — vérifier 0 erreurs
2. `git add . && git commit && git push` — Netlify auto-deploy sur push `main`
3. Pas de branche de staging — tout va sur `main`

### LeadGenForm sources

Le prop `source` détermine le type de formulaire et le routing Brevo :
- `"credit-immobilier"` — leads crédit
- `"defiscalisation"` — leads défiscalisation
- `"rachat-credit"` — leads rachat

## État actuel

### Bugs connus

- Aucun bug connu en production

### Dette technique

- Pas de tests automatisés
- Pas de CI/CD au-delà du auto-deploy Netlify
- Images articles : pas d'images spécifiques par article (OG image commune)
- Pas de système de cache/CDN dédié (Netlify Edge par défaut)

## Historique

- Projet créé from scratch en Astro 5 (pas de migration)
- Mars 2026 : création initiale avec 6 hubs enrichis (1500+ mots chacun) + 15 articles SEO
- Mars 2026 : intégration Brevo email (double envoi : admin + confirmation visiteur)
- Mars 2026 : ajout sitemap avec priorités, robots.txt, llms.txt, manifest, structured data JSON-LD
- Mars 2026 : redesign premium (logo SVG, illustrations, animations scroll reveal)
