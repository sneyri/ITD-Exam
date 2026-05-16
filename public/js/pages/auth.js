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
    let currentTurnstileWidget = null;

    function showCaptchaModal() {
        const modal = document.getElementById('captcha-modal');
        if (!modal) return;
        
        modal.style.display = 'flex';
        
        const container = document.getElementById('dynamic-turnstile');
        if (container && window.turnstile) {
            if (currentTurnstileWidget) {
                window.turnstile.remove(currentTurnstileWidget);
            }
            currentTurnstileWidget = window.turnstile.render(container, {
                sitekey: '0x4AAAAAADFsOLZQicyKue09'
            });
        }
        
        document.getElementById('captcha-error').innerHTML = '';
    }

    function hideCaptchaModal() {
        const modal = document.getElementById('captcha-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        if (currentTurnstileWidget && window.turnstile) {
            window.turnstile.remove(currentTurnstileWidget);
            currentTurnstileWidget = null;
        }
    }

    function showPasswordPrompt() {
        authForm.style.display = 'none';
        passwordDiv.style.display = 'block';
        passwordInput.value = '';
        passwordError.innerHTML = '';
    }

    function showRegistrationForm(userData) {
        accountDiv.innerHTML = `
            <div class="itd-username">
                <div class="avatar">${escapeHtml(userData.avatar)}</div>
                <div class="info">
                    <span class="name">${escapeHtml(userData.displayName || userData.username)}</span>
                    <span class="nick">@${escapeHtml(userData.username)}</span>
                </div>
            </div>
            <button id="submit-account">Это я (клянусь)</button>
        `;

        currentUsername = userData.username;

        document.getElementById('submit-account').onclick = async () => {
            await startVerification(currentUsername);
        };
    }

    loginButton.addEventListener('click', async () => {
        const username = usernameInput.value.trim();

        errorDiv.innerHTML = '';
        accountDiv.innerHTML = '';

        if (!username) {
            errorDiv.innerHTML = 'Введите никнейм';
            return;
        }

        loginButton.disabled = true;
        loginButton.textContent = 'Проверяю...';

        try {
            const response = await fetch('/api/auth/itd/check-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });

            const data = await response.json();

            if (response.status === 429) {
                errorDiv.innerHTML = data.error || 'Слишком много запросов';
                loginButton.disabled = false;
                loginButton.textContent = 'Найти';
                return;
            }

            if (!data.exists) {
                errorDiv.innerHTML = 'Пользователь не найден в ИТД';
                loginButton.disabled = false;
                loginButton.textContent = 'Найти';
                return;
            }

            currentUsername = username;

            if (data.registered) {
                showPasswordPrompt();
                loginButton.disabled = false;
                loginButton.textContent = 'Найти';
                return;
            }

            if (data.needCaptcha) {
                hideCaptchaModal();
                showCaptchaModal();
                
                const confirmBtn = document.getElementById('confirm-captcha-btn');
                const closeCaptchaBtn = document.getElementById('close-captcha-btn');
                
                const onConfirm = async () => {
                    const token = document.querySelector('#dynamic-turnstile [name="cf-turnstile-response"]')?.value;
                    
                    if (!token) {
                        document.getElementById('captcha-error').innerHTML = 'Пройдите проверку';
                        return;
                    }
                    
                    hideCaptchaModal();
                    
                    confirmBtn.removeEventListener('click', onConfirm);
                    closeCaptchaBtn.removeEventListener('click', onClose);
                    
                    loginButton.disabled = true;
                    loginButton.textContent = 'Проверяю...';
                    
                    try {
                        const verifyResponse = await fetch('/api/auth/itd/verify-captcha', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username, token })
                        });
                        
                        const verifyData = await verifyResponse.json();
                        
                        if (!verifyData.success) {
                            errorDiv.innerHTML = verifyData.error || 'Ошибка проверки';
                            loginButton.disabled = false;
                            loginButton.textContent = 'Найти';
                            return;
                        }
                        
                        if (verifyData.registered) {
                            showPasswordPrompt();
                        } else {
                            showRegistrationForm(verifyData.userData);
                        }
                        
                    } catch (err) {
                        errorDiv.innerHTML = 'Ошибка сервера';
                    } finally {
                        loginButton.disabled = false;
                        loginButton.textContent = 'Найти';
                    }
                };
                
                const onClose = () => {
                    hideCaptchaModal();
                    confirmBtn.removeEventListener('click', onConfirm);
                    closeCaptchaBtn.removeEventListener('click', onClose);
                    loginButton.disabled = false;
                    loginButton.textContent = 'Найти';
                };
                
                confirmBtn.addEventListener('click', onConfirm);
                closeCaptchaBtn.addEventListener('click', onClose);
            } else {
                showRegistrationForm(data.userData);
            }

        } catch (err) {
            errorDiv.innerHTML = `Ошибка: ${err.message}`;
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = 'Найти';
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

        if (!password) {
            passwordError.innerHTML = 'Введите пароль';
            return;
        }

        try {
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
        } catch (err) {
            passwordError.innerHTML = 'Ошибка соединения';
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
                    <p>Через этот пароль вы будете входить в аккаунт. Не показывайте его никому и не забудьте.</p>
                    <input type="password" id="new-password" placeholder="Пароль">
                    <button id="finish-registration">Завершить регистрацию</button>
                    <div id="reg-error" class="error-message"></div>
                `;

                document.getElementById('finish-registration').onclick = async () => {
                    const password = document.getElementById('new-password').value;

                    if (!password) {
                        document.getElementById('reg-error').innerHTML = 'Введите пароль';
                        return;
                    }

                    if (password.length < 4) {
                        document.getElementById('reg-error').innerHTML = 'Минимум 4 символа';
                        return;
                    }

                    try {
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
                    } catch (err) {
                        document.getElementById('reg-error').innerHTML = 'Ошибка соединения';
                    }
                };
            } else {
                document.getElementById('verification-error').innerHTML = data.message || 'Слишком много запросов, попробуйте через 5 минут';
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
        passwordInput.value = '';
        passwordError.innerHTML = '';
    });

    returnButton.addEventListener('click', () => {
        authForm.style.display = 'block';
        verificationDiv.style.display = 'none';
        document.getElementById('verification-error').innerHTML = '';
    });

    const gelmoPic = document.querySelector('.gelmo__pic');
    if (gelmoPic) {
        gelmoPic.addEventListener('click', () => {
            window.open('https://итд.com/@gelmo');
        });
    }

    window.addEventListener('click', (e) => {
        const modal = document.getElementById('captcha-modal');
        if (e.target === modal) {
            hideCaptchaModal();
        }
    });
})();