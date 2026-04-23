(function() {
    const tabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            if (tab.dataset.tab === 'login') {
                loginForm.classList.add('active');
                registerForm.classList.remove('active');
            } else {
                registerForm.classList.add('active');
                loginForm.classList.remove('active');
            }

            document.getElementById('login-error').textContent = '';
            document.getElementById('register-error').textContent = '';
            document.getElementById('register-success').textContent = '';
        });
    });

    document.getElementById('register-btn').addEventListener('click', async () => {
        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-confirm').value;
        const errorDiv = document.getElementById('register-error');
        const successDiv = document.getElementById('register-success');

        errorDiv.textContent = '';
        successDiv.textContent = '';

        if (!username || !password) {
            errorDiv.textContent = 'Заполните все поля';
            return;
        }
        if (password.length < 4) {
            errorDiv.textContent = 'Пароль должен быть не менее 4 символов';
            return;
        }
        if (password !== confirm) {
            errorDiv.textContent = 'Пароли не совпадают';
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                const loginResponse = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const loginData = await loginResponse.json();

                if (loginResponse.ok) {
                    localStorage.setItem('user_id', loginData.user.id);
                    localStorage.setItem('username', loginData.user.username);
                    localStorage.setItem('XjkfluhdadfjOqiu', loginData.user.is_admin);
                    window.location.href = '/';
                } else {
                    successDiv.textContent = 'Регистрация успешна! Теперь войдите.';
                    document.getElementById('register-username').value = '';
                    document.getElementById('register-password').value = '';
                    document.getElementById('register-confirm').value = '';
                    document.querySelector('.auth-tab[data-tab="login"]').click();
                }
            } else {
                errorDiv.textContent = data.error;
            }
        } catch (err) {
            errorDiv.textContent = 'Ошибка соединения с сервером';
        }
    });

    document.getElementById('login-btn').addEventListener('click', async () => {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const errorDiv = document.getElementById('login-error');

        errorDiv.textContent = '';

        if (!username || !password) {
            errorDiv.textContent = 'Заполните все поля';
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('user_id', data.user.id);
                localStorage.setItem('username', data.user.username);
                localStorage.setItem('XjkfluhdadfjOqiu', data.user.is_admin);
                window.location.href = '/';
            } else {
                errorDiv.textContent = data.error;
            }
        } catch (err) {
            errorDiv.textContent = 'Ошибка соединения с сервером';
        }
    });
})();