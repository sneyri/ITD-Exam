(function() {
    async function loadVariants() {
        const container = document.getElementById('variantsList');
        if (!container) return;

        showLoading(container);

        try {
            const variants = await getJSON('/api/variants/active');

            if (variants.length === 0) {
                container.innerHTML = '<p>Пока нет доступных вариантов.</p>';
                return;
            }

            let html = '<div class="variants-grid">';
            for (const v of variants) {
                html += `
                    <div class="variant-card">
                        <div><strong>${escapeHtml(v.title)}</strong></div>
                        <div>
                            <a href="/exam?variant_id=${v.id}" class="btn">Начать тест →</a>
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