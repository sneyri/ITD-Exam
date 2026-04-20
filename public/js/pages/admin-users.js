(function() {
    window.loadUsers = async function(searchTerm = '') {
        const container = document.getElementById('usersList');
        if (!container) return;
        
        showLoading(container);

        try {
            let url = '/api/admin/users';
            if (searchTerm) {
                url += `?search=${encodeURIComponent(searchTerm)}`;
            }

            const users = await getJSON(url);

            let html = `
                <div class="search-bar">
                    <input type="text" id="userSearchInput" placeholder="Поиск по ID или нику..." value="${escapeHtml(searchTerm)}">
                    <button id="userSearchBtn" class="btn">Найти</button>
                    <button id="userResetBtn" class="btn">Сбросить</button>
                </div>
                <table class="admin-table">
                    <thead><tr><th>ID</th><th>Логин</th><th>Админ</th><th>Действия</th></tr></thead>
                    <tbody>
            `;

            for (const u of users) {
                html += `
                    <tr>
                        <td>${u.id}</td>
                        <td>${escapeHtml(u.username)}</td>
                        <td>${u.is_admin ? 'Да' : 'Нет'}</td>
                        <td>
                            ${!u.is_admin 
                                ? `<button class="make-admin" data-id="${u.id}">Сделать админом</button>` 
                                : `<button class="remove-admin" data-id="${u.id}">Снять админа</button>`
                            }
                        </td>
                    </tr>
                `;
            }
            html += `</tbody></table>`;
            container.innerHTML = html;

            document.getElementById('userSearchBtn')?.addEventListener('click', () => {
                const search = document.getElementById('userSearchInput').value;
                loadUsers(search);
            });

            document.getElementById('userResetBtn')?.addEventListener('click', () => {
                document.getElementById('userSearchInput').value = '';
                loadUsers('');
            });

            document.getElementById('userSearchInput')?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const search = document.getElementById('userSearchInput').value;
                    loadUsers(search);
                }
            });

            document.querySelectorAll('.make-admin').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    await postJSON(`/api/admin/users/${id}/make-admin`, {});
                    loadUsers(document.getElementById('userSearchInput')?.value || '');
                });
            });

            document.querySelectorAll('.remove-admin').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    await postJSON(`/api/admin/users/${id}/remove-admin`, {});
                    loadUsers(document.getElementById('userSearchInput')?.value || '');
                });
            });
        } catch (err) {
            showError(container, 'Ошибка загрузки пользователей');
        }
    };
})();