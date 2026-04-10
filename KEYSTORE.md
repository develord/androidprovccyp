# CryptoXHunter — Signing Key (Google Play)

## Upload Keystore

| Champ | Valeur |
|-------|--------|
| Fichier | `cryptoxhunter-upload.jks` |
| Format | JKS |
| Alias | `cryptoxhunter` |
| Mot de passe store | `CryptoXHunter2026!` |
| Mot de passe clé | `CryptoXHunter2026!` |
| Algorithme | RSA 2048 bits |
| Validité | 10 000 jours (~27 ans, expire ~2053) |
| DN | `CN=CryptoXHunter, OU=Mobile, O=CryptoXHunter, L=Paris, ST=IDF, C=FR` |
| SHA-256 | voir `keytool -list -keystore cryptoxhunter-upload.jks` |

## Emplacements

- Projet : `CryptoAdviserApp/cryptoxhunter-upload.jks`
- Build : `android/app/cryptoxhunter-upload.jks`
- Config : `android/app/build.gradle` → `signingConfigs.release`

## IMPORTANT

- **NE JAMAIS perdre ce fichier** — sans lui, impossible de mettre à jour l'app sur le Play Store
- **NE JAMAIS commit dans git** (protégé par `.gitignore`)
- Faire un backup sur un stockage sécurisé (USB, cloud chiffré)
- Google Play App Signing re-signe l'app avec sa propre clé ; ce keystore est la "upload key"

## Générer un AAB signé

```bash
cd android
./gradlew bundleRelease
```

L'AAB signé sera dans : `android/app/build/outputs/bundle/release/app-release.aab`
