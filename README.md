# 🚀 Gemini Ultra Desktop

**Gemini Ultra Desktop** est une interface locale élégante et performante pour interagir avec les modèles d'intelligence artificielle de Google (Gemini et Gemma). Conçu pour allier la puissance du web et la commodité d'une application de bureau grâce à un raccourci clavier dédié.

---

## 🔥 Points forts

- **Interface Desktop native** : Lancé via une fenêtre d'application épurée (Microsoft Edge/Chrome mode app).
- **Raccourci Magique** : Utilisez la touche `²` pour ouvrir ou masquer instantanément l'application (configurable via `launcher.py`).
- **Gestion Multi-Chat** : Créez, renommez, épinglez ou supprimez vos discussions. Les données sont sauvegardées localement dans votre navigateur.
- **Support Multi-Modèles** : Basculez facilement entre Gemini 2.5 Flash, Flash Lite, Gemini 3 Preview et Gemma 3.
- **Drag & Drop** : Réorganisez vos conversations par simple glisser-déposer dans la barre latérale.
- **Design Sombre (Dark Mode)** : Une interface moderne optimisée pour le confort visuel.

---

## ⚠️ Configuration Requise : Clé API

Pour que l'application fonctionne, vous **devez impérativement** utiliser votre propre clé API Google Gemini. 

### Comment configurer la clé :
1. Obtenez une clé API gratuite sur le [Google AI Studio](https://aistudio.google.com/).
2. Ouvrez le fichier `script.js` à la racine du projet.
3. À la toute première ligne, remplacez `"APIKEY"` par votre véritable clé :
   ```javascript
   const API_KEY = "VOTRE_CLE_ICI";
