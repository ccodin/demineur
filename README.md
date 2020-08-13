## Le jeu du démineur

### Lancer le jeu
Pour lancer le jeu il n'y a pas besoin de build, cependant il sera necessaire de lancer un server en local. Cela est du à l'utilisation des modules [modules sur MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules).

Une autre possibilité est d'ouvrir le projet depuis Visual Code et de lancer l'extension "GoToLive".

### Changer la difficulté

Pour changer la difficulté vous pouvez:
- changer la valeur de `cols` dans `Board.js`, ce qui augmentera ou diminuera le nombre de cellules
- changer le calcul de `totalBombs = Math.ceil(this.totalCells / 10);`dans `Board.js`, ce qui augmentera /ou diminuera le nombre total de bombes

### Limites
Le jeu peut en théorie monter jusqu'à 1 millions de cellules en mettant:
```javascript
cols            = 1000;
cellSize        = 2; // Dépendra de la résolution de votre écran
```

Mais attention, ce sera trèèèès gourmand en ressource

Enjoy :)
