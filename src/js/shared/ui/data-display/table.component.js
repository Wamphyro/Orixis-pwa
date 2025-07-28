const TableComponent = (() => {
    function create(options) {
        const container = document.createElement('div');
        container.className = 'ui-table-container';
        container.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        `;
        
        // Créer un tableau simple
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        
        // Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        options.columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col.label;
            th.style.cssText = 'padding: 12px; text-align: left; border-bottom: 2px solid #e0e0e0;';
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Body
        const tbody = document.createElement('tbody');
        options.data.forEach(row => {
            const tr = document.createElement('tr');
            options.columns.forEach(col => {
                const td = document.createElement('td');
                td.textContent = row[col.key] || '';
                td.style.cssText = 'padding: 12px; border-bottom: 1px solid #f0f0f0;';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        
        container.appendChild(table);
        
        return {
            getElement: () => container
        };
    }
    
    return { create };
})();

export default TableComponent;