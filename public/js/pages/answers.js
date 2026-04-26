(function () {
    async function loadResults() {
        const container = document.getElementById('resultsContainer');
        if (!container) return;

        showLoading(container);

        try {
            const results = await getJSON(`/api/exam/my-results?user_id=${1}`);

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
                const deleteName = 'Вариант удален('
                const variantTitle = r.variant_title || deleteName;

                if (variantTitle != deleteName) {
                    html += `
                    <tr data-id="${r.id}" class="result-row">
                        <td>${escapeHtml(variantTitle)}</div>
                        <td colspan="2" style="text-align: center; font-weight: 600;">${score} / ${maxScore}</div>
                        <td>${formatDate(r.created_at)}</div>
                    </tr>
                    `;
                } else {
                    html += `
                    <tr data-id="${r.id}" class="result-row">
                        <td>${escapeHtml(deleteName)}</div>
                        <td colspan="2" style="text-align: center; font-weight: 600;">${score} / ${maxScore}</div>
                        <td>${formatDate(r.created_at)}</div>
                    </tr>
                    `;
                }
            }

            html += `</tbody></div>`;
            container.innerHTML = html;

            document.querySelectorAll('.result-row').forEach(row => {
                row.addEventListener('click', () => {
                    const attemptId = row.getAttribute('data-id');
                    window.location.href = `/result-details?attempt_id=${attemptId}`;
                });
            });
        } catch (err) {
            showError(container, 'Ошибка загрузки результатов');
        }
    }

    loadResults();
})();