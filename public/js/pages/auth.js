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
    const verificationError = document.getElementById('verification-error');

    let currentUsername = '';

    loginButton.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        errorDiv.innerHTML = '';
        accountDiv.innerHTML = '';

        if (!username) {
            errorDiv.innerHTML = 'Введите никнейм';
            return;
        }

        if (username === currentUsername) return;

        loginButton.textContent = 'Проверяю...';
        loginButton.disabled = true;

        try {
            const data = await postJSON('/api/auth/itd/check', { username });

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
                <div class="itd-username">
                    <div class="avatar">${escapeHtml(data.data.avatar)}</div>
                    <div class="info">
                        <span class="name">${escapeHtml(data.data.displayName || data.data.username)}</span>
                        <span class="nick">@${escapeHtml(data.data.username)}</span>
                    </div>
                </div>
                <button id="submit-account">Это я (клянусь)</button>
            `;

            document.getElementById('submit-account').onclick = async () => {
                await startVerification(username);
            };

        } catch (err) {
            errorDiv.innerHTML = err.message;
        } finally {
            loginButton.textContent = 'Найти';
            loginButton.disabled = false;
        }
    });

    async function startVerification(username) {
        authForm.style.display = 'none';
        verificationDiv.style.display = 'block';
        verificationError.innerHTML = '';

        try {
            const data = await postJSON('/api/auth/itd/generateCode', { username });

            if (data.error) {
                verificationError.innerHTML = data.message;
                return;
            }

            document.getElementById('secret-code-label').textContent = data.verifCode;
        } catch (err) {
            verificationError.innerHTML = err.message;
        }
    }

    loginSubmit.addEventListener('click', async () => {
        const password = passwordInput.value;
        passwordError.innerHTML = '';

        if (!password) {
            passwordError.innerHTML = 'Введите пароль';
            return;
        }

        loginSubmit.disabled = true;
        loginSubmit.textContent = 'Входим...';

        try {
            const data = await postJSON('/api/auth/itd/login', { username: currentUsername, password });

            if (data.success) {
                window.location.href = '/';
            } else {
                passwordError.innerHTML = data.message || 'Неверный пароль';
            }
        } catch (err) {
            passwordError.innerHTML = err.message;
        } finally {
            loginSubmit.disabled = false;
            loginSubmit.textContent = 'Войти';
        }
    });

    checkButton.addEventListener('click', async () => {
        checkButton.disabled = true;
        checkButton.textContent = 'Проверка...';
        verificationError.innerHTML = '';

        try {
            const data = await postJSON('/api/auth/itd/verify', { username: currentUsername });

            if (data.verifed) {
                verificationDiv.innerHTML = `
                    <h2>Придумайте пароль</h2>
                    <p>Важно! Через этот пароль вы будете входить в аккаунт. Не показывайте его никому и не забудьте.</p>
                    <input type="password" id="new-password" placeholder="Пароль (мин. 4 символа)">
                    <button id="finish-registration">Завершить регистрацию</button>
                    <div id="reg-error" class="error-message"></div>
                `;

                document.getElementById('finish-registration').onclick = async () => {
                    const password = document.getElementById('new-password').value;
                    const regError = document.getElementById('reg-error');

                    if (!password || password.length < 4) {
                        regError.innerHTML = 'Пароль должен быть не менее 4 символов';
                        return;
                    }

                    try {
                        const regData = await postJSON('/api/auth/itd/register', { username: currentUsername, password });

                        if (regData.success) {
                            window.location.href = '/';
                        } else {
                            regError.innerHTML = regData.message || 'Ошибка регистрации';
                        }
                    } catch (err) {
                        regError.innerHTML = err.message;
                    }
                };
            } else {
                verificationError.innerHTML = data.message || 'Пост не найден';
                checkButton.disabled = false;
                checkButton.textContent = 'Я опубликовал(а) пост';
            }
        } catch (err) {
            verificationError.innerHTML = err.message;
            checkButton.disabled = false;
            checkButton.textContent = 'Я опубликовал(а) пост';
        }
    });

    returnFromPassword.addEventListener('click', () => {
        passwordDiv.style.display = 'none';
        authForm.style.display = 'block';
        passwordError.innerHTML = '';
        passwordInput.value = '';
    });

    returnButton.addEventListener('click', () => {
        authForm.style.display = 'block';
        verificationDiv.style.display = 'none';
        verificationError.innerHTML = '';
    });
})();