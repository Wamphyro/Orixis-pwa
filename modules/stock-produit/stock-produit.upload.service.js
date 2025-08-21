// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                     STOCK-PRODUIT.UPLOAD.SERVICE.JS                        ║
// ║                      Service Import/Analyse CSV                            ║
// ╠════════════════════════════════════════════════════════════════════════════╣
// ║ Module: Import CSV avec détection automatique colonnes                     ║
// ║ Version: 1.0.0                                                             ║
// ║ Date: 03/02/2025                                                           ║
// ╚════════════════════════════════════════════════════════════════════════════╝

// ╔════════════════════════════════════════╗
// ║     SECTION 1: CONFIGURATION           ║
// ╚════════════════════════════════════════╝

const CONFIG = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['text/csv', 'application/vnd.ms-excel', 'text/plain'],
    allowedExtensions: ['.csv', '.txt', '.tsv'],
    
    // ─── MAPPING COLONNES CSV → FIREBASE ───
    COLUMN_MAPPINGS: {
        // CSV → Firebase
        marque: ['marque', 'brand', 'fabricant'],
        libelle: ['libelle', 'libellé', 'description', 'nom'],
        numeroSerie: ['numero_de_serie', 'num_serie', 'n_serie', 'serie', 'serial'],
        magasin: ['centre', 'magasin', 'lieu', 'site'],
        statut: ['etat', 'état', 'statut', 'status'],
        quantite: ['qte', 'quantite', 'quantité', 'qty', 'stock'],
        client: ['client', 'customer', 'destinataire'],
        fournisseur: ['fournisseur', 'supplier', 'vendor']
    }
};

// ╔════════════════════════════════════════╗
// ║   SECTION 2: SERVICE UPLOAD            ║
// ╚════════════════════════════════════════╝

class StockProduitUploadService {
    
    // ┌────────────────────────────────────────┐
    // │      ANALYSE FICHIER CSV               │
    // └────────────────────────────────────────┘
    
    async analyserCSV(file) {
        try {
            console.log('📊 Analyse du fichier:', file.name);
            console.log('📁 Taille du fichier:', file.size, 'octets');
            
            // ─── Validation fichier ───
            this.validateFile(file);
            
            // ─── Lecture avec détection encoding ───
            const content = await this.readFileWithEncoding(file);
            
            // ─── Parsing lignes ───
            let lines = content.split(/\r?\n/).filter(line => line.trim());
            if (lines.length === 0) {
                throw new Error('Fichier vide');
            }
            
            console.log(`📋 Nombre total de lignes: ${lines.length}`);
            console.log('🔍 Premières lignes du fichier:');
            lines.slice(0, 5).forEach((line, i) => {
                console.log(`  Ligne ${i}: "${line.substring(0, 100)}..."`);
            });
            
            // ─── RECHERCHE LIGNE DE COLONNES ───
            let headerLineIndex = -1;
            let headerLine = '';
            let separator = ';';
            
            // Mots-clés typiques pour identifier la ligne de colonnes
            const headerKeywords = [
                'marque', 'libelle', 'numero', 'serie', 'centre', 
                'etat', 'qte', 'quantite', 'client', 'magasin'
            ];
            
            for (let i = 0; i < Math.min(lines.length, 20); i++) {
                const line = lines[i].toLowerCase();
                
                // ─── Ignorer lignes d'en-tête de rapport ───
                if (line.includes('date') && line.includes('edition')) continue;
                if (line.includes('page') || line.includes('rapport')) continue;
                if (line.length < 10) continue;
                
                // ─── Compter mots-clés présents ───
                const keywordCount = headerKeywords.filter(kw => line.includes(kw)).length;
                
                // Si au moins 2 mots-clés → ligne de colonnes
                if (keywordCount >= 2) {
                    headerLineIndex = i;
                    headerLine = lines[i];
                    console.log(`✅ Ligne de colonnes trouvée à l'index ${i}: "${headerLine.substring(0, 100)}..."`);
                    break;
                }
                
                // ─── Alternative: ligne avec séparateurs ───
                const sepCount = (line.match(/[;,\t|]/g) || []).length;
                if (sepCount >= 3 && !line.includes('date') && !line.includes('edition')) {
                    headerLineIndex = i;
                    headerLine = lines[i];
                    console.log(`✅ Ligne avec séparateurs trouvée à l'index ${i}: "${headerLine.substring(0, 100)}..."`);
                    break;
                }
            }
            
            // ─── Vérification ligne colonnes trouvée ───
            if (headerLineIndex === -1) {
                console.error('❌ Impossible de trouver la ligne de colonnes dans le fichier');
                console.log('💡 Conseil: Assurez-vous que votre fichier contient une ligne avec les noms de colonnes');
                console.log('   Exemple: Marque;Libelle;Numero de serie;Centre;Etat;Qte;Client...');
                
                console.log('📄 Contenu complet (premières 500 caractères):');
                console.log(content.substring(0, 500));
                
                throw new Error('Format de fichier non reconnu. Impossible de trouver les colonnes.');
            }
            
            // ─── Détection séparateur ───
            separator = this.detectSeparator(headerLine);
            console.log('📌 Séparateur détecté:', separator === '\t' ? 'TAB' : `"${separator}"`);
            
            // ─── Détection mapping colonnes ───
            const columnMapping = this.detectColumns(headerLine, separator);
            console.log('🗺️ Mapping colonnes:', columnMapping);
            
            // ─── Vérification colonnes essentielles ───
            if (!columnMapping.hasEssentialColumns) {
                console.error('❌ Colonnes détectées:', columnMapping.headers);
                console.error('❌ Mapping trouvé:', columnMapping.mapping);
                
                const suggestion = `
                    ⚠️ Le fichier CSV doit contenir au minimum :
                    - Libellé ou Numéro de série
                    - Centre (magasin)
                    - État (statut)
                    
                    Colonnes détectées dans votre fichier : ${columnMapping.headers.join(', ')}
                `;
                
                throw new Error('Colonnes essentielles manquantes. ' + suggestion);
            }
            
            // ─── PARSING DES DONNÉES ───
            const articles = [];
            const errors = [];
            
            for (let i = headerLineIndex + 1; i < lines.length; i++) {
                const line = lines[i];
                if (!line.trim()) continue;
                
                // ─── Ignorer lignes de pied de page ───
                if (line.toLowerCase().includes('total') || 
                    line.toLowerCase().includes('page') ||
                    line.toLowerCase().includes('fin')) {
                    continue;
                }
                
                try {
                    const article = this.parseArticle(line, separator, columnMapping.mapping);
                    if (article) {
                        articles.push(article);
                    }
                } catch (error) {
                    errors.push({
                        ligne: i + 1,
                        erreur: error.message,
                        contenu: line.substring(0, 100)
                    });
                    console.warn(`⚠️ Ligne ${i + 1} ignorée:`, error.message);
                }
            }
            
            console.log(`✅ ${articles.length} articles extraits`);
            
            // ─── Calcul statistiques ───
            const stats = this.calculateStats(articles);
            
            // ─── Extraction numéro ACM ───
            const numeroACM = this.extractNumeroACM(file.name);
            
            return {
                articles,
                stats,
                errors,
                mapping: columnMapping,
                separator,
                numeroACM
            };
            
        } catch (error) {
            console.error('❌ Erreur analyse CSV:', error);
            throw new Error(`Erreur analyse CSV: ${error.message}`);
        }
    }
    
    // ┌────────────────────────────────────────┐
    // │      VALIDATION FICHIER                │
    // └────────────────────────────────────────┘
    
    validateFile(file) {
        // ─── Vérification taille ───
        if (file.size > CONFIG.maxFileSize) {
            const sizeMB = (CONFIG.maxFileSize / 1024 / 1024).toFixed(0);
            throw new Error(`Fichier trop volumineux (max ${sizeMB}MB)`);
        }
        
        // ─── Vérification type ───
        const extension = '.' + this.getFileExtension(file.name);
        const typeValide = CONFIG.allowedTypes.includes(file.type) || 
                          CONFIG.allowedExtensions.includes(extension.toLowerCase());
        
        if (!typeValide) {
            throw new Error(`Type de fichier non autorisé. Formats acceptés: CSV, TXT`);
        }
    }
    
    getFileExtension(filename) {
        const parts = filename.split('.');
        return parts.length > 1 ? parts.pop().toLowerCase() : 'csv';
    }
    
    // ┌────────────────────────────────────────┐
    // │      DÉTECTION SÉPARATEUR              │
    // └────────────────────────────────────────┘
    
    detectSeparator(content) {
        const firstLines = content.split(/\r?\n/).slice(0, 5).join('\n');
        const separators = [';', ',', '\t', '|'];
        let maxCount = 0;
        let bestSeparator = ';';
        let maxConsistency = 0;
        
        for (const sep of separators) {
            const regex = sep === '\t' ? /\t/g : new RegExp('\\' + sep, 'g');
            const lines = firstLines.split(/\r?\n/);
            const counts = [];
            
            // ─── Compter séparateur dans chaque ligne ───
            for (const line of lines) {
                if (line.trim()) {
                    const matches = line.match(regex);
                    counts.push(matches ? matches.length : 0);
                }
            }
            
            // ─── Vérifier cohérence ───
            if (counts.length > 0) {
                const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
                const consistency = counts.every(c => c === counts[0]) ? 1 : 0;
                
                // Préférer le séparateur avec plus de colonnes ET meilleure cohérence
                if (avgCount > maxCount || (avgCount === maxCount && consistency > maxConsistency)) {
                    maxCount = avgCount;
                    maxConsistency = consistency;
                    bestSeparator = sep;
                }
            }
        }
        
        console.log(`📌 Séparateur détecté: "${bestSeparator}" avec ${maxCount} colonnes`);
        return bestSeparator;
    }
    
    // ┌────────────────────────────────────────┐
    // │      DÉTECTION MAPPING COLONNES        │
    // └────────────────────────────────────────┘
    
    detectColumns(headerLine, separator) {
        const headers = headerLine.split(separator).map(h => 
            h.trim()
            .toLowerCase()
            .replace(/^["']|["']$/g, '')
            .replace(/^\uFEFF/, '')
            .replace(/[éèêë]/g, 'e')
            .replace(/[àâ]/g, 'a')
            .replace(/\s+/g, '_')
        );
        
        console.log('📋 Colonnes trouvées:', headers);
        
        const mapping = {};
        const foundColumns = [];
        
        headers.forEach((header, index) => {
            // ─── MAPPING SELON NOTRE STRUCTURE ───
            
            // Marque → marque
            if (header.includes('marque')) {
                mapping[index] = 'marque';
                foundColumns.push('marque');
            }
            // Libellé → libelle
            else if (header.includes('libell')) {
                mapping[index] = 'libelle';
                foundColumns.push('libelle');
            }
            // Numéro de série → numeroSerie
            else if (header.includes('serie') || header.includes('numero_de_serie')) {
                mapping[index] = 'numeroSerie';
                foundColumns.push('numeroSerie');
            }
            // Centre → magasin
            else if (header.includes('centre')) {
                mapping[index] = 'magasin';
                foundColumns.push('magasin');
            }
            // État → statut
            else if (header.includes('etat') || header === 'etat') {
                mapping[index] = 'statut';
                foundColumns.push('statut');
            }
            // Quantité → quantite
            else if (header.includes('qte') || header.includes('quantit')) {
                mapping[index] = 'quantite';
                foundColumns.push('quantite');
            }
            // Client → client
            else if (header.includes('client')) {
                mapping[index] = 'client';
                foundColumns.push('client');
            }
            // Fournisseur → fournisseur
            else if (header.includes('fournisseur')) {
                mapping[index] = 'fournisseur';
                foundColumns.push('fournisseur');
            }
        });
        
        console.log('✅ Mapping créé:', mapping);
        console.log('✅ Colonnes mappées:', foundColumns);
        
        return {
            mapping,
            headers,
            foundColumns,
            hasEssentialColumns: foundColumns.includes('libelle') || foundColumns.includes('numeroSerie'),
            isComplete: foundColumns.length >= 3
        };
    }
    
    // ┌────────────────────────────────────────┐
    // │      PARSING ARTICLE                   │
    // └────────────────────────────────────────┘
    
    parseArticle(line, separator, columnMapping) {
        const values = this.parseCSVLine(line, separator);
        
        const article = {};
        let hasData = false;
        
        for (const [index, field] of Object.entries(columnMapping)) {
            const value = values[parseInt(index)];
            if (value && value.trim()) {
                hasData = true;
                
                switch (field) {
                    case 'quantite':
                        article.quantite = this.parseNumber(value, true);
                        break;
                        
                    case 'marque':
                        article.marque = this.cleanString(value);
                        break;
                        
                    case 'libelle':
                        article.libelle = this.cleanString(value);
                        break;
                        
                    case 'numeroSerie':
                        article.numeroSerie = this.cleanString(value);
                        break;
                        
                    case 'magasin':
                        article.magasin = this.cleanString(value);
                        break;
                        
                    case 'client':
                        article.client = this.cleanString(value);
                        break;
                        
                    case 'fournisseur':
                        article.fournisseur = this.cleanString(value);
                        break;
                        
                    case 'statut':
                        article.statut = this.cleanString(value).toUpperCase();
                        break;
                        
                    default:
                        article[field] = this.cleanString(value);
                }
            }
        }
        
        // ─── Validation article ───
        if (!hasData || (!article.numeroSerie && !article.libelle)) {
            return null;
        }
        
        // ─── Génération numéro série si manquant ───
        if (!article.numeroSerie) {
            article.numeroSerie = `AUTO-${Date.now()}`;
        }
        
        // ─── Valeurs par défaut ───
        article.quantite = article.quantite || 0;
        article.statut = article.statut || 'STO';
        
        console.log('📦 Article parsé:', article);
        
        return article;
    }
    
    // ┌────────────────────────────────────────┐
    // │      PARSING LIGNE CSV                 │
    // └────────────────────────────────────────┘
    
    parseCSVLine(line, separator) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === separator && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current); // Dernière valeur
        
        return result.map(v => v.trim().replace(/^["']|["']$/g, ''));
    }
    
    // ┌────────────────────────────────────────┐
    // │      PARSING NOMBRES                   │
    // └────────────────────────────────────────┘
    
    parseNumber(value, isInteger = false) {
        if (!value || value === '') return 0;
        
        let cleaned = value.toString()
            .replace(/\s/g, '')
            .trim();
        
        // ─── Gérer nombres négatifs entre parenthèses ───
        if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
            cleaned = '-' + cleaned.slice(1, -1);
        }
        
        // ─── Format français (virgule comme décimale) ───
        if (cleaned.includes(',')) {
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        }
        
        const parsed = parseFloat(cleaned);
        if (isNaN(parsed)) return 0;
        
        return isInteger ? Math.round(parsed) : parsed;
    }
    
    parseMontant(value) {
        if (!value || value === '') return 0;
        
        let cleaned = value.toString()
            .replace(/\s/g, '')
            .replace(/[€$£]/g, '')
            .replace(/EUR|USD|GBP/gi, '')
            .trim();
        
        if (!cleaned) return 0;
        
        // ─── Format français ───
        if (cleaned.includes(',')) {
            const commaCount = (cleaned.match(/,/g) || []).length;
            const dotCount = (cleaned.match(/\./g) || []).length;
            
            if (commaCount === 1 && dotCount === 0) {
                cleaned = cleaned.replace(',', '.');
            } else if (dotCount > 0) {
                cleaned = cleaned.replace(/\./g, '').replace(',', '.');
            }
        }
        
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : Math.abs(parsed);
    }
    
    parseDate(value) {
        if (!value || value === '') return null;
        
        const cleaned = value.trim();
        
        // ─── Format DD/MM/YYYY ou DD-MM-YYYY ───
        const match = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
        if (match) {
            let [, day, month, year] = match;
            
            if (year.length === 2) {
                year = (parseInt(year) > 50 ? '19' : '20') + year;
            }
            
            const date = new Date(year, month - 1, day);
            if (date.getDate() == day && date.getMonth() == month - 1) {
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        }
        
        // ─── Format YYYY-MM-DD ───
        const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (isoMatch) {
            return cleaned;
        }
        
        return null;
    }
    
    // ┌────────────────────────────────────────┐
    // │      NETTOYAGE STRING                  │
    // └────────────────────────────────────────┘
    
    cleanString(value) {
        if (!value) return '';
        
        return value
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/^["']|["']$/g, '');
    }
    
    genererReferenceDepuisDesignation(designation) {
        const cleaned = designation
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .substring(0, 10);
        
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `AUTO-${cleaned}-${random}`;
    }
    
    // ┌────────────────────────────────────────┐
    // │      EXTRACTION NUMÉRO ACM             │
    // └────────────────────────────────────────┘
    
    extractNumeroACM(filename) {
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
        
        // ─── Si le nom est entièrement numérique ───
        if (/^\d+$/.test(nameWithoutExt)) {
            return nameWithoutExt;
        }
        
        // ─── Chercher un pattern numérique long ───
        const match = filename.match(/(\d{8,})/);
        if (match) {
            return match[1];
        }
        
        console.warn('⚠️ Impossible d\'extraire le numéro ACM du fichier:', filename);
        return null;
    }
    
    // ┌────────────────────────────────────────┐
    // │      LECTURE AVEC DÉTECTION ENCODING   │
    // └────────────────────────────────────────┘
    
    async readFileWithEncoding(file) {
        const encodings = ['utf-8', 'windows-1252', 'iso-8859-1'];
        
        for (const encoding of encodings) {
            try {
                const text = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = e => resolve(e.target.result);
                    reader.onerror = reject;
                    reader.readAsText(file, encoding);
                });
                
                // ─── Vérifier caractères de remplacement ───
                if (!text.includes('�') && !text.includes('ï¿½')) {
                    console.log(`✅ Encoding détecté: ${encoding}`);
                    return text;
                }
            } catch (error) {
                continue;
            }
        }
        
        // ─── Par défaut UTF-8 ───
        return await file.text();
    }
    
    // ┌────────────────────────────────────────┐
    // │      CALCUL STATISTIQUES               │
    // └────────────────────────────────────────┘
    
    calculateStats(articles) {
        const stats = {
            total: articles.length,
            quantiteTotale: 0,
            valeurStock: 0,
            valeurAchat: 0,
            margeGlobale: 0,
            articlesEnRupture: 0,
            articlesStockBas: 0,
            parStatut: {},
            parMarque: {}
        };
        
        articles.forEach(article => {
            const qte = article.quantite || 0;
            const pa = article.prixAchat || 0;
            const pv = article.prixVente || 0;
            
            stats.quantiteTotale += qte;
            stats.valeurStock += qte * pv;
            stats.valeurAchat += qte * pa;
            
            // ─── États stock ───
            if (qte <= 0) {
                stats.articlesEnRupture++;
            } else if (qte <= (article.quantiteMin || 0)) {
                stats.articlesStockBas++;
            }
            
            // ─── Par statut ───
            const statut = article.statut || 'STO';
            if (!stats.parStatut[statut]) {
                stats.parStatut[statut] = {
                    nombre: 0,
                    quantite: 0
                };
            }
            stats.parStatut[statut].nombre++;
            stats.parStatut[statut].quantite += qte;
            
            // ─── Par marque ───
            if (article.marque) {
                const marque = article.marque;
                if (!stats.parMarque[marque]) {
                    stats.parMarque[marque] = {
                        nombre: 0,
                        quantite: 0
                    };
                }
                stats.parMarque[marque].nombre++;
                stats.parMarque[marque].quantite += qte;
            }
        });
        
        // ─── Marge globale ───
        stats.margeGlobale = stats.valeurStock - stats.valeurAchat;
        
        return stats;
    }
}

// ╔════════════════════════════════════════╗
// ║      SECTION 3: EXPORT SINGLETON       ║
// ╚════════════════════════════════════════╝

const service = new StockProduitUploadService();
export default service;