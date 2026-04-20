(function() {
    const user = getUser();
    const username = user.username;
    const userId = user.id;

    if (!userId || !username) {
        window.location.href = '/auth';
        return;
    }

    function loadUserGreeting() {
        const greetingDiv = document.getElementById('userGreeting');
        if (greetingDiv) {
            greetingDiv.innerHTML = `${escapeHtml(username)} <a href="/logout">Выйти</a>`;
        }
    }

    function showAdminNav() {
        const nav = document.querySelector('nav ul');
        if (user.isAdmin && nav) {
            const adminLi = document.createElement('li');
            adminLi.innerHTML = '<a href="/admin">Админ Панель</a>';
            nav.appendChild(adminLi);
        }
    }

    loadUserGreeting();
    showAdminNav();
})();