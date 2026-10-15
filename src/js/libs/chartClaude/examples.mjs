/**
 * Exemples avancés d'utilisation du module de graphiques
 * Ce fichier contient des exemples pratiques pour différents cas d'usage
 */

import {
    createVerticalBarChart,
    createHorizontalBarChart,
    createPieChart,
    createSemiCircularChart,
    downloadSVG,
    exportToPNG
} from './charts.mjs';

// ============================================
// EXEMPLE 1 : Dashboard de ventes e-commerce
// ============================================

export function createSalesDashboard(container) {
    // Ventes mensuelles
    const monthlyData = {
        values: [45000, 52000, 48000, 61000, 55000, 67000, 59000, 71000, 64000, 68000, 72000, 80000],
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    };
    
    const monthlyChart = createVerticalBarChart(monthlyData.values, monthlyData.labels, {
        title: 'Ventes Mensuelles 2024',
        colors: ['#3b82f6'],
        showValues: true,
        showGrid: true,
        valueFormat: 'currency',
        width: 800,
        height: 400
    });
    
    // Répartition par catégorie
    const categoryData = {
        values: [35, 25, 20, 15, 5],
        labels: ['Électronique', 'Vêtements', 'Alimentation', 'Livres', 'Autres']
    };
    
    const categoryChart = createPieChart(categoryData.values, categoryData.labels, {
        title: 'Répartition des Ventes par Catégorie',
        colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
        showValues: true,
        showLegend: true,
        width: 600,
        height: 400
    });
    
    // Top produits
    const productData = {
        values: [245000, 189000, 312000, 267000, 198000],
        labels: ['iPhone 15', 'MacBook Pro', 'iPad Air', 'AirPods Pro', 'Apple Watch']
    };
    
    const productChart = createHorizontalBarChart(productData.values, productData.labels, {
        title: 'Top 5 Produits',
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'],
        showValues: true,
        showGrid: true,
        valueFormat: 'currency',
        width: 800,
        height: 400
    });
    
    // Ajouter au container
    if (container) {
        container.appendChild(monthlyChart);
        container.appendChild(categoryChart);
        container.appendChild(productChart);
    }
    
    return { monthlyChart, categoryChart, productChart };
}

// ============================================
// EXEMPLE 2 : Tableau de bord RH
// ============================================

export function createHRDashboard(container) {
    // Répartition des employés par département
    const departmentData = {
        values: [45, 32, 28, 19, 15],
        labels: ['IT', 'Ventes', 'Marketing', 'RH', 'Finance']
    };
    
    const departmentChart = createPieChart(departmentData.values, departmentData.labels, {
        title: 'Employés par Département',
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        showValues: true,
        showLegend: true,
        width: 600,
        height: 400
    });
    
    // Satisfaction des employés
    const satisfactionData = {
        values: [15, 55, 30],
        labels: ['Insatisfaits', 'Satisfaits', 'Très satisfaits']
    };
    
    const satisfactionChart = createSemiCircularChart(satisfactionData.values, satisfactionData.labels, {
        title: 'Satisfaction des Employés',
        colors: ['#ef4444', '#f59e0b', '#10b981'],
        showValues: true,
        valueFormat: 'percentage',
        width: 600,
        height: 400
    });
    
    // Recrutements par mois
    const hiringData = {
        values: [5, 8, 12, 7, 15, 9, 11, 14, 10, 8, 6, 13],
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    };
    
    const hiringChart = createVerticalBarChart(hiringData.values, hiringData.labels, {
        title: 'Recrutements 2024',
        colors: ['#10b981'],
        showValues: true,
        showGrid: true,
        width: 800,
        height: 400
    });
    
    if (container) {
        container.appendChild(departmentChart);
        container.appendChild(satisfactionChart);
        container.appendChild(hiringChart);
    }
    
    return { departmentChart, satisfactionChart, hiringChart };
}

// ============================================
// EXEMPLE 3 : Statistiques sportives
// ============================================

export function createSportsStats(container) {
    // Points par match
    const pointsData = {
        values: [87, 92, 78, 105, 98, 88, 94, 102],
        labels: ['Match 1', 'Match 2', 'Match 3', 'Match 4', 'Match 5', 'Match 6', 'Match 7', 'Match 8']
    };
    
    const pointsChart = createVerticalBarChart(pointsData.values, pointsData.labels, {
        title: 'Points par Match',
        colors: ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'],
        showValues: true,
        showGrid: true,
        width: 800,
        height: 400
    });
    
    // Répartition des tirs
    const shotsData = {
        values: [45, 32, 23],
        labels: ['Paniers à 2 pts', 'Paniers à 3 pts', 'Lancers francs']
    };
    
    const shotsChart = createPieChart(shotsData.values, shotsData.labels, {
        title: 'Répartition des Points',
        colors: ['#3b82f6', '#10b981', '#f59e0b'],
        showValues: true,
        showLegend: true,
        width: 600,
        height: 400
    });
    
    if (container) {
        container.appendChild(pointsChart);
        container.appendChild(shotsChart);
    }
    
    return { pointsChart, shotsChart };
}

// ============================================
// EXEMPLE 4 : Analyse budgétaire
// ============================================

export function createBudgetAnalysis(container) {
    // Dépenses par catégorie
    const expensesData = {
        values: [1200, 800, 500, 300, 200, 150],
        labels: ['Loyer', 'Alimentation', 'Transport', 'Loisirs', 'Vêtements', 'Autres']
    };
    
    const expensesChart = createHorizontalBarChart(expensesData.values, expensesData.labels, {
        title: 'Dépenses Mensuelles',
        colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#6b7280'],
        showValues: true,
        showGrid: true,
        valueFormat: 'currency',
        width: 800,
        height: 400
    });
    
    // Répartition du budget
    const budgetData = {
        values: [40, 25, 15, 10, 10],
        labels: ['Essentiels', 'Épargne', 'Loisirs', 'Santé', 'Divers']
    };
    
    const budgetChart = createSemiCircularChart(budgetData.values, budgetData.labels, {
        title: 'Répartition du Budget',
        colors: ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'],
        showValues: true,
        valueFormat: 'percentage',
        showLegend: true,
        width: 600,
        height: 400
    });
    
    if (container) {
        container.appendChild(expensesChart);
        container.appendChild(budgetChart);
    }
    
    return { expensesChart, budgetChart };
}

// ============================================
// EXEMPLE 5 : Suivi de projet
// ============================================

export function createProjectTracker(container) {
    // Avancement des tâches
    const progressData = {
        values: [45, 35, 20],
        labels: ['Complété', 'En cours', 'À faire']
    };
    
    const progressChart = createSemiCircularChart(progressData.values, progressData.labels, {
        title: 'Avancement du Projet',
        colors: ['#10b981', '#f59e0b', '#6b7280'],
        showValues: true,
        valueFormat: 'percentage',
        width: 600,
        height: 400
    });
    
    // Heures par phase
    const hoursData = {
        values: [120, 85, 95, 60, 40],
        labels: ['Conception', 'Développement', 'Tests', 'Documentation', 'Déploiement']
    };
    
    const hoursChart = createHorizontalBarChart(hoursData.values, hoursData.labels, {
        title: 'Heures par Phase',
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        showValues: true,
        showGrid: true,
        width: 800,
        height: 400
    });
    
    // Bugs par semaine
    const bugsData = {
        values: [12, 15, 8, 10, 6, 4, 7, 3],
        labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8']
    };
    
    const bugsChart = createVerticalBarChart(bugsData.values, bugsData.labels, {
        title: 'Bugs Détectés par Semaine',
        colors: ['#ef4444'],
        showValues: true,
        showGrid: true,
        width: 800,
        height: 400
    });
    
    if (container) {
        container.appendChild(progressChart);
        container.appendChild(hoursChart);
        container.appendChild(bugsChart);
    }
    
    return { progressChart, hoursChart, bugsChart };
}

// ============================================
// EXEMPLE 6 : Graphique en temps réel
// ============================================

export function createRealtimeMonitor(container, interval = 2000) {
    let values = [0, 0, 0, 0, 0];
    const labels = ['CPU', 'RAM', 'Disque', 'Réseau', 'GPU'];
    
    function updateChart() {
        // Simuler des données en temps réel
        values = values.map(() => Math.floor(Math.random() * 100));
        
        const chart = createVerticalBarChart(values, labels, {
            title: 'Utilisation des Ressources',
            colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
            showValues: true,
            valueFormat: 'percentage',
            showGrid: true,
            animationDuration: 400,
            width: 600,
            height: 400
        });
        
        if (container) {
            container.innerHTML = '';
            container.appendChild(chart);
        }
    }
    
    // Première mise à jour
    updateChart();
    
    // Mise à jour périodique
    const intervalId = setInterval(updateChart, interval);
    
    // Retourner une fonction pour arrêter le monitoring
    return () => clearInterval(intervalId);
}

// ============================================
// EXEMPLE 7 : Comparaison de données
// ============================================

export function createComparison(container) {
    // Comparaison de performances
    const performanceData = {
        values: [85, 92, 78, 88],
        labels: ['Trimestre 1', 'Trimestre 2', 'Trimestre 3', 'Trimestre 4']
    };
    
    const performanceChart = createVerticalBarChart(performanceData.values, performanceData.labels, {
        title: 'Performance Trimestrielle',
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
        showValues: true,
        showGrid: true,
        valueFormat: 'percentage',
        width: 800,
        height: 400
    });
    
    if (container) {
        container.appendChild(performanceChart);
    }
    
    return { performanceChart };
}

// ============================================
// EXEMPLE 8 : Export et téléchargement
// ============================================

export async function demonstrateExport() {
    // Créer un graphique
    const values = [45, 67, 52, 89, 73, 61];
    const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
    
    const chart = createVerticalBarChart(values, labels, {
        title: 'Exemple pour Export',
        showValues: true,
        showGrid: true
    });
    
    // Télécharger en SVG
    console.log('Téléchargement du SVG...');
    downloadSVG(chart, 'mon-graphique.svg');
    
    // Exporter en PNG (nécessite un DOM)
    try {
        const blob = await exportToPNG(chart);
        console.log('PNG exporté avec succès, taille:', blob.size, 'bytes');
        
        // Créer un lien de téléchargement
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'mon-graphique.png';
        link.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Erreur lors de l\'export PNG:', error);
    }
}

// ============================================
// EXEMPLE 9 : Graphique avec données dynamiques
// ============================================

export function createDynamicChart(container, initialData) {
    let currentData = initialData || {
        values: [45, 67, 52, 89, 73],
        labels: ['A', 'B', 'C', 'D', 'E']
    };
    
    function render() {
        const chart = createVerticalBarChart(currentData.values, currentData.labels, {
            title: 'Graphique Dynamique',
            showValues: true,
            showGrid: true,
            width: 600,
            height: 400
        });
        
        if (container) {
            container.innerHTML = '';
            container.appendChild(chart);
        }
    }
    
    // Rendu initial
    render();
    
    // API pour mettre à jour les données
    return {
        updateData(newValues, newLabels) {
            currentData.values = newValues;
            if (newLabels) {
                currentData.labels = newLabels;
            }
            render();
        },
        
        addDataPoint(value, label) {
            currentData.values.push(value);
            currentData.labels.push(label);
            render();
        },
        
        removeDataPoint(index) {
            currentData.values.splice(index, 1);
            currentData.labels.splice(index, 1);
            render();
        }
    };
}

// ============================================
// EXEMPLE 10 : Utilisation avec des promesses
// ============================================

export async function createChartFromAPI(container, apiUrl) {
    try {
        // Simuler un appel API
        console.log('Récupération des données depuis', apiUrl);
        
        // En production, remplacer par :
        // const response = await fetch(apiUrl);
        // const data = await response.json();
        
        // Données simulées
        const data = {
            values: [45, 67, 52, 89, 73, 61, 84, 92],
            labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû']
        };
        
        const chart = createVerticalBarChart(data.values, data.labels, {
            title: 'Données de l\'API',
            showValues: true,
            showGrid: true,
            width: 800,
            height: 400
        });
        
        if (container) {
            container.appendChild(chart);
        }
        
        return chart;
    } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        throw error;
    }
}

// Export de toutes les fonctions
export default {
    createSalesDashboard,
    createHRDashboard,
    createSportsStats,
    createBudgetAnalysis,
    createProjectTracker,
    createRealtimeMonitor,
    createComparison,
    demonstrateExport,
    createDynamicChart,
    createChartFromAPI
};
