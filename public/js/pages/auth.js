(function () {
    const authForm = document.getElementById('auth-form');
    const verificationDiv = document.getElementById('verification');
    const usernameInput = document.getElementById('username-input');
    const loginButton = document.getElementById('login-btn');
    const accountDiv = document.getElementById('account');
    const errorDiv = document.getElementById('login-error');
    const returnButton = document.getElementById('return-to-auth');
    const checkButton = document.getElementById('check-verification');

    let foundProfile = null;
    let currentUsername = '';

    loginButton.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        errorDiv.innerHTML = '';

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

            if (data.exists) {
                foundProfile = data.data;
                currentUsername = username

                accountDiv.innerHTML = `
                    <div">
                        <p><strong>${escapeHtml(data.data.displayName) + escapeHtml(data.data.avatar)}</strong></p>
                        <button id="submit-account">Это я (клянусь)</button>
                    </div>
                `;

                document.getElementById('submit-account').addEventListener('click', async () => {
                    authForm.style.display = 'none';
                    verificationDiv.style.display = 'block';

                    const generateCode = await fetch('/api/auth/itd/generateCode', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: data.data.username })
                    });

                    const code = await generateCode.json();

                    const secretCodeLabel = document.getElementById('secret-code-label');
                    secretCodeLabel.textContent = `СЕКРЕТНЫЙ КОД: ${code.verifCode}`;
                });
            } else {
                accountDiv.innerHTML = '';
                errorDiv.innerHTML = 'Пользователь не найден';
            }
        } catch (err) {
            errorDiv.innerHTML = 'Ошибка соединения с сервером';
        }
    });

    returnButton.addEventListener('click', () => {
        authForm.style.display = 'block';
        verificationDiv.style.display = 'none';
    });

    checkButton.addEventListener('click', async () => {
        checkButton.disabled = true;
        checkButton.textContent = 'Проверка...';

        try {
            const response = await fetch('/api/auth/itd/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUsername })
            })

            const data = await response.json();

            if (data.verifed) {
                window.location.href = '/';
            } else {    
                document.getElementById('verification-error').innerHTML = data.message || 'Пост не найден'
                checkButton.disabled = false;
                checkButton.textContent = 'Я опубликовал(а) пост'
            }
        } catch (err) {
            document.getElementById('verification-error').innerHTML = 'Ошибка проверки, попробуйте снова';
            checkButton.disabled = false;
            checkButton.textContent = 'Я опубликовал(а) пост';
        }
    });
})();