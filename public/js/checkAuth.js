async function updateAdminStatus() {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    try {
        const response = await fetch('/api/auth/me', {
            headers: { 'user-id': userId }
        });
        if (response.ok) {
            const user = await response.json();
            const wasAdmin = localStorage.getItem('is_admin') === 'true';
            const isNowAdmin = user.is_admin === true;

            localStorage.setItem('is_admin', user.is_admin);
            
            if (wasAdmin !== isNowAdmin) {
                location.reload();
            }
        }
    } catch (err) {
        console.error('Ошибка проверки прав:', err);
    }
}

updateAdminStatus();