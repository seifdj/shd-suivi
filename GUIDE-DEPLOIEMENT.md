# Déployer le Suivi des passages SHD et l'intégrer à Wix

Ce guide t'amène de zéro à une appli en ligne, connectée à une vraie base de
données, intégrée dans ton site Wix (shd-clean.com).

Compte trois étapes : **la base de données (Supabase)**, **la mise en ligne
(Vercel)**, **l'intégration (Wix)**. Prévois environ 30 à 45 minutes la première
fois. Tout est gratuit.

---

## Ce que tu as reçu

Un dossier `shd-suivi/` contenant le projet prêt à déployer :

- `src/App.jsx` — l'appli (même design que l'aperçu, connectée à Supabase)
- `src/main.jsx`, `index.html`, `vite.config.js`, `package.json` — la structure technique
- `supabase-schema.sql` — le script qui crée tes tables
- `.env.example` — modèle pour tes clés secrètes

---

## Étape 1 — La base de données (Supabase)

1. Va sur **supabase.com** et crée un compte gratuit.
2. Clique sur **New project**. Donne un nom (`shd-suivi`), choisis un mot de
   passe pour la base (note-le quelque part), région **Europe (Paris ou
   Frankfurt)**. Crée le projet et attends ~2 minutes.
3. Dans le menu de gauche, ouvre **SQL Editor → New query**.
4. Ouvre le fichier `supabase-schema.sql`, copie tout son contenu, colle-le
   dans l'éditeur, puis clique sur **Run**. Tes deux tables (`copros` et
   `passages`) sont créées.
5. Va dans **Project Settings → API**. Note deux valeurs :
   - **Project URL** (ressemble à `https://xxxx.supabase.co`)
   - **anon public key** (longue chaîne commençant par `eyJ...`)

Garde cette page ouverte, tu en auras besoin à l'étape 2.

---

## Étape 2 — La mise en ligne (Vercel)

Le plus simple est de passer par GitHub. Si tu n'as pas de compte GitHub,
crées-en un (gratuit) sur **github.com**.

### 2a. Mettre le projet sur GitHub

1. Sur GitHub, clique **New repository**, nomme-le `shd-suivi`, laisse en
   **Private**, crée-le.
2. Sur la page du dépôt, clique **uploading an existing file** (lien dans
   "Quick setup").
3. Glisse-dépose **tout le contenu du dossier `shd-suivi/`** (les fichiers et le
   dossier `src/`). N'envoie PAS de fichier `.env`. Valide avec **Commit
   changes**.

### 2b. Déployer sur Vercel

1. Va sur **vercel.com**, crée un compte en te connectant avec GitHub.
2. Clique **Add New → Project**, sélectionne ton dépôt `shd-suivi`, clique
   **Import**.
3. Vercel détecte automatiquement Vite. Avant de déployer, déplie
   **Environment Variables** et ajoute les deux clés de l'étape 1 :
   - Nom : `VITE_SUPABASE_URL` — Valeur : ton Project URL
   - Nom : `VITE_SUPABASE_ANON_KEY` — Valeur : ta anon public key
4. Clique **Deploy**. Au bout d'une minute, tu obtiens une URL du type
   `https://shd-suivi.vercel.app`. Ouvre-la : l'appli est en ligne.

Teste : ouvre l'espace agent (code `SHD2026`), ajoute une copropriété,
enregistre un passage. Reviens sur l'espace client, il doit apparaître. Si tu
recharges la page, tout reste là — c'est la base de données qui travaille.

---

## Étape 3 — L'intégration dans Wix

Deux façons, au choix.

### Option A — Bouton / lien (recommandé, surtout sur mobile)

Dans l'éditeur Wix, ajoute un bouton « Suivi des passages » qui ouvre ton URL
Vercel dans un nouvel onglet. Simple, propre, et l'appli occupe tout l'écran.

Pour une URL aux couleurs de ta marque, tu peux dans Vercel
(**Settings → Domains**) brancher un sous-domaine comme
`suivi.shd-clean.com` — il faudra ajouter un enregistrement DNS chez ton
hébergeur de domaine.

### Option B — Intégrer dans une page (iframe)

1. Dans l'éditeur Wix : **Ajouter (+) → Intégrer du code → Intégrer un site
   (HTML iframe)**.
2. Dans les réglages de l'élément, choisis **Adresse du site** et colle ton URL
   Vercel.
3. Agrandis la zone pour laisser respirer le contenu (au moins 600 px de haut).

L'iframe affiche l'appli à l'intérieur de ta page Wix. Note : sur petits
écrans, l'option A reste plus confortable.

---

## Important — sécurité de l'accès agent

Dans cette version simple, l'espace agent est protégé par le code `SHD2026`
côté appli, et la base accepte l'écriture publique. C'est suffisant pour
démarrer, mais quelqu'un de techniquement averti pourrait contourner le code.

Quand tu voudras durcir ça (avant d'ouvrir largement aux syndics), deux pistes :
- activer l'authentification Supabase et réserver l'écriture aux comptes
  connectés (modifier les politiques dans `supabase-schema.sql`) ;
- ou passer la logique d'écriture par une petite fonction serveur.

Dis-le-moi à ce moment-là, je te prépare la version sécurisée.

---

## Pour modifier l'appli plus tard

- Changer une couleur, un libellé, ajouter une zone : modifie `src/App.jsx`,
  renvoie le fichier sur GitHub — Vercel redéploie tout seul en une minute.
- Les zones d'entretien sont listées en haut du fichier (constante `ZONES`).
- Le code agent est la constante `CODE_AGENT_DEFAUT`.

---

## Tester en local d'abord (facultatif)

Si tu veux essayer sur ton ordinateur avant la mise en ligne :

1. Installe Node.js (nodejs.org, version LTS).
2. Dans le dossier `shd-suivi/`, copie `.env.example` en `.env` et mets tes
   vraies clés Supabase.
3. Ouvre un terminal dans le dossier et tape :
   ```
   npm install
   npm run dev
   ```
4. Ouvre l'adresse affichée (généralement `http://localhost:5173`).

---

## Une page (un lien) par résidence

Une fois en ligne, **chaque résidence a sa propre adresse**, du type :

```
https://shd-suivi.vercel.app/#/r/les-tilleuls
https://shd-suivi.vercel.app/#/r/residence-du-parc
```

Le lien est construit automatiquement à partir du nom de la résidence.

**Comment l'obtenir et l'envoyer à un syndic :**
1. Ouvre l'espace **Gérant** (code `ADMIN2026`).
2. Sur la ligne d'une résidence, clique sur le bouton **« Lien »** (ou ouvre la
   fiche de la résidence puis **« Copier le lien »**).
3. Colle ce lien dans un mail au syndic, ou derrière un bouton sur ton site Wix.

Quand le syndic ouvre son lien, il arrive **directement sur la page de sa
résidence** (dernier passage + historique), sans voir les autres résidences.

Astuce : si tu renommes une résidence, son lien change (il suit le nom). Évite
donc de renommer une résidence dont tu as déjà diffusé le lien.
