Application Android installable pour les essais, bundle Android signé avec le certificat QMAPS, captures du catalogue, de la fiche et du compte, et icônes pour les boutiques. Vérifier les empreintes avec `sha256sum -c SHA256SUMS`.

L’application iOS a été compilée pour le simulateur et pour iPhone. L’archive iPhone est non signée. La diffusion sur TestFlight et l’App Store nécessite la signature de l’éditeur.

Cette compilation ajoute la fermeture de compte, le signalement des fiches et le blocage des éditeurs. Les publications dans les boutiques sont suivies au ticket #17.
