# Guide de Build APK - CryptoAdviser

## Prérequis

1. **Node.js** doit être installé
2. **Android Studio** doit être installé
3. **Java JDK** (inclus avec Android Studio)

## Étapes de Build

### Option 1 : Utiliser le script automatique

1. Ouvrez PowerShell ou CMD
2. Naviguez vers le dossier :
   ```
   cd C:\Users\moham\Desktop\crypto\CryptoAdviserApp
   ```
3. Exécutez le script :
   ```
   .\build_apk_simple.bat
   ```

### Option 2 : Build manuel avec Gradle

1. Ouvrez PowerShell ou CMD
2. Naviguez vers le dossier Android :
   ```
   cd C:\Users\moham\Desktop\crypto\CryptoAdviserApp\android
   ```
3. Exécutez la commande Gradle :
   ```
   .\gradlew.bat assembleRelease
   ```

### Option 3 : Build depuis Android Studio

1. Ouvrez Android Studio
2. Ouvrez le projet : `C:\Users\moham\Desktop\crypto\CryptoAdviserApp`
3. Dans le menu : Build > Build Bundle(s) / APK(s) > Build APK(s)
4. Attendez la fin de la compilation
5. Cliquez sur "locate" dans la notification pour trouver l'APK

## Emplacement de l'APK

Une fois le build terminé, l'APK sera disponible à :
```
C:\Users\moham\Desktop\crypto\CryptoAdviserApp\android\app\build\outputs\apk\release\app-release.apk
```

## Installation sur Android

1. Transférez `app-release.apk` sur votre téléphone Android
2. Activez "Sources inconnues" dans les paramètres de sécurité
3. Ouvrez le fichier APK et installez

## Configuration de l'API

Avant d'utiliser l'app, assurez-vous que le backend API est en cours d'exécution :
```
cd C:\Users\moham\Desktop\crypto\CryptoAdviser\api
python main.py
```

L'API doit être accessible sur `http://localhost:8000`

## Fonctionnalités V11 TEMPORAL

L'application utilise maintenant les modèles V11 TEMPORAL avec :
- 3 cryptos : Bitcoin, Ethereum, Solana
- Thresholds optimaux : BTC=0.37, ETH=0.35, SOL=0.35
- Multi-timeframe (1d + 4h + 1h)
- Take Profit: +1.5% / Stop Loss: -0.75%
- Trades virtuels avec exécution automatique TP/SL

## Dépannage

### Erreur JAVA_HOME
Si vous obtenez une erreur "JAVA_HOME is not set" :
1. Trouvez votre installation Java (généralement dans Android Studio)
2. Définissez la variable d'environnement :
   ```
   setx JAVA_HOME "C:\Program Files\Android\Android Studio\jbr"
   ```
3. Redémarrez PowerShell/CMD

### Erreur Node
Si vous obtenez une erreur Node.js :
```
npm install
```

### Build échoue
1. Nettoyez le projet :
   ```
   cd android
   .\gradlew.bat clean
   ```
2. Relancez le build

## Support

Pour toute question, vérifiez les logs du build ou contactez le développeur.
