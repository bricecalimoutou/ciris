// Service worker de CIRiS — permet l'installation comme appli et le
// fonctionnement hors connexion (les données restent dans le navigateur :
// ce fichier ne fait que mettre en cache les fichiers de l'appli elle-même).
const CACHE_NOM = 'ciris-cache-v2.08';
const FICHIERS_A_METTRE_EN_CACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (evenement) => {
  evenement.waitUntil(
    caches.open(CACHE_NOM).then((cache) => cache.addAll(FICHIERS_A_METTRE_EN_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evenement) => {
  evenement.waitUntil(
    caches.keys().then((noms) =>
      Promise.all(noms.filter((nom) => nom !== CACHE_NOM).map((nom) => caches.delete(nom)))
    )
  );
  self.clients.claim();
});

// Stratégie "réseau d'abord, cache en secours" pour l'appli elle-même :
// on veut toujours la dernière version quand une connexion est disponible,
// mais l'outil reste utilisable hors connexion grâce au cache.
self.addEventListener('fetch', (evenement) => {
  if (evenement.request.method !== 'GET') return;
  // seules les requêtes vers ce site sont interceptées (jamais les appels
  // externes tels que wol.jw.org, les services de traduction, etc.)
  if (new URL(evenement.request.url).origin !== self.location.origin) return;

  evenement.respondWith(
    fetch(evenement.request)
      .then((reponse) => {
        const copie = reponse.clone();
        caches.open(CACHE_NOM).then((cache) => cache.put(evenement.request, copie));
        return reponse;
      })
      .catch(() => caches.match(evenement.request).then((r) => r || caches.match('./index.html')))
  );
});
