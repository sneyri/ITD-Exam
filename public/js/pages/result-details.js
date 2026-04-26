(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const attemptId = urlParams.get('attempt_id');

    if (!attemptId) {
        document.getElementById('questionsContainer').innerHTML = 
            '<p class="error-message">Ошибка: результат не выбран</p>';
        return;
    }

    async function loadDetails() {
        const headerContainer = document.getElementById('resultHeader');
        const questionsContainer = document.getElementById('questionsContainer');

        try {
            const data = await getJSON(`/api/exam/result/${attemptId}`);

            headerContainer.innerHTML = `
                <h2>Результат: ${escapeHtml(data.result.variant_title || 'Без названия')}</h2>
                <div class="score-value">${data.result.score} / ${data.result.max_score}</div>
                <p>${formatDate(data.result.created_at)}</p>
            `;

            let html = '';
            for (const ans of data.answers) {
                const isCorrect = ans.is_correct === true;
                const blockClass = isCorrect ? 'correct' : 'incorrect';

                html += `
                    <div class="question-block ${blockClass}">
                        <p><strong>${escapeHtml(ans.question_text)}</strong>
                            <span class="result-badge ${isCorrect ? 'correct' : 'incorrect'}">
                                ${isCorrect ? '✓ Верно' : '✗ Неверно'}
                            </span>
                        </p>
                        <div class="user-answer ${isCorrect ? 'user-answer-correct' : 'user-answer-incorrect'}">
                            Ваш ответ: ${escapeHtml(ans.user_answer || '(не указан)')}
                        </div>
                        ${!isCorrect ? `<div class="correct-answer">Правильный ответ: ${escapeHtml(ans.correct_answer)}</div>` : ''}
                    </div>
                `;
            }
            questionsContainer.innerHTML = html;
            
            const percent = (data.result.score / data.result.max_score) * 100;
            let imageName = 'WORST';
            if (percent >= 75) imageName = 'BEST';
            else if (percent >= 50) imageName = 'GOOD';
            else if (percent >= 25) imageName = 'BAD';

            questionsContainer.insertAdjacentHTML('beforeend', `
                <div style="text-align: center; margin-top: 30px;">
                    <img class="result-image" src="/assets/${imageName}.jpg" alt="${imageName}">
                </div>
            `);
        } catch (err) {
            console.error(err);
            questionsContainer.innerHTML = '<p class="error-message">Ошибка загрузки деталей</p>';
        }
    }

    loadDetails();
})();