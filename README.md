# Tableau CH

Application web de suivi des séries NHL centrée sur les Canadiens de Montréal.

Production: https://tableau-ch-playoffs.netlify.app  
Repository: https://github.com/ciderfer/tableau-ch-playoffs

## Features

- Score live MTL vs adversaire de série
- Calendrier de la série
- Portrait des facteurs clés
- Comparatif d'équipes
- Leaders des séries
- Alignements projetés depuis NHL.com avec fallback algorithmique
- Carnet de match local par navigateur
- Déploiement automatique GitHub vers Netlify

## Stack

- HTML, CSS et JavaScript statiques
- Netlify Functions pour les données NHL côté serveur
- Netlify CI/CD depuis GitHub

## Key Files

- `index.html`: structure de l'application
- `styles.css`: styles et responsive
- `app.js`: rendu client, notes locales et rafraîchissement
- `netlify/functions/nhl.js`: agrégation NHL API + NHL.com
- `netlify.toml`: configuration Netlify
- `assets/playoff-ice.png`: image de fond

## Local Usage

L'application peut être ouverte directement dans un navigateur:

```text
index.html
```

Certaines données live passent par la fonction Netlify. En local, l'application conserve un fallback statique si la fonction n'est pas disponible.

## Verification

Avant de committer des changements JavaScript:

```bash
node --check app.js
node --check netlify/functions/nhl.js
```

## Deployment

Le site est relié à Netlify. `main` est la branche de production; tout push sur `main` déclenche un déploiement si les crédits Netlify sont disponibles.

Workflow recommandé:

1. Créer une branche courte pour chaque changement.
2. Ouvrir une PR et vérifier le deploy preview Netlify.
3. Lancer les vérifications locales nécessaires.
4. Merger dans `main` seulement quand le preview est validé.
5. Vérifier la production après le déploiement.

```bash
git status
git push
netlify watch
```

Avant une mise en public plus large:

- Vérifier le solde de crédits Netlify.
- Configurer un domaine personnalisé et HTTPS.
- Garder les données NHL côté fonction serveur.
- Garder la mention de non-affiliation visible.
