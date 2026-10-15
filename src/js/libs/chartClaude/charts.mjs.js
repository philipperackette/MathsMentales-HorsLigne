/**
 * Module de génération de graphiques
 * Supporte : barres verticales, barres horizontales, graphiques circulaires et semi-circulaires
 * @module charts
 */

/**
 * Options de configuration pour les graphiques
 * @typedef {Object} ChartOptions
 * @property {string[]} [colors] - Couleurs des barres/secteurs (hex, rgb, ou nom)
 * @property {boolean} [showValues=true] - Afficher les valeurs dans les barres/secteurs
 * @property {boolean} [showGrid=true] - Afficher la grille (pour barres uniquement)
 * @property {number} [width=600] - Largeur du graphique en pixels
 * @property {number} [height=400] - Hauteur du graphique en pixels
 * @property {string} [title=''] - Titre du graphique
 * @property {string} [fontFamily='system-ui, -apple-system, sans-serif'] - Police de caractères
 * @property {number} [fontSize=14] - Taille de police en pixels
 * @property {string} [backgroundColor='#ffffff'] - Couleur de fond
 * @property {number} [barSpacing=0.2] - Espacement entre barres (0-1)
 * @property {boolean} [showLegend=false] - Afficher la légende
 * @property {number} [animationDuration=800] - Durée de l'animation en ms
 * @property {string} [valueFormat='number'] - Format des valeurs: 'number', 'percentage', 'currency'
 * @property {number} [decimalPlaces=0] - Nombre de décimales pour les valeurs
 */

const DEFAULT_COLORS = [
  '#2563eb', '#dc2626', '#16a34a', '#ea580c', '#9333ea',
  '#0891b2', '#ca8a04', '#e11d48', '#7c3aed', '#059669'
];

const DEFAULT_OPTIONS = {
  colors: DEFAULT_COLORS,
  showValues: true,
  showGrid: true,
  showPercentages: false,
  width: 600,
  height: 400,
  title: '',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 28,
  backgroundColor: '#ffffff00',
  barSpacing: 0.2,
  showLegend: false,
  animationDuration: 800,
  valueFormat: 'number',
  decimalPlaces: 0
};

/**
 * Classe générique pour créer des graphiques
 * @template {keyof typeof CHART_TYPES} T
 */
export class Chart {
  /**
   * Types de graphiques disponibles
   */
  static CHART_TYPES = {
    vertical: createVerticalBarChart,
    horizontal: createHorizontalBarChart,
    pie: createPieChart,
    semicircular: createSemiCircularChart
  };

  /**
   * Crée un graphique du type spécifié
   * @template {keyof typeof Chart.CHART_TYPES} T
   * @param {T} type - Type de graphique
   * @param {number[]} values - Tableau des valeurs
   * @param {string[]} labels - Tableau des étiquettes
   * @param {ChartOptions} [options={}] - Options de configuration
   * @returns {SVGElement} Élément SVG du graphique
   */
  constructor(type, values, labels, options = {}) {
    const chartFunction = Chart.CHART_TYPES[type];
    if (!chartFunction) {
      throw new Error(`Type de graphique invalide: ${type}`);
    }
    return chartFunction(values, labels, options);
  }
}

/**
 * Formate une valeur selon les options
 * @private
 */
function formatValue(value, format, decimalPlaces) {
  const num = Number(value);
  if (isNaN(num)) return value;
  
  switch (format) {
    case 'percentage':
      return num.toFixed(decimalPlaces) + '%';
    case 'currency':
      return '€' + num.toFixed(decimalPlaces);
    default:
      return num.toFixed(decimalPlaces);
  }
}

/**
 * Crée un élément SVG
 * @private
 */
function createSVGElement(tag, attributes = {}) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
}

/**
 * Calcule les dimensions du graphique avec marges
 * @private
 */
function calculateDimensions(width, height, hasTitle, chartType = 'vertical', labels = [], fontSize = 14) {
  // Calculer la largeur maximale des labels pour les barres horizontales
  let maxLabelWidth = 80;
  if (chartType === 'horizontal' && labels.length > 0) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = fontSize + 'px system-ui, -apple-system, sans-serif';
    
    labels.forEach(label => {
      const widthLabel = ctx.measureText(label || '').width;
      if (widthLabel > maxLabelWidth) {
        maxLabelWidth = Math.min(widthLabel + 20, width * 0.3); // Limiter à 30% de la largeur
      }
    });
  }
  
  const margin = {
    top: hasTitle ? 60 : 30,
    right: 30,
    bottom: chartType === 'vertical' ? 80 : 60, // Plus d'espace pour les labels verticaux
    left: chartType === 'horizontal' ? maxLabelWidth : 80
  };
  return {
    margin,
    chartWidth: width - margin.left - margin.right,
    chartHeight: height - margin.top - margin.bottom
  };
}

/**
 * Tronque un texte et ajoute des points de suspension si nécessaire
 * @private
 */
function truncateText(text, maxWidth, fontSize = 14) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `${fontSize}px system-ui, -apple-system, sans-serif`;
  
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }
  
  let truncated = text;
  while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  
  return truncated + '...';
}

/**
 * Crée un texte multiligne dans un élément SVG
 * @private
 */
function createMultilineText(text, x, y, maxWidth, attributes = {}) {
  const words = String(text).split(' ');
  const lines = [];
  let currentLine = words[0];
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `${attributes['font-size'] || 14}px ${attributes['font-family'] || 'system-ui'}`;
  
  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + ' ' + words[i];
    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = words[i];
    }
  }
  lines.push(currentLine);
  
  // Limiter à 2 lignes maximum
  if (lines.length > 2) {
    lines[1] = truncateText(lines.slice(1).join(' '), maxWidth, attributes['font-size'] || 14);
    lines.length = 2;
  }
  
  const textGroup = createSVGElement('g');
  const lineHeight = (attributes['font-size'] || 14) * 1.2;
  
  lines.forEach((line, index) => {
    const tspan = createSVGElement('text', {
      x: x,
      y: y + (index * lineHeight),
      ...attributes
    });
    tspan.textContent = line;
    textGroup.appendChild(tspan);
  });
  
  return textGroup;
}

/**
 * Génère un graphique en barres verticales
 * @param {number[]} values - Tableau des valeurs
 * @param {string[]} labels - Tableau des étiquettes
 * @param {ChartOptions} [options={}] - Options de configuration
 * @returns {SVGElement} Élément SVG du graphique
 */
export function createVerticalBarChart(values, labels, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { margin, chartWidth, chartHeight } = calculateDimensions(opts.width, opts.height, !!opts.title, 'vertical', labels, opts.fontSize);
  
  const svg = createSVGElement('svg', {
    width: opts.width,
    height: opts.height,
    viewBox: `0 0 ${opts.width} ${opts.height}`
  });
  
  // Fond
  const bg = createSVGElement('rect', {
    width: opts.width,
    height: opts.height,
    fill: opts.backgroundColor
  });
  svg.appendChild(bg);
  
  // Titre
  if (opts.title) {
    const title = createSVGElement('text', {
      x: opts.width / 2,
      y: 30,
      'text-anchor': 'middle',
      'font-family': opts.fontFamily,
      'font-size': opts.fontSize + 4,
      'font-weight': 'bold',
      fill: '#1f2937'
    });
    title.textContent = opts.title;
    svg.appendChild(title);
  }
  
  // Groupe principal
  const chartGroup = createSVGElement('g', {
    transform: `translate(${margin.left}, ${margin.top})`
  });
  svg.appendChild(chartGroup);
  
  // Calculs
  const maxValue = Math.max(...values);
  const barWidth = chartWidth / values.length;
  const effectiveBarWidth = barWidth * (1 - opts.barSpacing);
  
  // Grille et axes
  if (opts.showGrid) {
    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const y = chartHeight - (chartHeight / gridSteps) * i;
      const value = (maxValue / gridSteps) * i;
      
      // Ligne de grille
      const gridLine = createSVGElement('line', {
        x1: 0,
        y1: y,
        x2: chartWidth,
        y2: y,
        stroke: '#bdbec0',
        'stroke-width': i === 0 ? 2 : 1,
        'stroke-dasharray': i === 0 ? 'none' : '3,3'
      });
      chartGroup.appendChild(gridLine);
      
      // Étiquette de valeur
      const label = createSVGElement('text', {
        x: -10,
        y: y + 4,
        'text-anchor': 'end',
        'font-family': opts.fontFamily,
        'font-size': opts.fontSize - 2,
        fill: '#6b7280'
      });
      label.textContent = formatValue(value, opts.valueFormat, opts.decimalPlaces);
      chartGroup.appendChild(label);
    }
  }
  
  // Déterminer si on doit faire pivoter les labels
  const maxLabelLength = Math.max(...labels.map(l => (l || '').length));
  const shouldRotateLabels = maxLabelLength > 8 || barWidth < 60;
  
  // Barres
  values.forEach((value, index) => {
    const x = barWidth * index + (barWidth - effectiveBarWidth) / 2;
    const barHeight = (value / maxValue) * chartHeight;
    const y = chartHeight - barHeight;
    const color = opts.colors[index % opts.colors.length];
    
    // Barre avec animation
    const bar = createSVGElement('rect', {
      x: x,
      y: chartHeight,
      width: effectiveBarWidth,
      height: 0,
      fill: color,
      rx: 4
    });
    
    // Animation
    const animate = createSVGElement('animate', {
      attributeName: 'height',
      from: 0,
      to: barHeight,
      dur: `${opts.animationDuration}ms`,
      fill: 'freeze'
    });
    bar.appendChild(animate);
    
    const animateY = createSVGElement('animate', {
      attributeName: 'y',
      from: chartHeight,
      to: y,
      dur: `${opts.animationDuration}ms`,
      fill: 'freeze'
    });
    bar.appendChild(animateY);
    
    chartGroup.appendChild(bar);
    
    // Valeur dans la barre
    if (opts.showValues) {
      const text = createSVGElement('text', {
        x: x + effectiveBarWidth / 2,
        y: y + opts.fontSize + 4 > chartHeight ? y - 8 : chartHeight - barHeight / 2 + opts.fontSize / 4,
        'text-anchor': 'middle',
        'font-family': opts.fontFamily,
        'font-size': opts.fontSize,
        'font-weight': 'bold',
        fill: '#1f2937',
        opacity: 0
      });
      text.textContent = formatValue(value, opts.valueFormat, opts.decimalPlaces);
      
      const fadeIn = createSVGElement('animate', {
        attributeName: 'opacity',
        from: 0,
        to: 1,
        begin: `${opts.animationDuration * 0.7}ms`,
        dur: '300ms',
        fill: 'freeze'
      });
      text.appendChild(fadeIn);
      
      chartGroup.appendChild(text);
    }
    
    // Étiquette avec rotation ou troncature
    const labelText = labels[index] || '';
    if (shouldRotateLabels) {
      // Labels en rotation pour gagner de la place
      const label = createSVGElement('text', {
        x: x + effectiveBarWidth / 2,
        y: chartHeight + 15,
        'text-anchor': 'start',
        'font-family': opts.fontFamily,
        'font-size': opts.fontSize - 2,
        fill: '#374151',
        transform: `rotate(45, ${x + effectiveBarWidth / 2}, ${chartHeight + 15})`
      });
      label.textContent = truncateText(labelText, 100, opts.fontSize - 2);
      chartGroup.appendChild(label);
    } else {
      // Labels horizontaux tronqués si nécessaire
      const label = createSVGElement('text', {
        x: x + effectiveBarWidth / 2,
        y: chartHeight + 20 + opts.fontSize / 4,
        'text-anchor': 'middle',
        'font-family': opts.fontFamily,
        'font-size': opts.fontSize,
        fill: '#374151'
      });
      label.textContent = truncateText(labelText, barWidth - 5, opts.fontSize);
      chartGroup.appendChild(label);
    }
  });
  
  return svg;
}

/**
 * Génère un graphique en barres horizontales
 * @param {number[]} values - Tableau des valeurs
 * @param {string[]} labels - Tableau des étiquettes
 * @param {ChartOptions} [options={}] - Options de configuration
 * @returns {SVGElement} Élément SVG du graphique
 */
export function createHorizontalBarChart(values, labels, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { margin, chartWidth, chartHeight } = calculateDimensions(opts.width, opts.height, !!opts.title, 'horizontal', labels, opts.fontSize);
  const svg = createSVGElement('svg', {
    width: opts.width,
    height: opts.height,
    viewBox: `0 0 ${opts.width} ${opts.height}`
  });
  
  // Fond
  const bg = createSVGElement('rect', {
    width: opts.width,
    height: opts.height,
    fill: opts.backgroundColor
  });
  svg.appendChild(bg);
  
  // Titre
  if (opts.title) {
    const title = createSVGElement('text', {
      x: opts.width / 2,
      y: 30,
      'text-anchor': 'middle',
      'font-family': opts.fontFamily,
      'font-size': opts.fontSize + 6,
      'font-weight': 'bold',
      fill: '#1f2937'
    });
    title.textContent = opts.title;
    svg.appendChild(title);
  }
  
  // Groupe principal
  const chartGroup = createSVGElement('g', {
    transform: `translate(${margin.left}, ${margin.top})`
  });
  svg.appendChild(chartGroup);
  
  // Calculs
  const maxValue = Math.max(...values);
  const barHeight = chartHeight / values.length;
  const effectiveBarHeight = barHeight * (1 - opts.barSpacing);
  
  // Grille et axes
  if (opts.showGrid) {
    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const x = (chartWidth / gridSteps) * i;
      const value = (maxValue / gridSteps) * i;
      
      // Ligne de grille
      const gridLine = createSVGElement('line', {
        x1: x,
        y1: 0,
        x2: x,
        y2: chartHeight,
        stroke: '#e5e7eb',
        'stroke-width': i === 0 ? 2 : 1,
        'stroke-dasharray': i === 0 ? 'none' : '3,3'
      });
      chartGroup.appendChild(gridLine);
      
      // Étiquette de valeur
      if (i > 0) {
        const label = createSVGElement('text', {
          x: x,
          y: chartHeight + 20,
          'text-anchor': 'middle',
          'font-family': opts.fontFamily,
          'font-size': opts.fontSize - 2,
          fill: '#6b7280'
        });
        label.textContent = formatValue(value, opts.valueFormat, opts.decimalPlaces);
        chartGroup.appendChild(label);
      }
    }
  }
  
  // Barres
  values.forEach((value, index) => {
    const y = barHeight * index + (barHeight - effectiveBarHeight) / 2;
    const barWidth = (value / maxValue) * chartWidth;
    const color = opts.colors[index % opts.colors.length];
    
    // Barre avec animation
    const bar = createSVGElement('rect', {
      x: 0,
      y: y,
      width: 0,
      height: effectiveBarHeight,
      fill: color,
      rx: 4
    });
    
    // Animation
    const animate = createSVGElement('animate', {
      attributeName: 'width',
      from: 0,
      to: barWidth,
      dur: `${opts.animationDuration}ms`,
      fill: 'freeze'
    });
    bar.appendChild(animate);
    
    chartGroup.appendChild(bar);
    
    // Valeur dans la barre
    if (opts.showValues) {
      const text = createSVGElement('text', {
        x: barWidth + 10,
        y: y + effectiveBarHeight / 2 + 4,
        'text-anchor': 'start',
        'font-family': opts.fontFamily,
        'font-size': opts.fontSize,
        'font-weight': 'bold',
        fill: '#1f2937',
        opacity: 0
      });
      text.textContent = formatValue(value, opts.valueFormat, opts.decimalPlaces);
      
      const fadeIn = createSVGElement('animate', {
        attributeName: 'opacity',
        from: 0,
        to: 1,
        begin: `${opts.animationDuration * 0.7}ms`,
        dur: '300ms',
        fill: 'freeze'
      });
      text.appendChild(fadeIn);
      
      chartGroup.appendChild(text);
    }
    
    // Étiquette avec gestion du texte multiligne
    const labelText = labels[index] || '';
    const maxLabelWidth = margin.left - 20;
    
    // Vérifier si le label nécessite plusieurs lignes
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `${opts.fontSize}px ${opts.fontFamily}`;
    
    if (ctx.measureText(labelText).width > maxLabelWidth) {
      // Créer un texte multiligne
      const textGroup = createMultilineText(
        labelText,
        -10,
        y + effectiveBarHeight / 2 - 6,
        maxLabelWidth,
        {
          'text-anchor': 'end',
          'font-family': opts.fontFamily,
          'font-size': opts.fontSize - 1,
          fill: '#374151'
        }
      );
      chartGroup.appendChild(textGroup);
    } else {
      // Texte simple sur une ligne
      const label = createSVGElement('text', {
        x: -10,
        y: y + effectiveBarHeight / 2 + 4,
        'text-anchor': 'end',
        'font-family': opts.fontFamily,
        'font-size': opts.fontSize,
        fill: '#374151'
      });
      label.textContent = labelText;
      chartGroup.appendChild(label);
    }
  });
  
  return svg;
}

/**
 * Génère un graphique circulaire (diagramme en camembert)
 * @param {number[]} values - Tableau des valeurs
 * @param {string[]} labels - Tableau des étiquettes
 * @param {ChartOptions} [options={}] - Options de configuration
 * @returns {SVGElement} Élément SVG du graphique
 */
export function createPieChart(values, labels, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const svg = createSVGElement('svg', {
    width: opts.width,
    height: opts.height,
    viewBox: `0 0 ${opts.width} ${opts.height}`
  });
  
  // Fond
  const bg = createSVGElement('rect', {
    width: opts.width,
    height: opts.height,
    fill: opts.backgroundColor
  });
  svg.appendChild(bg);
  
  // Titre
  if (opts.title) {
    const title = createSVGElement('text', {
      x: opts.width / 2,
      y: 30,
      'text-anchor': 'middle',
      'font-family': opts.fontFamily,
      'font-size': opts.fontSize + 6,
      'font-weight': 'bold',
      fill: '#1f2937'
    });
    title.textContent = opts.title;
    svg.appendChild(title);
  }
  
  // Calculs
  const centerX = opts.width / 2;
  const centerY = opts.height / 2 + (opts.title ? 10 : 0);
  const radius = Math.min(opts.width, opts.height) / 2 - 80;
  const total = values.reduce((sum, val) => sum + val, 0);
  
  let currentAngle = -Math.PI / 2; // Commence en haut
  
  values.forEach((value, index) => {
    const angle = (value / total) * 2 * Math.PI;
    const endAngle = currentAngle + angle;
    const color = opts.colors[index % opts.colors.length];
    
    // Calcul des points du secteur
    const x1 = centerX + radius * Math.cos(currentAngle);
    const y1 = centerY + radius * Math.sin(currentAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);
    
    const largeArcFlag = angle > Math.PI ? 1 : 0;
    
    // Secteur
    const path = createSVGElement('path', {
      d: `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`,
      fill: color,
      stroke: opts.backgroundColor,
      'stroke-width': 2,
      opacity: 0
    });
    
    // Animation
    const fadeIn = createSVGElement('animate', {
      attributeName: 'opacity',
      from: 0,
      to: 1,
      begin: `${index * 100}ms`,
      dur: '400ms',
      fill: 'freeze'
    });
    path.appendChild(fadeIn);
    
    svg.appendChild(path);
    
    // Valeur et étiquette
    if (opts.showValues || labels[index]) {
      const midAngle = currentAngle + angle / 2;
      const labelRadius = radius * 0.7;
      const labelX = centerX + labelRadius * Math.cos(midAngle);
      const labelY = centerY + labelRadius * Math.sin(midAngle);
      
      const percentage = ((value / total) * 100).toFixed(1);
      
      // Groupe pour texte
      const textGroup = createSVGElement('g', {
        opacity: 0
      });
      
      if (labels[index] && !opts.showLegend) {
        const labelText = createSVGElement('text', {
          x: labelX,
          y: labelY - 5,
          'text-anchor': 'middle',
          'font-family': opts.fontFamily,
          'font-size': opts.fontSize,
          'font-weight': 'bold',
          fill: '#ffffff'
        });
        labelText.textContent = labels[index];
        textGroup.appendChild(labelText);
      }
      
      if (opts.showValues) {
        const valueText = createSVGElement('text', {
          x: labelX,
          y: labelY + 10,
          'text-anchor': 'middle',
          'font-family': opts.fontFamily,
          'font-size': opts.fontSize - 2,
          fill: '#ffffff'
        });
        valueText.textContent = `${formatValue(value, opts.valueFormat, opts.decimalPlaces)}${opts.showPercentages ? ` (${percentage}%)` : ''}`;
        textGroup.appendChild(valueText);
      }
      
      const textFadeIn = createSVGElement('animate', {
        attributeName: 'opacity',
        from: 0,
        to: 1,
        begin: `${opts.animationDuration + index * 100}ms`,
        dur: '300ms',
        fill: 'freeze'
      });
      textGroup.appendChild(textFadeIn);
      
      svg.appendChild(textGroup);
    }
    
    currentAngle = endAngle;
  });
  
  // Légende
  if (opts.showLegend) {
    const legendX = 20;
    let legendY = opts.height - values.length * 25 - 20;
    
    values.forEach((value, index) => {
      const color = opts.colors[index % opts.colors.length];
      
      // Rectangle de couleur
      const rect = createSVGElement('rect', {
        x: legendX,
        y: legendY + index * 25,
        width: 15,
        height: 15,
        fill: color,
        rx: 2
      });
      svg.appendChild(rect);
      
      // Texte
      const text = createSVGElement('text', {
        x: legendX + 25,
        y: legendY + index * 25 + 12,
        'font-family': opts.fontFamily,
        'font-size': opts.fontSize - 2,
        fill: '#374151'
      });
      text.textContent = labels[index] || `Item ${index + 1}`;
      svg.appendChild(text);
    });
  }
  
  return svg;
}

/**
 * Génère un graphique semi-circulaire (jauge)
 * @param {number[]} values - Tableau des valeurs
 * @param {string[]} labels - Tableau des étiquettes
 * @param {ChartOptions} [options={}] - Options de configuration
 * @returns {SVGElement} Élément SVG du graphique
 */
export function createSemiCircularChart(values, labels, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const svg = createSVGElement('svg', {
    width: opts.width,
    height: opts.height,
    viewBox: `0 0 ${opts.width} ${opts.height}`
  });
  
  // Fond
  const bg = createSVGElement('rect', {
    width: opts.width,
    height: opts.height,
    fill: opts.backgroundColor
  });
  svg.appendChild(bg);
  
  // Titre
  if (opts.title) {
    const title = createSVGElement('text', {
      x: opts.width / 2,
      y: 30,
      'text-anchor': 'middle',
      'font-family': opts.fontFamily,
      'font-size': opts.fontSize + 6,
      'font-weight': 'bold',
      fill: '#1f2937'
    });
    title.textContent = opts.title;
    svg.appendChild(title);
  }
  
  // Calculs
  const centerX = opts.width / 2;
  const centerY = opts.height - 60;
  const radius = Math.min(opts.width, opts.height * 2) / 2 - 80;
  const total = values.reduce((sum, val) => sum + val, 0);
  
  let currentAngle = Math.PI; // Commence à gauche
  
  values.forEach((value, index) => {
    const angle = (value / total) * Math.PI; // Seulement 180 degrés
    const endAngle = currentAngle + angle;
    const color = opts.colors[index % opts.colors.length];
    
    // Calcul des points du secteur
    const x1 = centerX + radius * Math.cos(currentAngle);
    const y1 = centerY + radius * Math.sin(currentAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);
    
    const largeArcFlag = angle > Math.PI / 2 ? 1 : 0;
    
    // Secteur
    const path = createSVGElement('path', {
      d: `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`,
      fill: color,
      stroke: opts.backgroundColor,
      'stroke-width': 2,
      opacity: 0
    });
    
    // Animation
    const fadeIn = createSVGElement('animate', {
      attributeName: 'opacity',
      from: 0,
      to: 1,
      begin: `${index * 100}ms`,
      dur: '400ms',
      fill: 'freeze'
    });
    path.appendChild(fadeIn);
    
    svg.appendChild(path);
    
    // Valeur et étiquette
    if (opts.showValues || labels[index]) {
      const midAngle = currentAngle + angle / 2;
      const labelRadius = radius * 0.7;
      const labelX = centerX + labelRadius * Math.cos(midAngle);
      const labelY = centerY + labelRadius * Math.sin(midAngle);
      
      const percentage = ((value / total) * 100).toFixed(1);
      
      // Groupe pour texte
      const textGroup = createSVGElement('g', {
        opacity: 0
      });
      
      if (labels[index] && !opts.showLegend) {
        const labelText = createSVGElement('text', {
          x: labelX,
          y: labelY - 5,
          'text-anchor': 'middle',
          'font-family': opts.fontFamily,
          'font-size': opts.fontSize,
          'font-weight': 'bold',
          fill: '#ffffff00'
        });
        labelText.textContent = labels[index];
        textGroup.appendChild(labelText);
      }
      
      if (opts.showValues) {
        const valueText = createSVGElement('text', {
          x: labelX,
          y: labelY + 10,
          'text-anchor': 'middle',
          'font-family': opts.fontFamily,
          'font-size': opts.fontSize - 2,
          fill: '#ffffff'
        });
        valueText.textContent = `${formatValue(value, opts.valueFormat, opts.decimalPlaces)} (${percentage}%)`;
        textGroup.appendChild(valueText);
      }
      
      const textFadeIn = createSVGElement('animate', {
        attributeName: 'opacity',
        from: 0,
        to: 1,
        begin: `${opts.animationDuration + index * 100}ms`,
        dur: '300ms',
        fill: 'freeze'
      });
      textGroup.appendChild(textFadeIn);
      
      svg.appendChild(textGroup);
    }
    
    currentAngle = endAngle;
  });
  
  // Ligne de base
  const baseline = createSVGElement('line', {
    x1: centerX - radius,
    y1: centerY,
    x2: centerX + radius,
    y2: centerY,
    stroke: '#6b7280',
    'stroke-width': 2
  });
  svg.appendChild(baseline);
  
  // Légende
  if (opts.showLegend) {
    const legendX = 20;
    let legendY = 60;
    
    values.forEach((value, index) => {
      const color = opts.colors[index % opts.colors.length];
      
      // Rectangle de couleur
      const rect = createSVGElement('rect', {
        x: legendX,
        y: legendY + index * 25,
        width: 15,
        height: 15,
        fill: color,
        rx: 2
      });
      svg.appendChild(rect);
      
      // Texte
      const text = createSVGElement('text', {
        x: legendX + 25,
        y: legendY + index * 25 + 12,
        'font-family': opts.fontFamily,
        'font-size': opts.fontSize - 2,
        fill: '#374151'
      });
      text.textContent = labels[index] || `Item ${index + 1}`;
      svg.appendChild(text);
    });
  }
  
  return svg;
}

/**
 * Exporte un graphique en image PNG (nécessite un navigateur)
 * @param {SVGElement} svg - Élément SVG à exporter
 * @returns {Promise<Blob>} Blob de l'image PNG
 */
export async function exportToPNG(svg) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      canvas.width = svg.getAttribute('width');
      canvas.height = svg.getAttribute('height');
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    };
    
    img.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    
    img.src = url;
  });
}

/**
 * Télécharge un graphique SVG
 * @param {SVGElement} svg - Élément SVG à télécharger
 * @param {string} [filename='chart.svg'] - Nom du fichier
 */
export function downloadSVG(svg, filename = 'chart.svg') {
  const svgData = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export par défaut
export default {
  Chart,
  exportToPNG,
  downloadSVG
};
