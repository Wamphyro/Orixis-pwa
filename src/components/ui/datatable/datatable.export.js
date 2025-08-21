// ========================================
// DATATABLE.EXPORT.JS - Module d'export pour DataTable
// Chemin: src/js/shared/ui/datatable/datatable.export.js
// ========================================

export class DataTableExport {
    constructor(datatable) {
        this.datatable = datatable;
    }
    
    /**
     * Exporter les données
     */
    export(format) {
        const config = this.datatable.config.export;
        
        // Récupérer les données à exporter
        let dataToExport;
        
        if (this.datatable.state.selectedRows.size > 0) {
            // Exporter seulement les lignes sélectionnées
            dataToExport = this.datatable.getSelectedRows();
        } else {
            // Exporter toutes les données filtrées
            dataToExport = this.datatable.state.filteredData;
        }
        
        // Transformer les données si nécessaire
        if (config.onBeforeExport) {
            dataToExport = config.onBeforeExport(dataToExport);
        } else {
            // Transformation par défaut
            dataToExport = this.transformData(dataToExport);
        }
        
        // Exporter selon le format
        if (format === 'csv') {
            this.exportCSV(dataToExport);
        } else if (format === 'excel') {
            this.exportExcel(dataToExport);
        }
        
        // Callback
        if (this.datatable.config.onExport) {
            this.datatable.config.onExport(format, dataToExport);
        }
    }
    
    /**
     * Transformer les données pour l'export
     */
    transformData(data) {
        const columns = this.datatable.config.columns;
        
        return data.map(row => {
            const exportRow = {};
            
            columns.forEach(column => {
                // Ignorer les colonnes non exportables
                if (column.exportable === false) return;
                
                const value = this.datatable.getNestedValue(row, column.key);
                const label = column.exportLabel || column.label;
                
                // Formatter pour l'export
                if (column.exportFormatter) {
                    exportRow[label] = column.exportFormatter(value, row);
                } else if (column.formatter) {
                    // Utiliser le formatter d'affichage mais nettoyer le HTML
                    const formatted = column.formatter(value, row);
                    exportRow[label] = this.stripHtml(String(formatted));
                } else {
                    exportRow[label] = value;
                }
            });
            
            return exportRow;
        });
    }
    
    /**
     * Retirer le HTML d'une chaîne
     */
    stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }
    
    /**
     * Exporter en CSV
     */
    exportCSV(data) {
        if (data.length === 0) return;
        
        // En-têtes
        const headers = Object.keys(data[0]);
        let csv = headers.map(h => this.escapeCSV(h)).join(',') + '\n';
        
        // Données
        data.forEach(row => {
            const values = headers.map(h => this.escapeCSV(row[h]));
            csv += values.join(',') + '\n';
        });
        
        // Télécharger
        this.download(csv, 'text/csv', '.csv');
    }
    
    /**
     * Échapper les valeurs CSV
     */
    escapeCSV(value) {
        if (value === null || value === undefined) return '';
        
        const str = String(value);
        
        // Si contient des caractères spéciaux, entourer de guillemets
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        
        return str;
    }
    
    /**
     * Exporter en Excel (format simple)
     */
    exportExcel(data) {
        if (data.length === 0) return;
        
        // Créer un tableau HTML
        let html = '<table border="1">';
        
        // En-têtes
        html += '<thead><tr>';
        Object.keys(data[0]).forEach(key => {
            html += `<th>${this.escapeHtml(key)}</th>`;
        });
        html += '</tr></thead>';
        
        // Données
        html += '<tbody>';
        data.forEach(row => {
            html += '<tr>';
            Object.values(row).forEach(value => {
                html += `<td>${this.escapeHtml(value)}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table>';
        
        // Créer le fichier Excel
        const template = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" 
                  xmlns:x="urn:schemas-microsoft-com:office:excel"
                  xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="utf-8">
                <!--[if gte mso 9]>
                <xml>
                    <x:ExcelWorkbook>
                        <x:ExcelWorksheets>
                            <x:ExcelWorksheet>
                                <x:Name>Export</x:Name>
                                <x:WorksheetOptions>
                                    <x:DisplayGridlines/>
                                </x:WorksheetOptions>
                            </x:ExcelWorksheet>
                        </x:ExcelWorksheets>
                    </x:ExcelWorkbook>
                </xml>
                <![endif]-->
            </head>
            <body>${html}</body>
            </html>
        `;
        
        // Télécharger
        this.download(template, 'application/vnd.ms-excel', '.xls');
    }
    
    /**
     * Échapper le HTML
     */
    escapeHtml(value) {
        if (value === null || value === undefined) return '';
        
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        
        return String(value).replace(/[&<>"']/g, m => map[m]);
    }
    
    /**
     * Télécharger un fichier
     */
    download(content, mimeType, extension) {
        const filename = this.datatable.config.export.filename + '_' + 
                        new Date().toISOString().split('T')[0] + extension;
        
        const blob = new Blob(['\ufeff' + content], { type: mimeType + ';charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }
}