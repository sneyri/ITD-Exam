(function () {
    async function loadVariants() {
        const container = document.getElementById('variantsList');
        if (!container) return;

        showLoading(container);

        try {
            const variants = await getJSON('/api/variants/active');
            const completed_variants = await getJSON('/api/exam/completed-variants');

            if (variants.length === 0) {
                container.innerHTML = '<p>Пока нет доступных вариантов.</p>';
                return;
            }

            let html = '<div class="variants-grid">';
            for (const v of variants) {
                const isCompleted = completed_variants.includes(v.id);

                html += `
                    <div class="variant-card ${isCompleted ? 'completed' : ''}">
                        <div><strong>${escapeHtml(v.title)}</strong></div>
                        <div>
                            ${isCompleted
                                ? `<span class="btn" disabled>Пройдено</span>`
                                : `<a href="/exam?variant_id=${v.id}" class="btn">Начать тест →</a>`
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