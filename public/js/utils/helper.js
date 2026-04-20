function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString();
}

function formatDateShort(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()} в ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function getUser() {
    return {
        id: localStorage.getItem('user_id'),
        username: localStorage.getItem('username'),
        isAdmin: localStorage.getItem('is_admin') === 'true'
    };
}

function isAuthenticated() {
    return !!localStorage.getItem('user_id');
}

function requireAuth(redirectUrl = '/auth.html') {
    if (!isAuthenticated()) {
        alert('Пожалуйста, войдите в аккаунт');
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}

function logout() {
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('is_admin');
    window.location.href = '/';
}

async function fetchWithAuth(url, options = {}) {
    const userId = localStorage.getItem('user_id');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (userId) {
        headers['user-id'] = userId;
    }
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    return response;
}

async function getJSON(url) {
    const response = await fetchWithAuth(url);
    return response.json();
}

async function postJSON(url, data) {
    const response = await fetchWithAuth(url, {
        method: 'POST',
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка запроса');
    }
    
    return response.json();
}

async function putJSON(url, data) {
    const response = await fetchWithAuth(url, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    return response.json();
}

async function deleteRequest(url) {
    const response = await fetchWithAuth(url, { method: 'DELETE' });
    return response.json();
}

function showLoading(element, text = 'Загрузка...') {
    if (element) {
        element.innerHTML = `<div class="loading">${text}</div>`;
    }
}

function showError(element, message) {
    if (element) {
        element.innerHTML = `<div class="error-message">❌ ${escapeHtml(message)}</div>`;
    }
}

function showSuccess(element, message) {
    if (element) {
        element.innerHTML = `<div class="success-message">✅ ${escapeHtml(message)}</div>`;
        setTimeout(() => {
            if (element.innerHTML.includes(message)) {
                element.innerHTML = '';
            }
        }, 3000);
    }
}

window.helpers = {
    escapeHtml,
    formatDate,
    formatDateShort,
    getUser,
    isAuthenticated,
    requireAuth,
    logout,
    fetchWithAuth,
    getJSON,
    postJSON,
    putJSON,
    deleteRequest,
    showLoading,
    showError,
    showSuccess
};