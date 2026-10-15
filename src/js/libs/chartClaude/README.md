# 📊 Module de Graphiques JavaScript

Module JavaScript moderne pour générer des graphiques interactifs et animés en SVG. Supporte les graphiques en barres (verticales et horizontales) et circulaires (complets et semi-circulaires).

## ✨ Fonctionnalités

- 📊 **4 types de graphiques** : barres verticales, barres horizontales, circulaires, semi-circulaires
- 🎨 **Personnalisation complète** : couleurs, tailles, polices, formats
- 📈 **Grilles et axes** : repères avec lignes de valeurs pour les graphiques en barres
- 🔢 **Affichage des valeurs** : dans les barres ou secteurs circulaires
- ✨ **Animations fluides** : transitions élégantes au chargement
- 💾 **Export** : téléchargement en SVG ou conversion en PNG
- 🎯 **Zero dépendance** : JavaScript pur, pas de bibliothèque externe
- 📱 **Responsive** : graphiques adaptatifs avec viewBox SVG

## 🚀 Installation

Copiez simplement le fichier `charts.mjs` dans votre projet.

```bash
# Télécharger le module
curl -O https://votre-url/charts.mjs
```

## 📖 Utilisation de base

### Import du module

```javascript
import {
    createVerticalBarChart,
    createHorizontalBarChart,
    createPieChart,
    createSemiCircularChart,
    downloadSVG
} from './charts.mjs';
```

### Graphique en barres verticales

```javascript
const values = [45, 67, 52, 89, 73];
const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai'];

const chart = createVerticalBarChart(values, labels, {
    title: 'Ventes Mensuelles',
    colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#3b82f6', '#60a5fa'],
    showValues: true,
    showGrid: true,
    width: 600,
    height: 400
});

// Ajouter au DOM
document.getElementById('container').appendChild(chart);
```

### Graphique en barres horizontales

```javascript
const values = [120, 98, 145, 87, 156];
const labels = ['Produit A', 'Produit B', 'Produit C', 'Produit D', 'Produit E'];

const chart = createHorizontalBarChart(values, labels, {
    title: 'Ventes par Produit',
    colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
    showValues: true,
    showGrid: true
});

document.getElementById('container').appendChild(chart);
```

### Graphique circulaire (camembert)

```javascript
const values = [35, 25, 20, 15, 5];
const labels = ['Électronique', 'Vêtements', 'Alimentation', 'Livres', 'Autres'];

const chart = createPieChart(values, labels, {
    title: 'Répartition des Ventes',
    colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
    showValues: true,
    showLegend: true,
    width: 600,
    height: 400
});

document.getElementById('container').appendChild(chart);
```

### Graphique semi-circulaire (jauge)

```javascript
const values = [30, 45, 25];
const labels = ['Débutant', 'Intermédiaire', 'Avancé'];

const chart = createSemiCircularChart(values, labels, {
    title: 'Niveau des Participants',
    colors: ['#06b6d4', '#0891b2', '#0e7490'],
    showValues: true,
    showLegend: true
});

document.getElementById('container').appendChild(chart);
```

## ⚙️ Options de configuration

Toutes les fonctions de création de graphiques acceptent un objet `options` optionnel :

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `colors` | `string[]` | Palette par défaut | Couleurs des barres/secteurs (hex, rgb, ou nom) |
| `showValues` | `boolean` | `true` | Afficher les valeurs dans les barres/secteurs |
| `showGrid` | `boolean` | `true` | Afficher la grille (barres uniquement) |
| `width` | `number` | `600` | Largeur du graphique en pixels |
| `height` | `number` | `400` | Hauteur du graphique en pixels |
| `title` | `string` | `''` | Titre du graphique |
| `fontFamily` | `string` | `'system-ui, ...'` | Police de caractères |
| `fontSize` | `number` | `14` | Taille de police en pixels |
| `backgroundColor` | `string` | `'#ffffff'` | Couleur de fond |
| `barSpacing` | `number` | `0.2` | Espacement entre barres (0-1) |
| `showLegend` | `boolean` | `false` | Afficher la légende |
| `animationDuration` | `number` | `800` | Durée de l'animation en ms |
| `valueFormat` | `string` | `'number'` | Format : `'number'`, `'percentage'`, `'currency'` |
| `decimalPlaces` | `number` | `0` | Nombre de décimales |

### Exemple avec options complètes

```javascript
const chart = createVerticalBarChart(values, labels, {
    title: 'Performance Annuelle',
    colors: ['#3b82f6', '#60a5fa', '#93c5fd'],
    showValues: true,
    showGrid: true,
    width: 800,
    height: 500,
    fontFamily: 'Arial, sans-serif',
    fontSize: 16,
    backgroundColor: '#f9fafb',
    barSpacing: 0.3,
    animationDuration: 1000,
    valueFormat: 'currency',
    decimalPlaces: 2
});
```

## 💾 Export et téléchargement

### Télécharger en SVG

```javascript
import { downloadSVG } from './charts.mjs';

const chart = createVerticalBarChart(values, labels);
downloadSVG(chart, 'mon-graphique.svg');
```

### Exporter en PNG

```javascript
import { exportToPNG } from './charts.mjs';

const chart = createVerticalBarChart(values, labels);
const blob = await exportToPNG(chart);

// Télécharger
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'graphique.png';
link.click();
URL.revokeObjectURL(url);
```

## 🎨 Personnalisation des couleurs

### Palette personnalisée

```javascript
const customColors = [
    '#FF6B6B',  // Rouge corail
    '#4ECDC4',  // Turquoise
    '#45B7D1',  // Bleu ciel
    '#FFA07A',  // Saumon
    '#98D8C8'   // Menthe
];

const chart = createPieChart(values, labels, {
    colors: customColors
});
```

### Dégradés (via CSS externe)

Les graphiques sont en SVG, vous pouvez donc définir des dégradés :

```html
<svg style="display: none;">
    <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
    </defs>
</svg>
```

```javascript
const chart = createVerticalBarChart(values, labels, {
    colors: ['url(#gradient1)']
});
```

## 📊 Formats de valeurs

### Nombres simples

```javascript
const chart = createVerticalBarChart([100, 200, 300], labels, {
    valueFormat: 'number',
    decimalPlaces: 0
});
// Affiche : 100, 200, 300
```

### Pourcentages

```javascript
const chart = createPieChart([25, 35, 40], labels, {
    valueFormat: 'percentage',
    decimalPlaces: 1
});
// Affiche : 25.0%, 35.0%, 40.0%
```

### Monnaie

```javascript
const chart = createHorizontalBarChart([1500, 2300, 1800], labels, {
    valueFormat: 'currency',
    decimalPlaces: 2
});
// Affiche : €1500.00, €2300.00, €1800.00
```

## 🎯 Exemples d'utilisation

### Dashboard de ventes

```javascript
// Ventes mensuelles
const monthlyChart = createVerticalBarChart(
    [45000, 52000, 48000, 61000, 55000, 67000],
    ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
    {
        title: 'Ventes Mensuelles 2024',
        colors: ['#3b82f6'],
        valueFormat: 'currency',
        showGrid: true
    }
);

// Répartition par catégorie
const categoryChart = createPieChart(
    [35, 25, 20, 15, 5],
    ['Électronique', 'Vêtements', 'Alimentation', 'Livres', 'Autres'],
    {
        title: 'Répartition des Ventes',
        showLegend: true,
        showValues: true
    }
);

// Performance des produits
const productChart = createHorizontalBarChart(
    [245, 189, 312, 267],
    ['Produit A', 'Produit B', 'Produit C', 'Produit D'],
    {
        title: 'Top Produits',
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
        showValues: true
    }
);
```

### Suivi de progression

```javascript
const progressChart = createSemiCircularChart(
    [30, 45, 25],
    ['Complété', 'En cours', 'À faire'],
    {
        title: 'État d\'avancement du projet',
        colors: ['#10b981', '#f59e0b', '#6b7280'],
        showValues: true,
        valueFormat: 'percentage'
    }
);
```

### Graphique animé en temps réel

```javascript
let values = [0, 0, 0, 0, 0];
const labels = ['Serveur 1', 'Serveur 2', 'Serveur 3', 'Serveur 4', 'Serveur 5'];

function updateChart() {
    // Simuler des données
    values = values.map(() => Math.floor(Math.random() * 100));
    
    const chart = createVerticalBarChart(values, labels, {
        title: 'Charge des serveurs',
        showValues: true,
        valueFormat: 'percentage'
    });
    
    document.getElementById('container').innerHTML = '';
    document.getElementById('container').appendChild(chart);
}

// Mettre à jour toutes les 2 secondes
setInterval(updateChart, 2000);
```

## 🔧 Intégration avec frameworks

### React

```jsx
import { useEffect, useRef } from 'react';
import { createVerticalBarChart } from './charts.mjs';

function ChartComponent({ values, labels }) {
    const chartRef = useRef(null);
    
    useEffect(() => {
        if (chartRef.current) {
            const chart = createVerticalBarChart(values, labels, {
                title: 'Mon Graphique',
                showValues: true
            });
            
            chartRef.current.innerHTML = '';
            chartRef.current.appendChild(chart);
        }
    }, [values, labels]);
    
    return <div ref={chartRef}></div>;
}
```

### Vue.js

```vue
<template>
    <div ref="chartContainer"></div>
</template>

<script>
import { createVerticalBarChart } from './charts.mjs';

export default {
    props: ['values', 'labels'],
    mounted() {
        this.renderChart();
    },
    watch: {
        values() {
            this.renderChart();
        }
    },
    methods: {
        renderChart() {
            const chart = createVerticalBarChart(this.values, this.labels, {
                title: 'Mon Graphique',
                showValues: true
            });
            
            this.$refs.chartContainer.innerHTML = '';
            this.$refs.chartContainer.appendChild(chart);
        }
    }
};
</script>
```

## 🌐 Compatibilité

- ✅ Chrome, Edge, Firefox, Safari (versions récentes)
- ✅ Support mobile (iOS Safari, Chrome Android)
- ✅ Format SVG standard, compatible avec tous les navigateurs modernes
- ⚠️ Nécessite un module bundler ou un serveur pour les imports ES6

## 📝 Notes techniques

- **Format SVG** : Les graphiques sont générés en SVG pour une qualité vectorielle
- **Animations CSS** : Utilise les éléments `<animate>` SVG pour les transitions
- **Performance** : Optimisé pour des datasets de taille moyenne (< 100 points)
- **Accessibilité** : Les textes sont dans le DOM SVG et donc accessibles

## 🤝 Contribution

Ce module est un outil de démonstration. N'hésitez pas à l'adapter à vos besoins !

## 📄 Licence

Libre d'utilisation pour vos projets personnels et commerciaux.

## 📞 Support

Pour toute question ou suggestion, consultez la documentation ou créez un exemple personnalisé.

---

Créé avec ❤️ en JavaScript moderne
