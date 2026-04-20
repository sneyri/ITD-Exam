(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const resultId = urlParams.get('result_id');
    let answersData = [];

    if (!resultId) {
        document.getElementById('answersContainer').innerHTML = '<p class="error-message">Ошибка: результат не выбран</p>';
        return;
    }

    async function loadResult() {
        const container = document.getElementById('answersContainer');
        showLoading(container);

        try {
            const data = await getJSON(`/api/exam/result/${resultId}`);
            answersData = data.answers;

            document.getElementById('resultInfo').innerHTML = `
                <div class="question-block">
                    <p><strong>Пользователь:</strong> ${escapeHtml(data.result.user_name)}</p>
                    <p><strong>Вариант:</strong> ${data.result.variant_id}</p>
                    <p><strong>Дата:</strong> ${formatDate(data.result.created_at)}</p>
                    <p><strong>Статус:</strong> <span id="currentStatus">${data.result.status}</span></p>
                </div>
            `;

            document.getElementById('statusSelect').value = data.result.status;
            document.getElementById('adminComment').value = data.result.admin_comment || '';

            let html = `
                <div class="answers-header">
                    <div style="flex: 3;">Вопрос</div>
                    <div style="flex: 2;">Ответ пользователя</div>
                    <div style="flex: 2;">Правильный ответ</div>
                    <div style="flex: 1; text-align: center;">Верно?</div>
                </div>
            `;

            for (let i = 0; i < answersData.length; i++) {
                const ans = answersData[i];
                html += `
                    <div class="answer-row" data-index="${i}">
                        <div class="answer-question">${escapeHtml(ans.question_text)}</div>
                        <div class="answer-user">${escapeHtml(ans.user_answer || '(не указан)')}</div>
                        <div class="answer-correct">${escapeHtml(ans.correct_answer)}</div>
                        <div class="answer-checkbox">
                            <input type="checkbox" class="correct-checkbox" data-index="${i}" ${ans.is_correct ? 'checked' : ''}>
                        </div>
                    </div>
                `;
            }

            container.innerHTML = html;

            document.querySelectorAll('.correct-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const index = parseInt(e.target.getAttribute('data-index'));
                    answersData[index].is_correct = e.target.checked;
                });
            });
        } catch (err) {
            showError(container, 'Ошибка загрузки данных');
        }
    }

    document.getElementById('submitReviewBtn').addEventListener('click', async () => {
        const status = document.getElementById('statusSelect').value;
        const adminComment = document.getElementById('adminComment').value;

        let totalScore = 0;
        let maxScore = 0;

        for (const ans of answersData) {
            const points = ans.points || 1;
            maxScore += points;
            if (ans.is_correct) {
                totalScore += points;
            }
        }

        const answersReview = answersData.map(ans => ({
            user_answer_id: ans.id,
            is_correct: ans.is_correct || false
        }));

        await putJSON(`/api/exam/result/${resultId}`, {
            status,
            admin_comment: adminComment,
            answers_review: answersReview,
            score: totalScore,
            max_score: maxScore
        });

        window.location.href = '/admin';
    });

    loadResult();
})();