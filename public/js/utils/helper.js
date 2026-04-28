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

async function getJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Ошибка запроса' }));
        throw new Error(error.error || 'Ошибка запроса');
    }
    return response.json();
}

async function postJSON(url, data) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Ошибка запроса' }));
        throw new Error(error.error || 'Ошибка запроса');
    }
    return response.json();
}

async function putJSON(url, data) {
    const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Ошибка запроса' }));
        throw new Error(error.error || 'Ошибка запроса');
    }
    return response.json();
}

async function deleteRequest(url) {
    const response = await fetch(url, { method: 'DELETE' });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Ошибка запроса' }));
        throw new Error(error.error || 'Ошибка запроса');
    }
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

async function getJSON(url) {
    const response = await fetch(url);
    
    if (response.status === 429) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Слишком много запросов');
    }
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Ошибка запроса' }));
        throw new Error(error.error || 'Ошибка запроса');
    }
    return response.json();
}

async function postJSON(url, data) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    if (response.status === 429) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Слишком много запросов');
    }
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Ошибка запроса' }));
        throw new Error(error.error || 'Ошибка запроса');
    }
    return response.json();
}