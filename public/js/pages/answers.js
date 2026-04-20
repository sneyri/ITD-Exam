(function () {
    if (!requireAuth()) return;

    const userId = getUser().id;

    async function loadResults() {
        const container = document.getElementById('resultsContainer');
        if (!container) return;

        showLoading(container);

        try {
            const results = await getJSON(`/api/exam/my-results?user_id=${userId}`);

            if (results.length === 0) {
                container.innerHTML = '<div class="no-results">У вас пока нет результатов. Пройдите экзамен.</div>';
                return;
            }

            let html = `
                <table class="results-table">
                    <thead>
                        <tr>
                            <th>Вариант</th>
                            <th colspan="2">Баллы</th>
                            <th>Дата сдачи</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            for (const r of results) {
                const score = r.score !== undefined ? r.score : '—';
                const maxScore = r.max_score !== undefined ? r.max_score : '—';
                const variantTitle = r.variant_title || 'Без названия';

                html += `
                    <tr>
                        <td>${escapeHtml(variantTitle)}</div>
                        <td colspan="2" style="text-align: center; font-weight: 600;">${score} / ${maxScore}</td>
                        <td>${formatDate(r.created_at)}</td>
                    </tr>
                `;
            }

            html += `</tbody></table>`;
            container.innerHTML = html;
        } catch (err) {
            showError(container, 'Ошибка загрузки результатов');
        }
    }

    loadResults();
})();