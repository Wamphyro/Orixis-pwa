// operations-bancaires.import.service.js
// Service d'import CSV/Excel ultra-flexible pour opérations bancaires

const OperationsBancairesImportService = {
  
  // Configuration des formats bancaires connus
  BANK_FORMATS: {
    'CREDIT_MUTUEL': {
      name: 'Crédit Mutuel',
      separator: ';',
      encoding: 'windows-1252',
      dateFormat: 'DD/MM/YYYY',
      headers: {
        date: ['Date'],
        dateValeur: ['Date de valeur'],
        debit: ['Débit'],
        credit: ['Crédit'],
        libelle: ['Libellé'],
        solde: ['Solde']
      },
      skipLines: 0,
      hasQuotes: false,
      // Pattern pour extraire le numéro de compte du nom de fichier
      accountPattern: /^(\d{11})\.csv$/i
    },
    'CREDIT_AGRICOLE': {
      name: 'Crédit Agricole',
      separator: ';',
      encoding: 'windows-1252',
      dateFormat: 'DD/MM/YYYY',
      headers: {
        date: ['Date'],
        dateValeur: ['Date de valeur'],
        debit: ['Débit'],
        credit: ['Crédit'],
        libelle: ['Libellé'],
        solde: ['Solde']
      },
      skipLines: 0,
      hasQuotes: false
    },
    'BNP_PARIBAS': {
      name: 'BNP Paribas',
      separator: ';',
      encoding: 'utf-8',
      dateFormat: 'DD/MM/YYYY',
      headers: {
        date: ['Date opération', 'Date'],
        dateValeur: ['Date valeur'],
        libelle: ['Libellé', 'Description'],
        montant: ['Montant'],
        devise: ['Devise']
      },
      skipLines: 0,
      hasQuotes: true
    },
    'SOCIETE_GENERALE': {
      name: 'Société Générale',
      separator: '\t',
      encoding: 'utf-8',
      dateFormat: 'DD/MM/YYYY',
      headers: {
        date: ['Date'],
        libelle: ['Description'],
        debit: ['Débit euros'],
        credit: ['Crédit euros']
      },
      skipLines: 1,
      hasQuotes: false
    },
    'CIC': {
      name: 'CIC',
      separator: ';',
      encoding: 'windows-1252',
      dateFormat: 'DD/MM/YYYY',
      headers: {
        date: ['Date'],
        dateValeur: ['Date de valeur'],
        libelle: ['Libellé'],
        debit: ['Débit EUR'],
        credit: ['Crédit EUR']
      },
      skipLines: 0,
      hasQuotes: true
    },
    'CAISSE_EPARGNE': {
      name: 'Caisse d\'Épargne',
      separator: ';',
      encoding: 'utf-8',
      dateFormat: 'DD/MM/YYYY',
      headers: {
        date: ['Date'],
        libelle: ['Libellé opération'],
        reference: ['Numéro opération'],
        debit: ['Montant débit'],
        credit: ['Montant crédit']
      },
      skipLines: 0,
      hasQuotes: true
    }
  },

  // Mapping universel des colonnes (tous les noms possibles)
  COLUMN_MAPPING: {
    date: [
      'Date', 'Date opération', 'Date operation', 'Date d\'opération',
      'Date comptable', 'Date de comptabilisation', 'Date compta',
      'Transaction Date', 'Booking Date', 'Date transaction'
    ],
    dateValeur: [
      'Date de valeur', 'Date valeur', 'Date val', 'Value Date',
      'Date d\'effet', 'Date effective'
    ],
    libelle: [
      'Libellé', 'Libelle', 'Description', 'Intitulé', 'Motif',
      'Objet', 'Communication', 'Label', 'Transaction Description',
      'Détails', 'Details', 'Narrative'
    ],
    montant: [
      'Montant', 'Amount', 'Somme', 'Total', 'Valeur'
    ],
    debit: [
      'Débit', 'Debit', 'Débit EUR', 'Débit €', 'Montant débit',
      'Withdrawal', 'Retrait', 'Sortie', 'Dépense'
    ],
    credit: [
      'Crédit', 'Credit', 'Crédit EUR', 'Crédit €', 'Montant crédit',
      'Deposit', 'Dépôt', 'Entrée', 'Recette'
    ],
    solde: [
      'Solde', 'Balance', 'Solde final', 'Nouveau solde',
      'Solde après opération', 'Running Balance'
    ],
    reference: [
      'Référence', 'Reference', 'Réf', 'Ref', 'N° opération',
      'Numéro', 'Transaction ID', 'ID', 'Code'
    ],
    devise: [
      'Devise', 'Currency', 'Monnaie', 'EUR', 'USD'
    ],
    type: [
      'Type', 'Type opération', 'Category', 'Catégorie',
      'Nature', 'Transaction Type'
    ]
  },

  /**
   * Point d'entrée principal pour importer un fichier
   */
  async importFile(file) {
    try {
      console.log(`📁 Import du fichier: ${file.name}`);
      
      // Détecter le numéro de compte depuis le nom du fichier
      const accountInfo = this.detectAccountFromFilename(file.name);
      if (accountInfo) {
        console.log(`💳 Compte détecté: ${accountInfo.accountNumber} (${accountInfo.maskedNumber})`);
      }
      
      // Déterminer le type de fichier
      const extension = file.name.split('.').pop().toLowerCase();
      
      let result;
      if (extension === 'csv' || extension === 'txt') {
        result = await this.importCSV(file);
      } else if (extension === 'xlsx' || extension === 'xls') {
        result = await this.importExcel(file);
      } else {
        throw new Error(`Format non supporté: ${extension}`);
      }
      
      // Ajouter les infos du compte au résultat
      if (accountInfo) {
        result.accountInfo = accountInfo;
        // Ajouter le numéro de compte à chaque opération
        result.operations = result.operations.map(op => ({
          ...op,
          accountNumber: accountInfo.accountNumber,
          accountName: accountInfo.accountName
        }));
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erreur import:', error);
      throw error;
    }
  },
  
  /**
   * Détecter le numéro de compte depuis le nom du fichier
   */
  detectAccountFromFilename(filename) {
    // Enlever l'extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    // Pattern pour détecter un numéro de compte (11 chiffres typiquement)
    const accountPattern = /^(\d{11})$/;
    const match = nameWithoutExt.match(accountPattern);
    
    if (match) {
      const accountNumber = match[1];
      return {
        accountNumber: accountNumber,
        // Masquer le numéro pour l'affichage (garder les 4 derniers chiffres)
        maskedNumber: '•••••••' + accountNumber.slice(-4),
        // Nom du compte (peut être personnalisé plus tard)
        accountName: `Compte ${accountNumber.slice(-4)}`,
        // Banque détectée (peut être affiné avec d'autres indices)
        bank: 'Crédit Mutuel'
      };
    }
    
    // Autres patterns possibles (RIB, IBAN partiel, etc.)
    const ribPattern = /(\d{5})\s*(\d{5})\s*(\d{11})\s*(\d{2})/;
    const ribMatch = nameWithoutExt.match(ribPattern);
    
    if (ribMatch) {
      const [, banque, guichet, compte, cle] = ribMatch;
      return {
        accountNumber: compte,
        maskedNumber: '•••••••' + compte.slice(-4),
        accountName: `Compte ${compte.slice(-4)}`,
        bank: this.detectBankFromCode(banque),
        rib: { banque, guichet, compte, cle }
      };
    }
    
    return null;
  },
  
  /**
   * Détecter la banque depuis le code banque
   */
  detectBankFromCode(codeBanque) {
    // Codes banques français courants
    const bankCodes = {
      '10278': 'Crédit Mutuel',
      '30002': 'Crédit Lyonnais (LCL)',
      '30003': 'Société Générale',
      '30004': 'BNP Paribas',
      '20041': 'La Banque Postale',
      '11306': 'Caisse d\'Épargne',
      '10107': 'CIC',
      '18306': 'Crédit Agricole',
      // Ajouter d'autres codes au besoin
    };
    
    return bankCodes[codeBanque] || 'Banque inconnue';
  },

  /**
   * Import d'un fichier CSV avec détection automatique du format
   */
  async importCSV(file) {
    // Lire le contenu du fichier
    const text = await this.readFileWithEncoding(file);
    
    // Détecter le format automatiquement
    const format = this.detectCSVFormat(text);
    console.log(`🏦 Format détecté: ${format?.name || 'Format personnalisé'}`);
    
    // Parser le CSV
    const rows = this.parseCSV(text, format);
    
    // Normaliser les données
    const operations = this.normalizeOperations(rows, format);
    
    // Analyser les statistiques
    const stats = this.analyzeOperations(operations);
    
    return {
      operations,
      stats,
      format: format?.name || 'Inconnu',
      filename: file.name
    };
  },

  /**
   * Lecture du fichier avec gestion de l'encoding
   */
  async readFileWithEncoding(file, encodings = ['utf-8', 'windows-1252', 'iso-8859-1']) {
    for (const encoding of encodings) {
      try {
        const reader = new FileReader();
        const text = await new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsText(file, encoding);
        });
        
        // Vérifier si le texte semble correct (pas de caractères bizarres)
        if (!text.includes('�') && !text.includes('???')) {
          console.log(`✅ Encoding détecté: ${encoding}`);
          return text;
        }
      } catch (error) {
        continue;
      }
    }
    
    // Fallback: lire en UTF-8 par défaut
    return await file.text();
  },

  /**
   * Détection automatique du format bancaire
   */
  detectCSVFormat(text) {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return null;
    
    // Analyser les premières lignes pour trouver les headers
    let headerLine = '';
    let headerLineIndex = 0;
    
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('date') || line.includes('libellé') || line.includes('montant')) {
        headerLine = lines[i];
        headerLineIndex = i;
        break;
      }
    }
    
    if (!headerLine) {
      headerLine = lines[0];
    }
    
    // Détecter le séparateur
    const separator = this.detectSeparator(headerLine);
    
    // Comparer avec les formats connus
    for (const [key, format] of Object.entries(this.BANK_FORMATS)) {
      let score = 0;
      
      // Vérifier le séparateur
      if (format.separator === separator) score += 2;
      
      // Vérifier les headers
      const headers = headerLine.toLowerCase().split(separator);
      for (const [field, possibleNames] of Object.entries(format.headers)) {
        if (possibleNames.some(name => headers.includes(name.toLowerCase()))) {
          score += 1;
        }
      }
      
      // Si score suffisant, on a trouvé le format
      if (score >= 3) {
        return { ...format, detectedHeaderLine: headerLineIndex };
      }
    }
    
    // Format non reconnu, créer un format générique
    return this.createGenericFormat(headerLine, separator, headerLineIndex);
  },

  /**
   * Détection du séparateur CSV
   */
  detectSeparator(line) {
    const separators = [';', ',', '\t', '|'];
    let maxCount = 0;
    let bestSeparator = ';';
    
    for (const sep of separators) {
      const count = (line.match(new RegExp(sep, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        bestSeparator = sep;
      }
    }
    
    return bestSeparator;
  },

  /**
   * Créer un format générique basé sur l'analyse
   */
  createGenericFormat(headerLine, separator, headerLineIndex) {
    const headers = headerLine.split(separator).map(h => h.trim().replace(/"/g, ''));
    const format = {
      name: 'Format personnalisé',
      separator: separator,
      encoding: 'utf-8',
      dateFormat: 'DD/MM/YYYY',
      headers: {},
      skipLines: headerLineIndex,
      hasQuotes: headerLine.includes('"')
    };
    
    // Mapper automatiquement les colonnes
    headers.forEach((header, index) => {
      const headerLower = header.toLowerCase();
      
      for (const [field, possibleNames] of Object.entries(this.COLUMN_MAPPING)) {
        if (possibleNames.some(name => headerLower.includes(name.toLowerCase()))) {
          if (!format.headers[field]) {
            format.headers[field] = [];
          }
          format.headers[field].push(header);
          break;
        }
      }
    });
    
    return format;
  },

  /**
   * Parser le CSV en lignes
   */
  parseCSV(text, format) {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    const separator = format?.separator || ';';
    const skipLines = format?.skipLines || format?.detectedHeaderLine || 0;
    
    // Extraire les headers
    const headerLine = lines[skipLines];
    const headers = this.parseCSVLine(headerLine, separator, format?.hasQuotes);
    
    // Parser les données
    const rows = [];
    for (let i = skipLines + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = this.parseCSVLine(line, separator, format?.hasQuotes);
      
      // Créer un objet avec les headers comme clés
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      rows.push(row);
    }
    
    return rows;
  },

  /**
   * Parser une ligne CSV en gérant les guillemets
   */
  parseCSVLine(line, separator = ';', hasQuotes = true) {
    if (!hasQuotes) {
      return line.split(separator).map(v => v.trim());
    }
    
    // Gestion des guillemets (peut contenir des séparateurs)
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === separator && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values;
  },

  /**
   * Normaliser les opérations bancaires
   */
  normalizeOperations(rows, format) {
    return rows.map((row, index) => {
      try {
        // Extraire les valeurs selon le mapping
        const getValue = (field) => {
          if (!format?.headers?.[field]) return null;
          
          for (const headerName of format.headers[field]) {
            if (row[headerName]) {
              return row[headerName];
            }
          }
          
          // Fallback: chercher dans tous les mappings possibles
          for (const possibleName of this.COLUMN_MAPPING[field] || []) {
            const key = Object.keys(row).find(k => 
              k.toLowerCase() === possibleName.toLowerCase()
            );
            if (key && row[key]) {
              return row[key];
            }
          }
          
          return null;
        };
        
        // Récupérer les montants
        let montant = 0;
        let type = 'inconnu';
        
        const montantValue = getValue('montant');
        const debitValue = getValue('debit');
        const creditValue = getValue('credit');
        
        if (debitValue) {
          montant = -Math.abs(this.parseMontant(debitValue));
          type = 'debit';
        } else if (creditValue) {
          montant = Math.abs(this.parseMontant(creditValue));
          type = 'credit';
        } else if (montantValue) {
          montant = this.parseMontant(montantValue);
          type = montant >= 0 ? 'credit' : 'debit';
        }
        
        // Créer l'opération normalisée
        return {
          date: this.parseDate(getValue('date'), format?.dateFormat),
          dateValeur: this.parseDate(getValue('dateValeur'), format?.dateFormat) || 
                      this.parseDate(getValue('date'), format?.dateFormat),
          libelle: this.cleanLibelle(getValue('libelle')),
          montant: montant,
          type: type,
          reference: getValue('reference'),
          solde: this.parseMontant(getValue('solde')),
          devise: getValue('devise') || 'EUR',
          categorie: this.autoDetectCategorie(getValue('libelle')),
          raw: row // Garder les données brutes
        };
      } catch (error) {
        console.error(`Erreur ligne ${index + 1}:`, error);
        return null;
      }
    }).filter(op => op !== null);
  },

  /**
   * Parser un montant avec gestion des formats
   */
  parseMontant(value) {
    if (!value) return 0;
    
    // Nettoyer la valeur
    let cleaned = value.toString()
      .replace(/\s/g, '')      // Enlever espaces
      .replace(/[€$£]/g, '')   // Enlever symboles monétaires
      .replace(/EUR|USD|GBP/gi, '') // Enlever codes devises
      .trim();
    
    // Gérer les formats internationaux
    // Format français: 1.234,56 → 1234.56
    // Format anglais: 1,234.56 → 1234.56
    
    // Compter les virgules et points
    const commaCount = (cleaned.match(/,/g) || []).length;
    const dotCount = (cleaned.match(/\./g) || []).length;
    
    if (commaCount === 1 && dotCount === 0) {
      // Format français simple: 1234,56
      cleaned = cleaned.replace(',', '.');
    } else if (commaCount === 0 && dotCount === 1) {
      // Format anglais simple: 1234.56 (déjà bon)
    } else if (commaCount > 0 && dotCount > 0) {
      // Format avec séparateurs de milliers
      const lastComma = cleaned.lastIndexOf(',');
      const lastDot = cleaned.lastIndexOf('.');
      
      if (lastComma > lastDot) {
        // Format français: 1.234,56
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else {
        // Format anglais: 1,234.56
        cleaned = cleaned.replace(/,/g, '');
      }
    } else if (commaCount > 1) {
      // Plusieurs virgules = format anglais avec milliers
      cleaned = cleaned.replace(/,/g, '');
    } else if (dotCount > 1) {
      // Plusieurs points = format français avec milliers  
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
    
    // Parser le nombre final
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  },

  /**
   * Parser une date avec formats multiples
   */
  parseDate(value, format = 'DD/MM/YYYY') {
    if (!value) return null;
    
    const cleaned = value.toString().trim();
    
    // Formats supportés
    const patterns = [
      // Format français
      { regex: /^(\d{2})\/(\d{2})\/(\d{4})$/, format: 'DD/MM/YYYY' },
      { regex: /^(\d{2})-(\d{2})-(\d{4})$/, format: 'DD-MM-YYYY' },
      { regex: /^(\d{2})\.(\d{2})\.(\d{4})$/, format: 'DD.MM.YYYY' },
      // Format ISO
      { regex: /^(\d{4})-(\d{2})-(\d{2})$/, format: 'YYYY-MM-DD' },
      // Format américain
      { regex: /^(\d{2})\/(\d{2})\/(\d{4})$/, format: 'MM/DD/YYYY' },
      // Format court
      { regex: /^(\d{2})\/(\d{2})\/(\d{2})$/, format: 'DD/MM/YY' }
    ];
    
    for (const pattern of patterns) {
      const match = cleaned.match(pattern.regex);
      if (match) {
        let day, month, year;
        
        if (pattern.format.startsWith('DD')) {
          [, day, month, year] = match;
        } else if (pattern.format.startsWith('MM')) {
          [, month, day, year] = match;
        } else if (pattern.format.startsWith('YYYY')) {
          [, year, month, day] = match;
        }
        
        // Gérer les années sur 2 chiffres
        if (year && year.length === 2) {
          year = parseInt(year) > 50 ? '19' + year : '20' + year;
        }
        
        // Créer la date au format ISO
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    // Essayer de parser avec Date native
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    console.warn(`Date non reconnue: ${value}`);
    return null;
  },

  /**
   * Nettoyer le libellé
   */
  cleanLibelle(value) {
    if (!value) return '';
    
    return value
      .replace(/\s+/g, ' ')        // Normaliser espaces
      .replace(/\*+/g, '')         // Enlever les *
      .replace(/\s*-\s*$/, '')     // Enlever tiret final
      .trim();
  },

  /**
   * Auto-détection de la catégorie
   */
  autoDetectCategorie(libelle) {
    if (!libelle) return 'Autre';
    
    const libelleUpper = libelle.toUpperCase();
    
    // Règles de catégorisation
    const rules = [
      { pattern: /SALAIRE|PAIE|VIREMENT\s+EMPLOYEUR/, categorie: 'Salaires' },
      { pattern: /CPAM|SECU|SECURITE\s+SOCIALE|REMBT\s+SS/, categorie: 'Remboursement Sécu' },
      { pattern: /MUTUELLE|MMA|ALMERYS|VIAMEDIS|HARMONIE|OCIANE|MATMUT|MGEN|CETIP/, categorie: 'Remboursement Mutuelle' },
      { pattern: /IMPOT|IMPOTS|DGFIP|TRESOR\s+PUBLIC|TAXES/, categorie: 'Impôts' },
      { pattern: /EDF|GDF|ENGIE|GAZ|ELECTRICITE/, categorie: 'Énergie' },
      { pattern: /ORANGE|SFR|BOUYGUES|FREE|TELEPHONE|MOBILE/, categorie: 'Télécom' },
      { pattern: /ASSURANCE|MAIF|MACIF|AXA|ALLIANZ/, categorie: 'Assurances' },
      { pattern: /CARREFOUR|LECLERC|AUCHAN|LIDL|INTERMARCHE|COURSES/, categorie: 'Alimentation' },
      { pattern: /ESSENCE|CARBURANT|TOTAL|SHELL|ESSO/, categorie: 'Carburant' },
      { pattern: /RESTAURANT|RESTO|BRASSERIE|CAFE/, categorie: 'Restaurant' },
      { pattern: /AMAZON|FNAC|CDISCOUNT|EBAY/, categorie: 'E-commerce' },
      { pattern: /CREDIT\s+IMMOBILIER|PRET\s+HABITAT|EMPRUNT/, categorie: 'Crédit immobilier' },
      { pattern: /LOYER|LOCATION|BAIL/, categorie: 'Loyer' },
      { pattern: /PHARMACIE|DOCTEUR|MEDECIN|SANTE/, categorie: 'Santé' },
      { pattern: /RETRAIT|DAB|DISTRIBUTEUR/, categorie: 'Retrait espèces' },
      { pattern: /CB\s+\d{4}|CARTE\s+BANCAIRE/, categorie: 'Carte bancaire' },
      { pattern: /VIREMENT|VIR\s+/, categorie: 'Virement' },
      { pattern: /CHEQUE|CHQ/, categorie: 'Chèque' },
      { pattern: /FRAIS|COMMISSION|AGIOS/, categorie: 'Frais bancaires' },
      { pattern: /NETFLIX|SPOTIFY|DEEZER|CANAL|DISNEY/, categorie: 'Abonnements' }
    ];
    
    for (const rule of rules) {
      if (rule.pattern.test(libelleUpper)) {
        return rule.categorie;
      }
    }
    
    return 'Autre';
  },

  /**
   * Analyser les opérations pour générer des statistiques
   */
  analyzeOperations(operations) {
    const stats = {
      total: operations.length,
      credits: 0,
      debits: 0,
      montantCredits: 0,
      montantDebits: 0,
      balance: 0,
      categories: {},
      periodes: {
        debut: null,
        fin: null,
        jours: 0
      }
    };
    
    operations.forEach(op => {
      // Compter par type
      if (op.type === 'credit') {
        stats.credits++;
        stats.montantCredits += op.montant;
      } else if (op.type === 'debit') {
        stats.debits++;
        stats.montantDebits += Math.abs(op.montant);
      }
      
      // Balance
      stats.balance += op.montant;
      
      // Catégories
      const cat = op.categorie || 'Autre';
      if (!stats.categories[cat]) {
        stats.categories[cat] = { nombre: 0, montant: 0 };
      }
      stats.categories[cat].nombre++;
      stats.categories[cat].montant += op.montant;
      
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
    
    // Calculer le nombre de jours
    if (stats.periodes.debut && stats.periodes.fin) {
      const debut = new Date(stats.periodes.debut);
      const fin = new Date(stats.periodes.fin);
      stats.periodes.jours = Math.ceil((fin - debut) / (1000 * 60 * 60 * 24));
    }
    
    return stats;
  },

  /**
   * Import Excel (nécessite SheetJS)
   */
  async importExcel(file) {
    // Vérifier que SheetJS est chargé
    if (typeof XLSX === 'undefined') {
      throw new Error('SheetJS non chargé. Ajoutez <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>');
    }
    
    // Lire le fichier
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    
    // Prendre la première feuille
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
    
    if (jsonData.length === 0) {
      throw new Error('Fichier Excel vide');
    }
    
    // Convertir en format CSV-like
    const headers = jsonData[0];
    const rows = [];
    
    for (let i = 1; i < jsonData.length; i++) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = jsonData[i][index] || '';
      });
      rows.push(row);
    }
    
    // Détecter le format
    const headerLine = headers.join(';');
    const format = this.createGenericFormat(headerLine, ';', 0);
    
    // Normaliser les opérations
    const operations = this.normalizeOperations(rows, format);
    
    // Analyser les statistiques
    const stats = this.analyzeOperations(operations);
    
    return {
      operations,
      stats,
      format: 'Excel',
      filename: file.name
    };
  },

  /**
   * Exporter les opérations en CSV
   */
  exportToCSV(operations, filename = 'operations_export.csv') {
    const headers = [
      'Date', 'Date valeur', 'Libellé', 'Montant', 'Type',
      'Catégorie', 'Référence', 'Solde'
    ];
    
    const rows = [headers];
    
    operations.forEach(op => {
      rows.push([
        op.date || '',
        op.dateValeur || '',
        op.libelle || '',
        op.montant.toFixed(2).replace('.', ','),
        op.type || '',
        op.categorie || '',
        op.reference || '',
        op.solde ? op.solde.toFixed(2).replace('.', ',') : ''
      ]);
    });
    
    // Créer le CSV
    const csv = rows.map(row => 
      row.map(cell => `"${cell}"`).join(';')
    ).join('\n');
    
    // Télécharger
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }
};

// Export du service
export default OperationsBancairesImportService;