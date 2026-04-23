(function () {
    const user = getUser();

    if (!user.isAdmin) {
        alert('Доступ запрещён');
        window.location.href = '/';
        return;
    }

    document.getElementById('adminUserInfo').innerHTML = `${escapeHtml(user.username)} <a href="/logout.html">Выйти</a>`;

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
            if (tabId === 'users') window.loadUsers?.();
            if (tabId === 'proposals') window.loadProposals?.();
        });
    });

    if (typeof loadVariants === 'function') loadVariants();
})();