// ========================================
// OPERATIONS-BANCAIRES.UPLOAD.SERVICE.JS - 📁 SERVICE UPLOAD/IMPORT
// Chemin: modules/operations-bancaires/operations-bancaires.upload.service.js
//
// DESCRIPTION:
// Service d'import et analyse des fichiers CSV bancaires
// Détection automatique du format bancaire
// Support multi-banques
//
// VERSION: 2.0.0
// DATE: 03/02/2025
// ========================================

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['text/csv', 'application/vnd.ms-excel'],
    allowedExtensions: ['.csv', '.txt'],
    
    // Formats bancaires supportés
    BANK_FORMATS: {
        CREDIT_MUTUEL: {
            name: 'Crédit Mutuel',
            separator: ';',
            encoding: 'windows-1252',
            dateFormat: 'DD/MM/YYYY',
            columns: {
                0: 'date',
                1: 'dateValeur',
                2: 'debit',
                3: 'credit',
                4: 'libelle',
                5: 'solde'
            },
            skipLines: 0,
            hasHeader: true
        },
        BNP_PARIBAS: {
            name: 'BNP Paribas',
            separator: ';',
            encoding: 'utf-8',
            dateFormat: 'DD/MM/YYYY',
            columns: {
                0: 'date',
                1: 'libelle',
                2: 'montant',
                3: 'devise'
            },
            skipLines: 1,
            hasHeader: true
        },
        SOCIETE_GENERALE: {
            name: 'Société Générale',
            separator: '\t',
            encoding: 'utf-8',
            dateFormat: 'DD/MM/YYYY',
            columns: {
                0: 'date',
                1: 'libelle',
                2: 'debit',
                3: 'credit'
            },
            skipLines: 1,
            hasHeader: true
        }
    }
};

// ========================================
// SERVICE UPLOAD
// ========================================

class OperationsBancairesUploadService {
    
    /**
     * Analyser un fichier CSV
     */
async analyserCSV(file) {
    try {
        console.log('📊 Analyse du fichier:', file.name);
        
        // Valider le fichier
        this.validateFile(file);
        
        // Lire le contenu avec le bon encoding
        const content = await this.readFileWithEncoding(file);
        
        // Détecter le format bancaire
        const format = this.detectBankFormat(content);
        console.log('🏦 Format détecté:', format.name);
        
        // Parser les lignes
        const lines = content.split(/\r?\n/).filter(line => line.trim());
        
        // Ignorer les lignes d'en-tête si nécessaire
        const startIndex = format.skipLines + (format.hasHeader ? 1 : 0);
        
        // Parser chaque opération
        const operations = [];
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;
            
            try {
                const operation = this.parseOperation(line, format);
                operations.push(operation);
            } catch (error) {
                console.warn(`⚠️ Ligne ${i + 1} ignorée:`, error.message);
            }
        }
        
        // Calculer les statistiques
        const stats = this.calculateStats(operations);
        
        // Détecter le compte depuis le nom du fichier
        const accountInfo = this.detectAccountFromFilename(file.name);
        if (accountInfo) {
            operations.forEach(op => {
                op.compte = accountInfo.accountNumber;
                op.banque = accountInfo.bank;
            });
        }
        
        return {
            operations,
            stats,
            format: format.name,
            accountInfo
        };
        
    } catch (error) {
        console.error('❌ Erreur analyse CSV:', error);
        throw new Error(`Erreur analyse CSV: ${error.message}`);
    }
}

extractNumeroACM(filename) {
    // Format : 00020500601.csv ou autre pattern numérique
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    // Si le nom est entièrement numérique
    if (/^\d+$/.test(nameWithoutExt)) {
        return nameWithoutExt;
    }
    
    // Essayer de trouver un pattern numérique dans le nom
    const match = filename.match(/(\d{8,})/);
    if (match) {
        return match[1];
    }
    
    console.warn('⚠️ Impossible d\'extraire le numéro ACM du fichier:', filename);
    return null;
}
    
    /**
     * Valider un fichier
     */
    validateFile(file) {
        // Vérifier la taille
        if (file.size > CONFIG.maxFileSize) {
            const sizeMB = (CONFIG.maxFileSize / 1024 / 1024).toFixed(0);
            throw new Error(`Fichier trop volumineux (max ${sizeMB}MB)`);
        }
        
        // Vérifier le type
        const extension = '.' + this.getFileExtension(file.name);
        const typeValide = CONFIG.allowedTypes.includes(file.type) || 
                          CONFIG.allowedExtensions.includes(extension.toLowerCase());
        
        if (!typeValide) {
            throw new Error(`Type de fichier non autorisé. Formats acceptés: CSV`);
        }
    }
    
    /**
     * Obtenir l'extension d'un fichier
     */
    getFileExtension(filename) {
        const parts = filename.split('.');
        return parts.length > 1 ? parts.pop().toLowerCase() : 'csv';
    }
    
    /**
     * Détecter le format bancaire
     */
    detectBankFormat(text) {
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length === 0) {
            throw new Error('Fichier vide');
        }
        
        const firstLine = lines[0];
        const separator = this.detectSeparator(firstLine);
        const columnCount = firstLine.split(separator).length;
        
        // Identifier le format par le nombre de colonnes
        if (columnCount === 6 && separator === ';') {
            return CONFIG.BANK_FORMATS.CREDIT_MUTUEL;
        } else if (columnCount === 4 && separator === ';') {
            return CONFIG.BANK_FORMATS.BNP_PARIBAS;
        } else if (separator === '\t') {
            return CONFIG.BANK_FORMATS.SOCIETE_GENERALE;
        }
        
        // Format par défaut
        return this.createCustomFormat(firstLine, separator);
    }
    
    /**
     * Créer un format personnalisé
     */
    createCustomFormat(headerLine, separator) {
        const headers = headerLine.split(separator).map(h => h.trim().toLowerCase());
        const columns = {};
        
        headers.forEach((header, index) => {
            if (header.includes('date') && !header.includes('valeur')) {
                columns[index] = 'date';
            } else if (header.includes('valeur')) {
                columns[index] = 'dateValeur';
            } else if (header.includes('débit') || header.includes('debit')) {
                columns[index] = 'debit';
            } else if (header.includes('crédit') || header.includes('credit')) {
                columns[index] = 'credit';
            } else if (header.includes('libellé') || header.includes('libelle')) {
                columns[index] = 'libelle';
            } else if (header.includes('solde')) {
                columns[index] = 'solde';
            } else if (header.includes('montant')) {
                columns[index] = 'montant';
            }
        });
        
        return {
            name: 'Format personnalisé',
            separator: separator,
            encoding: 'utf-8',
            dateFormat: 'DD/MM/YYYY',
            columns: columns,
            skipLines: 0,
            hasHeader: true
        };
    }
    
    /**
     * Détecter le séparateur
     */
    detectSeparator(line) {
        const separators = [';', ',', '\t', '|'];
        let maxCount = 0;
        let bestSeparator = ';';
        
        for (const sep of separators) {
            const count = (line.match(new RegExp('\\' + sep, 'g')) || []).length;
            if (count > maxCount) {
                maxCount = count;
                bestSeparator = sep;
            }
        }
        
        return bestSeparator;
    }
    
    /**
     * Parser une opération
     */
    parseOperation(line, format) {
        const values = line.split(format.separator).map(v => v.trim());
        
        const getValue = (fieldName) => {
            for (const [index, field] of Object.entries(format.columns)) {
                if (field === fieldName) {
                    return values[parseInt(index)] || '';
                }
            }
            return '';
        };
        
        // Parser les montants
        let montant = 0;
        const debitStr = getValue('debit');
        const creditStr = getValue('credit');
        const montantStr = getValue('montant');
        
        if (debitStr) {
            montant = -Math.abs(this.parseMontant(debitStr));
        } else if (creditStr) {
            montant = Math.abs(this.parseMontant(creditStr));
        } else if (montantStr) {
            montant = this.parseMontant(montantStr);
        }
        
        // Parser les dates
        const dateStr = getValue('date');
        const date = this.parseDate(dateStr, format.dateFormat);
        
        if (!date) {
            throw new Error(`Date invalide: ${dateStr}`);
        }
        
        return {
            date: date,
            dateValeur: this.parseDate(getValue('dateValeur'), format.dateFormat) || date,
            libelle: this.cleanLibelle(getValue('libelle')),
            montant: montant,
            type: montant >= 0 ? 'credit' : 'debit',
            solde: this.parseMontant(getValue('solde')),
            devise: 'EUR',
            raw: line
        };
    }
    
    /**
     * Parser un montant
     */
    parseMontant(value) {
        if (!value || value === '') return 0;
        
        let cleaned = value.toString()
            .replace(/\s/g, '')
            .replace(/[€$£]/g, '')
            .replace(/EUR|USD|GBP/gi, '')
            .trim();
        
        if (!cleaned) return 0;
        
        // Format français
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
        return isNaN(parsed) ? 0 : parsed;
    }
    
    /**
     * Parser une date
     */
    parseDate(value, format = 'DD/MM/YYYY') {
        if (!value || value === '') return null;
        
        const cleaned = value.trim();
        const match = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
        
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
        
        return null;
    }
    
    /**
     * Nettoyer un libellé
     */
    cleanLibelle(value) {
        if (!value) return '';
        
        return value
            .replace(/\s+/g, ' ')
            .replace(/\*+/g, '')
            .trim();
    }
    
    /**
     * Détecter le compte depuis le nom de fichier
     */
    detectAccountFromFilename(filename) {
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
        
        // Pattern pour numéro de compte (11 chiffres)
        const match = nameWithoutExt.match(/(\d{11})/);
        if (match) {
            return {
                accountNumber: match[1],
                accountName: `Compte ${match[1].slice(-4)}`,
                bank: 'Crédit Mutuel'
            };
        }
        
        return null;
    }
    
    /**
     * Lire un fichier avec le bon encoding
     */
    async readFileWithEncoding(file) {
        const encodings = ['windows-1252', 'utf-8', 'iso-8859-1'];
        
        for (const encoding of encodings) {
            try {
                const text = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = e => resolve(e.target.result);
                    reader.onerror = reject;
                    reader.readAsText(file, encoding);
                });
                
                if (!text.includes('�')) {
                    console.log(`✅ Encoding: ${encoding}`);
                    return text;
                }
            } catch (error) {
                continue;
            }
        }
        
        return await file.text();
    }
    
    /**
     * Calculer les statistiques
     */
    calculateStats(operations) {
        const stats = {
            total: operations.length,
            credits: 0,
            debits: 0,
            montantCredits: 0,
            montantDebits: 0,
            balance: 0,
            periodes: {
                debut: null,
                fin: null,
                jours: 0
            }
        };
        
        operations.forEach(op => {
            if (op.type === 'credit' || op.montant > 0) {
                stats.credits++;
                stats.montantCredits += Math.abs(op.montant);
            } else {
                stats.debits++;
                stats.montantDebits += Math.abs(op.montant);
            }
            
            stats.balance += op.montant;
            
            // Période
            if (op.date) {
                if (!stats.periodes.debut || op.date < stats.periodes.debut) {
                    stats.periodes.debut = op.date;
                }
                if (!stats.periodes.fin || op.date > stats.periodes.fin) {
                    stats.periodes.fin = op.date;
                }
            }
        });
        
        // Calculer les jours
        if (stats.periodes.debut && stats.periodes.fin) {
            const debut = new Date(stats.periodes.debut);
            const fin = new Date(stats.periodes.fin);
            stats.periodes.jours = Math.ceil((fin - debut) / (1000 * 60 * 60 * 24)) + 1;
        }
        
        return stats;
    }
}

// ========================================
// EXPORT SINGLETON
// ========================================

const service = new OperationsBancairesUploadService();
export default service;