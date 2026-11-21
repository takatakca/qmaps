# Applications QMAPS

Android utilise Kotlin et les vues natives Android. iOS utilise SwiftUI. Les deux applications consultent l’API QMAPS indépendante sur `https://qmaps.ca/api/v1`. Elles permettent de chercher une fiche, gérer ses favoris, créer un compte et récupérer son accès avec son code personnel, joindre une liste d’attente et publier une actualité en tant que commerçant. Les sessions sont protégées par Android Keystore et par le trousseau iOS.

Android se construit depuis `mobile/android` avec `./gradlew assembleDebug bundleRelease`. L’APK de test est signé pour débogage. Pour le bundle de distribution signé, configurer la clé d’envoi appartenant au titulaire de l’application dans les secrets GitHub utilisés par le workflow. Conserver cette clé et son certificat pour les mises à jour.

Ouvrir `mobile/ios/QMAPS.xcodeproj` pour utiliser Xcode. La CI produit une application installable sur simulateur et une compilation iPhone. Une distribution sur appareil réel ou pour une boutique demande le profil et l’équipe Apple du propriétaire. Le workflow conserve les fichiers binaires dans ses artefacts et vérifie l’installation et le démarrage sur émulateur et simulateur.
