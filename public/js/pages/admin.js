(function () {
    async function init() {
        const user = await checkAuth();
        const username = user?.username;

        const response = await fetch('/api/admin/checkAdmin', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username })
        });

        const data = await response.json();

        if (!data.isAdmin) {
            window.location.href = '/exam';
        }

        const tabs = document.querySelectorAll('.tab');
        const contents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                contents.forEach(c => c.classList.remove('active'));
                document.getElementById(`tab-${tabId}`).classList.add('active');

                if (tabId === 'variants') window.loadVariants?.();
            });
        });

        if (typeof loadVariants === 'function') loadVariants();
    }

    init();
})();