/* ========================================
   EXPORT.UTILS.JS - Service d'export de données centralisé
   Chemin: src/utils/ui/export.utils.js
   
   DESCRIPTION:
   Service centralisé pour tous les exports de données de l'application.
   Gère l'export CSV, Excel, PDF, JSON et HTML avec formatage approprié.
   Résout les problèmes d'encodage, d'échappement et de format pour
   garantir des exports propres et utilisables dans tous les logiciels.
   
   STRUCTURE DU FICHIER:
   1. IMPORTS ET CONFIGURATION
   2. EXPORT CSV
   3. EXPORT EXCEL
   4. EXPORT PDF
   5. EXPORT JSON
   6. EXPORT HTML
   7. UTILITAIRES DE FORMATAGE
   8. HELPERS DE TÉLÉCHARGEMENT
   9. FONCTIONS PRIVÉES
   10. EXPORT
   
   UTILISATION:
   import { exportCSV, exportExcel, exportPDF } from '/Orixis-pwa/src/utils/ui/export.utils.js';
   
   // Export CSV
   exportCSV(data, { filename: 'export.csv', columns: {...} });
   
   // Export Excel multi-feuilles
   exportExcel({ sheets: [{name: 'Data', data: [...]}] });
   
   // Export PDF
   exportPDF(data, { template: 'invoice', orientation: 'portrait' });
   
   API PUBLIQUE:
   - exportCSV(data, options) - Export CSV avec échappement et UTF-8
   - exportExcel(config) - Export Excel XLSX multi-feuilles
   - exportPDF(data, options) - Export PDF avec templates
   - exportJSON(data, options) - Export JSON formaté ou minifié
   - exportHTML(data, options) - Export HTML pour impression
   - downloadFile(content, filename, mimeType) - Force téléchargement
   - createCSVContent(data, options) - Créer contenu CSV sans download
   
   DÉPENDANCES:
   - Optionnel : SheetJS pour Excel avancé
   - Optionnel : jsPDF pour PDF avancé
   - Fonctionne en standalone pour CSV/JSON/HTML
   
   MODIFICATIONS:
   - 08/02/2025 : Création initiale avec support CSV complet
   
   AUTEUR: Assistant Claude
   VERSION: 1.0.0
   ======================================== */

// ========================================
// 1. IMPORTS ET CONFIGURATION
// ========================================

/**
 * Configuration par défaut des exports
 * @private
 */
const CONFIG = {
    CSV: {
        delimiter: ';',           // Séparateur pour Excel français
        lineBreak: '\r\n',        // Windows line breaks
        addBOM: true,             // UTF-8 BOM pour les accents
        escapeFormulas: true,     // Protection contre injections
        dateFormat: 'DD/MM/YYYY', // Format français
        numberFormat: 'fr-FR',    // Format nombres français
        nullValue: '',            // Valeur pour null/undefined
        booleanTrue: 'OUI',       // Valeur pour true
        booleanFalse: 'NON',      // Valeur pour false
        maxCellLength: 32767      // Limite Excel
    },
    
    EXCEL: {
        defaultSheetName: 'Feuille1',
        maxSheetNameLength: 31,
        dateFormat: 'dd/mm/yyyy',
        numberFormat: '#,##0.00',
        headerStyle: {
            font: { bold: true },
            fill: { color: '#E0E0E0' },
            alignment: { horizontal: 'center' }
        }
    },
    
    PDF: {
        orientation: 'portrait',
        format: 'A4',
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
        fontSize: 12,
        fontFamily: 'Helvetica',
        lineHeight: 1.5
    },
    
    JSON: {
        indent: 2,
        dateHandler: 'toISOString', // ou 'timestamp'
        includeNull: false,
        sortKeys: false
    },
    
    HTML: {
        tableClass: 'export-table',
        includeStyles: true,
        printOptimized: true
    },
    
    MIME_TYPES: {
        csv: 'text/csv;charset=utf-8',
        excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        pdf: 'application/pdf',
        json: 'application/json;charset=utf-8',
        html: 'text/html;charset=utf-8'
    }
};

/**
 * Caractères à échapper en CSV
 * @private
 */
const CSV_ESCAPE_CHARS = [',', ';', '"', '\n', '\r', '\t'];

/**
 * Formules dangereuses à échapper
 * @private
 */
const FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

// ========================================
// 2. EXPORT CSV
// ========================================

/**
 * Exporter des données en CSV
 * Gère l'échappement, l'encodage UTF-8 et le formatage français
 * 
 * @param {Array<Object>} data - Données à exporter
 * @param {Object} [options] - Options d'export
 * @param {string} [options.filename='export.csv'] - Nom du fichier
 * @param {Object|Array} [options.columns] - Colonnes à exporter
 * @param {string} [options.delimiter=';'] - Séparateur de colonnes
 * @param {boolean} [options.addBOM=true] - Ajouter BOM UTF-8
 * @param {Function} [options.transform] - Transformer les données
 * @param {Array} [options.header] - En-tête personnalisé
 * @param {Array} [options.footer] - Pied de page
 * @param {string} [options.groupBy] - Grouper par colonne
 * @returns {void}
 * 
 * @example
 * exportCSV(data, {
 *     filename: 'decomptes-2025.csv',
 *     columns: {
 *         numeroDecompte: 'N° Décompte',
 *         'client.nom': 'Nom',
 *         'client.prenom': 'Prénom',
 *         montant: 'Montant €'
 *     },
 *     transform: (row) => ({
 *         ...row,
 *         montant: row.montant.toFixed(2).replace('.', ',')
 *     })
 * });
 */
export function exportCSV(data, options = {}) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn('⚠️ Export CSV : Aucune donnée à exporter');
        return;
    }
    
    const config = {
        ...CONFIG.CSV,
        ...options,
        filename: options.filename || `export-${Date.now()}.csv`
    };
    
    console.log(`📊 Export CSV : ${data.length} lignes`);
    
    try {
        // Créer le contenu CSV
        const csvContent = createCSVContent(data, config);
        
        // Ajouter BOM UTF-8 si demandé
        const finalContent = config.addBOM 
            ? '\uFEFF' + csvContent 
            : csvContent;
        
        // Télécharger
        downloadFile(finalContent, config.filename, CONFIG.MIME_TYPES.csv);
        
        console.log(`✅ Export CSV réussi : ${config.filename}`);
        
    } catch (error) {
        console.error('❌ Erreur export CSV:', error);
        throw new Error(`Erreur export CSV : ${error.message}`);
    }
}

/**
 * Créer le contenu CSV sans télécharger
 * Utile pour preview ou envoi API
 * 
 * @param {Array<Object>} data - Données
 * @param {Object} options - Options
 * @returns {string} Contenu CSV
 */
export function createCSVContent(data, options = {}) {
    const config = { ...CONFIG.CSV, ...options };
    
    // Appliquer transformation si fournie
    let processedData = data;
    if (config.transform && typeof config.transform === 'function') {
        processedData = data.map(config.transform);
    }
    
    // Grouper si demandé
    if (config.groupBy) {
        processedData = groupDataBy(processedData, config.groupBy);
    }
    
    // Déterminer les colonnes
    const columns = prepareColumns(config.columns, processedData[0]);
    
    // Construire le CSV
    const rows = [];
    
    // En-tête personnalisé
    if (config.header) {
        rows.push(...config.header.map(row => formatCSVRow(row, config)));
    }
    
    // En-têtes de colonnes
    const headers = Object.values(columns).map(label => escapeCSVValue(label, config));
    rows.push(headers.join(config.delimiter));
    
    // Données
    processedData.forEach(item => {
        const row = [];
        
        for (const [key, label] of Object.entries(columns)) {
            const value = getNestedValue(item, key);
            const formatted = formatCSVValue(value, config);
            row.push(formatted);
        }
        
        rows.push(row.join(config.delimiter));
    });
    
    // Pied de page
    if (config.footer) {
        rows.push(...config.footer.map(row => formatCSVRow(row, config)));
    }
    
    return rows.join(config.lineBreak);
}

// ========================================
// 3. EXPORT EXCEL
// ========================================

/**
 * Exporter en Excel (XLSX)
 * Supporte multi-feuilles et formatage basique
 * 
 * @param {Object} config - Configuration d'export
 * @param {Array<Object>} config.sheets - Feuilles à exporter
 * @param {string} [config.filename='export.xlsx'] - Nom du fichier
 * @param {Object} [config.styles] - Styles personnalisés
 * @returns {void}
 * 
 * @example
 * exportExcel({
 *     filename: 'rapport-mensuel.xlsx',
 *     sheets: [
 *         {
 *             name: 'Décomptes',
 *             data: decomptesData,
 *             columns: { ... }
 *         },
 *         {
 *             name: 'Statistiques',
 *             data: statsData
 *         }
 *     ]
 * });
 */
export function exportExcel(config) {
    const filename = config.filename || `export-${Date.now()}.xlsx`;
    
    console.log(`📊 Export Excel : ${config.sheets?.length || 1} feuille(s)`);
    
    // Vérifier si SheetJS est disponible
    if (typeof XLSX !== 'undefined') {
        exportExcelWithSheetJS(config);
        return;
    }
    
    // Fallback : créer un CSV pour chaque feuille
    console.warn('⚠️ SheetJS non disponible, export en CSV');
    
    if (!config.sheets || config.sheets.length === 0) {
        console.error('❌ Aucune feuille à exporter');
        return;
    }
    
    // Si une seule feuille, export CSV simple
    if (config.sheets.length === 1) {
        const sheet = config.sheets[0];
        exportCSV(sheet.data, {
            ...sheet,
            filename: filename.replace('.xlsx', '.csv')
        });
        return;
    }
    
    // Si plusieurs feuilles, créer un ZIP (nécessite une lib)
    console.warn('⚠️ Export multi-feuilles nécessite SheetJS');
    console.log('💡 Ajouter : <script src="https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js"></script>');
    
    // Export de la première feuille seulement
    const sheet = config.sheets[0];
    exportCSV(sheet.data, {
        ...sheet,
        filename: filename.replace('.xlsx', `-${sheet.name || 'feuille1'}.csv`)
    });
}

/**
 * Export Excel avec SheetJS
 * 
 * @private
 */
function exportExcelWithSheetJS(config) {
    try {
        // Créer un nouveau workbook
        const wb = XLSX.utils.book_new();
        
        // Ajouter chaque feuille
        config.sheets.forEach((sheet, index) => {
            const sheetName = sanitizeSheetName(sheet.name || `Feuille${index + 1}`);
            
            // Préparer les données
            let wsData = [];
            
            // Déterminer les colonnes
            const columns = prepareColumns(sheet.columns, sheet.data[0]);
            
            // Ajouter les en-têtes
            wsData.push(Object.values(columns));
            
            // Ajouter les données
            sheet.data.forEach(row => {
                const rowData = [];
                for (const key of Object.keys(columns)) {
                    const value = getNestedValue(row, key);
                    rowData.push(formatExcelValue(value));
                }
                wsData.push(rowData);
            });
            
            // Créer la feuille
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            
            // Appliquer les styles si disponibles
            if (sheet.styles || config.styles) {
                applyExcelStyles(ws, sheet.styles || config.styles);
            }
            
            // Ajouter au workbook
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });
        
        // Exporter
        XLSX.writeFile(wb, config.filename);
        
        console.log(`✅ Export Excel réussi : ${config.filename}`);
        
    } catch (error) {
        console.error('❌ Erreur export Excel:', error);
        throw error;
    }
}

// ========================================
// 4. EXPORT PDF
// ========================================

/**
 * Exporter en PDF
 * 
 * @param {Array<Object>} data - Données à exporter
 * @param {Object} [options] - Options
 * @param {string} [options.filename='export.pdf'] - Nom du fichier
 * @param {string} [options.title] - Titre du document
 * @param {string} [options.orientation='portrait'] - Orientation
 * @param {string} [options.template] - Template à utiliser
 * @returns {void}
 * 
 * @example
 * exportPDF(data, {
 *     filename: 'facture-12345.pdf',
 *     title: 'Facture N°12345',
 *     orientation: 'portrait',
 *     template: 'invoice'
 * });
 */
export function exportPDF(data, options = {}) {
    const config = {
        ...CONFIG.PDF,
        ...options,
        filename: options.filename || `export-${Date.now()}.pdf`
    };
    
    console.log(`📊 Export PDF : ${data.length} lignes`);
    
    // Vérifier si jsPDF est disponible
    if (typeof jsPDF !== 'undefined') {
        exportPDFWithJsPDF(data, config);
        return;
    }
    
    // Fallback : générer HTML et ouvrir print dialog
    console.warn('⚠️ jsPDF non disponible, export via impression');
    
    const htmlContent = createHTMLTable(data, {
        ...config,
        title: config.title,
        printOptimized: true
    });
    
    openPrintDialog(htmlContent, config.title);
}

/**
 * Export PDF avec jsPDF
 * 
 * @private
 */
function exportPDFWithJsPDF(data, config) {
    try {
        // Créer le document
        const doc = new jsPDF({
            orientation: config.orientation,
            unit: 'mm',
            format: config.format
        });
        
        // Ajouter le titre
        if (config.title) {
            doc.setFontSize(16);
            doc.text(config.title, config.margins.left, config.margins.top);
        }
        
        // Préparer les colonnes
        const columns = prepareColumns(config.columns, data[0]);
        const headers = Object.values(columns);
        const keys = Object.keys(columns);
        
        // Préparer les données pour la table
        const rows = data.map(item => {
            return keys.map(key => {
                const value = getNestedValue(item, key);
                return formatPDFValue(value);
            });
        });
        
        // Ajouter la table
        doc.autoTable({
            head: [headers],
            body: rows,
            startY: config.title ? 30 : config.margins.top,
            margin: config.margins,
            styles: {
                fontSize: config.fontSize,
                font: config.fontFamily
            }
        });
        
        // Sauvegarder
        doc.save(config.filename);
        
        console.log(`✅ Export PDF réussi : ${config.filename}`);
        
    } catch (error) {
        console.error('❌ Erreur export PDF:', error);
        throw error;
    }
}

// ========================================
// 5. EXPORT JSON
// ========================================

/**
 * Exporter en JSON
 * 
 * @param {any} data - Données à exporter
 * @param {Object} [options] - Options
 * @param {string} [options.filename='export.json'] - Nom du fichier
 * @param {boolean} [options.minify=false] - Minifier le JSON
 * @param {number} [options.indent=2] - Indentation
 * @param {boolean} [options.sortKeys=false] - Trier les clés
 * @returns {void}
 * 
 * @example
 * exportJSON(data, {
 *     filename: 'data.json',
 *     indent: 4,
 *     sortKeys: true
 * });
 */
export function exportJSON(data, options = {}) {
    const config = {
        ...CONFIG.JSON,
        ...options,
        filename: options.filename || `export-${Date.now()}.json`
    };
    
    console.log(`📊 Export JSON`);
    
    try {
        // Préparer les données
        let processedData = data;
        
        // Gérer les dates
        if (config.dateHandler === 'timestamp') {
            processedData = JSON.parse(JSON.stringify(data, (key, value) => {
                if (value instanceof Date) {
                    return value.getTime();
                }
                return value;
            }));
        }
        
        // Trier les clés si demandé
        if (config.sortKeys) {
            processedData = sortObjectKeys(processedData);
        }
        
        // Convertir en JSON
        const jsonContent = config.minify
            ? JSON.stringify(processedData)
            : JSON.stringify(processedData, null, config.indent);
        
        // Télécharger
        downloadFile(jsonContent, config.filename, CONFIG.MIME_TYPES.json);
        
        console.log(`✅ Export JSON réussi : ${config.filename}`);
        
    } catch (error) {
        console.error('❌ Erreur export JSON:', error);
        throw error;
    }
}

// ========================================
// 6. EXPORT HTML
// ========================================

/**
 * Exporter en HTML (table)
 * 
 * @param {Array<Object>} data - Données
 * @param {Object} [options] - Options
 * @param {string} [options.filename='export.html'] - Nom du fichier
 * @param {string} [options.title] - Titre de la page
 * @param {boolean} [options.includeStyles=true] - Inclure les styles
 * @param {boolean} [options.openInBrowser=false] - Ouvrir dans le navigateur
 * @returns {void}
 * 
 * @example
 * exportHTML(data, {
 *     filename: 'rapport.html',
 *     title: 'Rapport Mensuel',
 *     openInBrowser: true
 * });
 */
export function exportHTML(data, options = {}) {
    const config = {
        ...CONFIG.HTML,
        ...options,
        filename: options.filename || `export-${Date.now()}.html`
    };
    
    console.log(`📊 Export HTML : ${data.length} lignes`);
    
    try {
        const htmlContent = createHTMLDocument(data, config);
        
        if (config.openInBrowser) {
            // Ouvrir dans un nouvel onglet
            const blob = new Blob([htmlContent], { type: CONFIG.MIME_TYPES.html });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            
            // Nettoyer après 1 minute
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } else {
            // Télécharger
            downloadFile(htmlContent, config.filename, CONFIG.MIME_TYPES.html);
        }
        
        console.log(`✅ Export HTML réussi : ${config.filename}`);
        
    } catch (error) {
        console.error('❌ Erreur export HTML:', error);
        throw error;
    }
}

/**
 * Créer un document HTML complet
 * 
 * @private
 */
function createHTMLDocument(data, config) {
    const tableHTML = createHTMLTable(data, config);
    
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title || 'Export'}</title>
    ${config.includeStyles ? getHTMLStyles() : ''}
</head>
<body>
    ${config.title ? `<h1>${config.title}</h1>` : ''}
    ${tableHTML}
    ${config.includeFooter ? getHTMLFooter() : ''}
</body>
</html>`;
}

/**
 * Créer une table HTML
 * 
 * @private
 */
function createHTMLTable(data, config) {
    if (!data || data.length === 0) {
        return '<p>Aucune donnée à afficher</p>';
    }
    
    const columns = prepareColumns(config.columns, data[0]);
    
    let html = `<table class="${config.tableClass || 'export-table'}">`;
    
    // En-têtes
    html += '<thead><tr>';
    for (const label of Object.values(columns)) {
        html += `<th>${escapeHTML(label)}</th>`;
    }
    html += '</tr></thead>';
    
    // Corps
    html += '<tbody>';
    data.forEach(row => {
        html += '<tr>';
        for (const key of Object.keys(columns)) {
            const value = getNestedValue(row, key);
            html += `<td>${escapeHTML(formatHTMLValue(value))}</td>`;
        }
        html += '</tr>';
    });
    html += '</tbody>';
    
    html += '</table>';
    
    return html;
}

// ========================================
// 7. UTILITAIRES DE FORMATAGE
// ========================================

/**
 * Échapper une valeur CSV
 * 
 * @private
 */
function escapeCSVValue(value, config) {
    // Gérer null/undefined
    if (value === null || value === undefined) {
        return config.nullValue;
    }
    
    // Convertir en string
    let str = String(value);
    
    // Limiter la longueur
    if (str.length > config.maxCellLength) {
        str = str.substring(0, config.maxCellLength - 3) + '...';
    }
    
    // Échapper les formules dangereuses
    if (config.escapeFormulas && FORMULA_PREFIXES.some(prefix => str.startsWith(prefix))) {
        str = "'" + str;
    }
    
    // Vérifier si encapsulation nécessaire
    const needsQuotes = CSV_ESCAPE_CHARS.some(char => str.includes(char));
    
    if (needsQuotes || str.includes('"')) {
        // Doubler les guillemets existants
        str = str.replace(/"/g, '""');
        // Encapsuler
        return `"${str}"`;
    }
    
    return str;
}

/**
 * Formater une valeur CSV
 * 
 * @private
 */
function formatCSVValue(value, config) {
    // Null/undefined
    if (value === null || value === undefined) {
        return config.nullValue;
    }
    
    // Booléens
    if (typeof value === 'boolean') {
        return value ? config.booleanTrue : config.booleanFalse;
    }
    
    // Dates
    if (value instanceof Date) {
        return formatDate(value, config.dateFormat);
    }
    
    // Nombres
    if (typeof value === 'number') {
        return formatNumber(value, config.numberFormat);
    }
    
    // Arrays
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    
    // Objects
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    
    // String par défaut
    return escapeCSVValue(value, config);
}

/**
 * Formater une ligne CSV
 * 
 * @private
 */
function formatCSVRow(row, config) {
    if (Array.isArray(row)) {
        return row.map(cell => escapeCSVValue(cell, config)).join(config.delimiter);
    }
    return '';
}

/**
 * Formater une valeur Excel
 * 
 * @private
 */
function formatExcelValue(value) {
    if (value === null || value === undefined) {
        return '';
    }
    
    if (value instanceof Date) {
        return value;  // Excel gère les dates nativement
    }
    
    if (typeof value === 'boolean') {
        return value ? 'OUI' : 'NON';
    }
    
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    
    return value;
}

/**
 * Formater une valeur PDF
 * 
 * @private
 */
function formatPDFValue(value) {
    if (value === null || value === undefined) {
        return '';
    }
    
    if (value instanceof Date) {
        return value.toLocaleDateString('fr-FR');
    }
    
    if (typeof value === 'boolean') {
        return value ? '✓' : '✗';
    }
    
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    
    return String(value);
}

/**
 * Formater une valeur HTML
 * 
 * @private
 */
function formatHTMLValue(value) {
    if (value === null || value === undefined) {
        return '';
    }
    
    if (value instanceof Date) {
        return value.toLocaleDateString('fr-FR');
    }
    
    if (typeof value === 'boolean') {
        return value ? '✓' : '✗';
    }
    
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    
    if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
    }
    
    return String(value);
}

// ========================================
// 8. HELPERS DE TÉLÉCHARGEMENT
// ========================================

/**
 * Forcer le téléchargement d'un fichier
 * 
 * @param {string|Blob} content - Contenu du fichier
 * @param {string} filename - Nom du fichier
 * @param {string} [mimeType] - Type MIME
 * 
 * @example
 * downloadFile('Hello World', 'test.txt', 'text/plain');
 */
export function downloadFile(content, filename, mimeType = 'application/octet-stream') {
    try {
        // Créer le blob
        const blob = content instanceof Blob 
            ? content 
            : new Blob([content], { type: mimeType });
        
        // Créer l'URL
        const url = URL.createObjectURL(blob);
        
        // Créer le lien de téléchargement
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        // Ajouter au DOM et cliquer
        document.body.appendChild(link);
        link.click();
        
        // Nettoyer
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
        
    } catch (error) {
        console.error('❌ Erreur téléchargement:', error);
        throw error;
    }
}

/**
 * Ouvrir la boîte de dialogue d'impression
 * 
 * @private
 */
function openPrintDialog(htmlContent, title) {
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
        console.error('❌ Impossible d\'ouvrir la fenêtre d\'impression');
        return;
    }
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
    }, 250);
}

// ========================================
// 9. FONCTIONS PRIVÉES
// ========================================

/**
 * Préparer les colonnes pour l'export
 * 
 * @private
 */
function prepareColumns(columnsConfig, sampleData) {
    // Si config fournie
    if (columnsConfig) {
        if (Array.isArray(columnsConfig)) {
            // Array simple : utiliser comme clés et labels
            const columns = {};
            columnsConfig.forEach(col => {
                columns[col] = col;
            });
            return columns;
        }
        return columnsConfig;
    }
    
    // Auto-detect depuis les données
    if (!sampleData) {
        return {};
    }
    
    const columns = {};
    Object.keys(sampleData).forEach(key => {
        // Formatter le label (camelCase → Title Case)
        const label = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
        columns[key] = label;
    });
    
    return columns;
}

/**
 * Récupérer une valeur imbriquée
 * 
 * @private
 * @example
 * getNestedValue({a: {b: {c: 1}}}, 'a.b.c') // 1
 */
function getNestedValue(obj, path) {
    if (!obj || !path) return null;
    
    // Si pas de point, accès direct
    if (!path.includes('.')) {
        return obj[path];
    }
    
    // Parcourir le chemin
    const parts = path.split('.');
    let value = obj;
    
    for (const part of parts) {
        if (value === null || value === undefined) {
            return null;
        }
        value = value[part];
    }
    
    return value;
}

/**
 * Grouper les données par une colonne
 * 
 * @private
 */
function groupDataBy(data, groupKey) {
    const grouped = [];
    const groups = {};
    
    // Grouper
    data.forEach(item => {
        const key = getNestedValue(item, groupKey) || 'Sans groupe';
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
    });
    
    // Aplatir avec séparateurs
    Object.entries(groups).forEach(([groupName, items]) => {
        // Ajouter un séparateur
        grouped.push({ [groupKey]: `=== ${groupName} ===` });
        // Ajouter les items
        grouped.push(...items);
        // Ligne vide
        grouped.push({});
    });
    
    return grouped;
}

/**
 * Trier les clés d'un objet récursivement
 * 
 * @private
 */
function sortObjectKeys(obj) {
    if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys);
    }
    
    if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj)
            .sort()
            .reduce((result, key) => {
                result[key] = sortObjectKeys(obj[key]);
                return result;
            }, {});
    }
    
    return obj;
}

/**
 * Formater une date
 * 
 * @private
 */
function formatDate(date, format) {
    if (!date) return '';
    
    const d = date instanceof Date ? date : new Date(date);
    
    if (format === 'DD/MM/YYYY') {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }
    
    return d.toLocaleDateString('fr-FR');
}

/**
 * Formater un nombre
 * 
 * @private
 */
function formatNumber(value, format) {
    if (format === 'fr-FR') {
        return value.toLocaleString('fr-FR');
    }
    return value.toString();
}

/**
 * Échapper HTML
 * 
 * @private
 */
function escapeHTML(str) {
    if (!str) return '';
    
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

/**
 * Nettoyer un nom de feuille Excel
 * 
 * @private
 */
function sanitizeSheetName(name) {
    // Caractères interdits dans Excel
    let clean = name.replace(/[\\\/\*\?\[\]:]/g, '_');
    
    // Limiter la longueur
    if (clean.length > CONFIG.EXCEL.maxSheetNameLength) {
        clean = clean.substring(0, CONFIG.EXCEL.maxSheetNameLength);
    }
    
    return clean;
}

/**
 * Obtenir les styles HTML pour l'export
 * 
 * @private
 */
function getHTMLStyles() {
    return `
    <style>
        @media print {
            body { margin: 0; }
            h1 { page-break-after: avoid; }
            table { page-break-inside: avoid; }
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            padding: 20px;
            color: #333;
        }
        
        h1 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        
        .export-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        .export-table th {
            background-color: #3498db;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            border: 1px solid #2980b9;
        }
        
        .export-table td {
            padding: 10px;
            border: 1px solid #ddd;
        }
        
        .export-table tbody tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        .export-table tbody tr:hover {
            background-color: #e3f2fd;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
    </style>`;
}

/**
 * Obtenir le footer HTML
 * 
 * @private
 */
function getHTMLFooter() {
    const now = new Date();
    return `
    <div class="footer">
        <p>Document généré le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')}</p>
        <p>© ${now.getFullYear()} - Export automatique</p>
    </div>`;
}

// ========================================
// 10. EXPORT
// ========================================

/**
 * Export par défaut
 */
export default {
    // Exports principaux
    exportCSV,
    exportExcel,
    exportPDF,
    exportJSON,
    exportHTML,
    
    // Utilitaires
    createCSVContent,
    downloadFile,
    
    // Configuration
    CONFIG,
    
    // Helpers pour tests
    escapeCSVValue,
    formatCSVValue,
    getNestedValue
};

/* ========================================
   FIN DU FICHIER
   ======================================== */