(function() {
    window.loadProposals = async function() {
        const container = document.getElementById('proposalsList');
        if (!container) return;
        
        showLoading(container);

        try {
            const proposals = await getJSON('/api/proposal'); 

            if (proposals.length === 0) {
                container.innerHTML = '<p>Предложений пока нет.</p>';
                return;
            }

            let html = `
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th style="width: 50px;">ID</th>
                            <th>Текст предложения</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            for (const item of proposals) {
                html += `
                    <tr>
                        <td>${item.id}</td>
                        <td class="proposal-text-cell">${escapeHtml(item.text)}</td>
                    </tr>
                `;
            }

            html += `</tbody></table>`;
            container.innerHTML = html;

        } catch (err) {
            console.error(err);
            showError(container, 'Ошибка загрузки предложений');
        }
    };
})();