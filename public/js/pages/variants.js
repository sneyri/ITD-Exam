(function() {
    if (!requireAuth()) return;

    const userId = getUser().id;

    async function loadVariants() {
        const container = document.getElementById('variantsList');
        if (!container) return;

        showLoading(container);

        try {
            const variants = await getJSON('/api/variants');
            let completed = [];

            if (userId) {
                completed = await getJSON(`/api/exam/completed-variants?user_id=${userId}`);
            }

            if (variants.length === 0) {
                container.innerHTML = '<p>Пока нет доступных вариантов.</p>';
                return;
            }

            let html = '<div class="variants-grid">';
            for (const v of variants) {
                const isCompleted = completed.includes(v.id);
                html += `
                    <div class="variant-card">
                        <div><strong>${escapeHtml(v.title)}</strong></div>
                        <div>
                            ${!isCompleted
                                ? `<a href="/exam.html?variant_id=${v.id}" class="btn">Начать тест →</a>`
                                : `<button class="btn" disabled>Пройдено</button>`
                            }
                        </div>
                    </div>
                `;
            }
            html += '</div>';
            container.innerHTML = html;
        } catch (err) {
            showError(container, 'Ошибка загрузки вариантов');
        }
    }

    loadVariants();
})();