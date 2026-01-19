# Undercover Game

Un jeu **Undercover** complet et responsive pour mobile, optimisé pour GitHub Pages.

## 🎮 Fonctionnalités

✅ **Mode multijoueur** - 2+ joueurs  
✅ **8 packs de mots pré-intégrés** - Animaux, Nourriture, Films, Cuisine, Sports, Lieux, Musique, Technologie  
✅ **Mots personnalisés** - Import CSV pour tes propres paires  
✅ **Gameplay complet** - Distribution des mots, votes, révélation  
✅ **UI mobile-first** - Parfaitement responsive, pas de scroll parasites  
✅ **Sauvegarde automatique** - Reprends ta partie après un refresh  
✅ **Responsive design** - Fonctionne sur tous les appareils  

## 📱 Comment utiliser

### Déployer sur GitHub Pages

1. **Crée un repo GitHub** `username/undercover`
2. **Pousse les fichiers** dans le repo
3. **Active GitHub Pages** dans les settings (Branch: main, Folder: root)
4. **Accède à** `https://username.github.io/undercover`

### Jouer au jeu

1. **Ajoute les joueurs** avec le bouton "+"
2. **Sélectionne des packs** de mots (ou importe un CSV)
3. **Lance la partie** avec "Commencer"
4. **Passe le téléphone** - Chacun voit son mot
5. **Discutez** du mot en tours de table
6. **Votez** pour l'undercover
7. **Découvrez** le résultat
8. **Continuez** avec la manche suivante

### Format CSV personnalisé

Crée un fichier `words.csv` :

```
Mot Normal,Mot Undercover
Cuisine,Gastronomie
Cinéma,Film
Mer,Plage
Chat,Félin
```

Puis importe-le depuis le menu.

## 🛠️ Structure des fichiers

```
undercover/
├── index.html        # HTML principal
├── styles.css        # CSS responsive mobile-first
├── app.js           # Logique principale
├── game-data.js     # Packs de mots pré-définis
└── README.md        # Ce fichier
```

## 🎨 Design

- **Sombre** - Thème sombre pour réduire la fatigue oculaire
- **Minimal** - UI épurée et focalisée
- **Tactile** - Boutons grands et faciles à taper
- **Animé** - Transitions fluides

## 💾 Sauvegarde

Le jeu sauvegarde automatiquement :
- Les joueurs
- La manche en cours
- Les mots révélés
- Les votes

En cas de fermeture accidentelle, le jeu reprendra au même point.

## 🌐 Compatibilité

- ✅ iOS Safari
- ✅ Android Chrome
- ✅ Desktop browsers
- ✅ Tous les appareils modernes

## 📝 Personnalisation

Pour ajouter tes propres packs de mots, édite `game-data.js` :

```javascript
const GAME_PACKS = {
    monpack: {
        name: '🎯 Mon Pack',
        pairs: [
            { word: 'Mot1', undercover: 'Mot1b' },
            { word: 'Mot2', undercover: 'Mot2b' },
        ]
    }
};
```

## 🐛 Problèmes courants

**La page scrolle vers le bas ?**
→ Assure-toi que la hauteur des éléments est correcte. Les grilles se redimensionnent automatiquement.

**Les mots ne sauvegardent pas ?**
→ Vérifie que le localStorage est activé dans le navigateur.

**CSV ne se charge pas ?**
→ Vérifie le format : `mot,undercover` (séparés par des virgules, une paire par ligne)

## 📜 Licence

Gratuit et open-source!

Bon jeu! 🎉
