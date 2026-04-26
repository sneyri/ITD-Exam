let currentUser = null;

async function checkAuth() {
    try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
            window.location.href = '/auth';
            return null;
        }
        currentUser = await response.json();
        return currentUser;
    } catch (err) {
        window.location.href = '/auth';
        return null;
    }
}
checkAuth();

function getCurrentUser() {
    return currentUser;
}