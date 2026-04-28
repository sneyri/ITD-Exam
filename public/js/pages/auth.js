(function () {
    const authForm = document.getElementById('auth-form');
    const verificationDiv = document.getElementById('verification');
    const usernameInput = document.getElementById('username-input');
    const loginButton = document.getElementById('login-btn');
    const accountDiv = document.getElementById('account');
    const errorDiv = document.getElementById('login-error');
    const returnButton = document.getElementById('return-to-auth');
    const checkButton = document.getElementById('check-verification');
    const passwordDiv = document.getElementById('password');
    const passwordInput = document.getElementById('password-input');
    const loginSubmit = document.getElementById('login-submit');
    const returnFromPassword = document.getElementById('return-from-password');
    const passwordError = document.getElementById('password-error');

    let currentUsername = '';

    loginButton.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        errorDiv.innerHTML = '';
        accountDiv.innerHTML = '';

        if (!username) {
            errorDiv.innerHTML = 'Введите никнейм';
            return;
        }

        try {
            const response = await fetch('/api/auth/itd/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });

            const data = await response.json();

            if (!data.exists) {
                errorDiv.innerHTML = 'Пользователь не найден в ИТД';
                return;
            }

            if (data.registered) {
                currentUsername = username;
                authForm.style.display = 'none';
                passwordDiv.style.display = 'block';
                return;
            }

            currentUsername = username;

            accountDiv.innerHTML = `
                <div style="margin-top: 20px; text-align: center;">
                    <p><strong>${escapeHtml(data.data.displayName) + escapeHtml(data.data.avatar)}</strong></p>
                    <button id="submit-account">Это я (клянусь)</button>
                </div>
            `;

            document.getElementById('submit-account').onclick = async () => {
                await startVerification(username);
            };

        } catch (err) {
            errorDiv.innerHTML = 'Ошибка соединения с сервером';
        }
    });

    async function startVerification(username) {
        authForm.style.display = 'none';
        verificationDiv.style.display = 'block';

        try {
            const response = await fetch('/api/auth/itd/generateCode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });

            const data = await response.json();

            if (data.error) {
                document.getElementById('verification-error').innerHTML = data.message;
                return;
            }

            document.getElementById('secret-code-label').textContent = data.verifCode;
        } catch (err) {
            document.getElementById('verification-error').innerHTML = 'Ошибка генерации кода';
        }
    }
    loginSubmit.addEventListener('click', async () => {
        const password = passwordInput.value;

        const response = await fetch('/api/auth/itd/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentUsername, password })
        });

        const data = await response.json();

        if (data.success) {
            window.location.href = '/';
        } else {
            passwordError.innerHTML = data.message || 'Неверный пароль';
        }
    });

    checkButton.addEventListener('click', async () => {
        checkButton.disabled = true;
        checkButton.textContent = 'Проверка...';

        try {
            const response = await fetch('/api/auth/itd/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUsername })
            });

            const data = await response.json();

            if (data.verifed) {
                verificationDiv.innerHTML = `
                <h2>Придумайте пароль</h2>
                <p>Важно! Через этот пароль вы будете входить в акаунт. Не показывайте его никому и не забудьте. Если вы все таки забыли то напишите</p>
                <input type="password" id="new-password" placeholder="Пароль">
                <button id="finish-registration">Завершить регистрацию</button>
                <div id="reg-error" class="error-message"></div>
            `;

                document.getElementById('finish-registration').onclick = async () => {
                    const password = document.getElementById('new-password').value;

                    const regResponse = await fetch('/api/auth/itd/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: currentUsername, password })
                    });

                    const regData = await regResponse.json();

                    if (regData.success) {
                        window.location.href = '/';
                    } else {
                        document.getElementById('reg-error').innerHTML = regData.message || 'Ошибка регистрации';
                    }
                };
            } else {
                document.getElementById('verification-error').innerHTML = data.message || 'Пост не найден';
                checkButton.disabled = false;
                checkButton.textContent = 'Я опубликовал(а) пост';
            }
        } catch (err) {
            document.getElementById('verification-error').innerHTML = 'Ошибка проверки';
            checkButton.disabled = false;
            checkButton.textContent = 'Я опубликовал(а) пост';
        }
    });

    returnFromPassword.addEventListener('click', () => {
        passwordDiv.style.display = 'none';
        authForm.style.display = 'block';
    });

    returnButton.addEventListener('click', () => {
        authForm.style.display = 'block';
        verificationDiv.style.display = 'none';
    });
})();