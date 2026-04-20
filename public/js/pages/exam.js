(function() {
    if (!requireAuth()) return;

    const userId = getUser().id;
    const urlParams = new URLSearchParams(window.location.search);
    const variantId = urlParams.get('variant_id');

    const submitBtn = document.getElementById('submit-exam-btn');
    const modal = document.getElementById('result-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    let resultScore = null;
    let resultMaxScore = null;

    async function loadQuestions() {
        const container = document.getElementById('questions-container');
        if (!container) return;
        
        showLoading(container);

        try {
            const questions = await getJSON(`/api/questions/variant/${variantId}`);
            
            if (questions.length === 0) {
                container.innerHTML = '<p>В этом варианте нет вопросов.</p>';
                return;
            }

            let html = '';
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                html += `
                    <div class="question-block" data-question-id="${q.id}">
                        <p><strong>${i + 1}. ${escapeHtml(q.question_text)}</strong></p>
                        <div class="options-list">
                `;
                
                if (q.options && q.options.length > 0) {
                    for (let j = 0; j < q.options.length; j++) {
                        const opt = q.options[j];
                        html += `
                            <label class="option-label">
                                <input type="radio" name="q${q.id}" value="${opt.id}" data-question="${q.id}" data-option="${opt.id}">
                                <span>${escapeHtml(opt.option_text)}</span>
                            </label>
                        `;
                    }
                }
                
                html += `</div></div>`;
            }
            container.innerHTML = html;
        } catch (err) {
            showError(container, 'Ошибка загрузки вопросов');
        }
    }

    async function loadVariantTitle() {
        const titleElem = document.getElementById('variant-title');
        if (!titleElem || !variantId) return;
        
        try {
            const variant = await getJSON(`/api/variants/${variantId}`);
            titleElem.textContent = `Вариант ${variant.variant}`;
        } catch (err) {
            titleElem.textContent = 'Вариант не найден';
        }
    }

    async function submitExam() {
        const answers = {};
        
        const radioInputs = document.querySelectorAll('input[type="radio"]:checked');
        radioInputs.forEach(input => {
            const questionId = input.getAttribute('data-question');
            answers[questionId] = input.getAttribute('data-option');
        });

        if (Object.keys(answers).length === 0) {
            alert('Ответьте хотя бы на один вопрос');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка...';

        try {
            const result = await postJSON('/api/exam/submit', {
                user_id: userId,
                variant_id: variantId,
                answers: answers
            });

            if (result) {
                resultScore = result.score;
                resultMaxScore = result.maxScore;
                document.getElementById('result-score').textContent = `${result.score} / ${result.maxScore}`;
                modal.style.display = 'flex';
            }
        } catch (err) {
            alert('Ошибка при отправке');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Отправить экзамен';
        }
    }

    closeModalBtn?.addEventListener('click', () => {
        modal.style.display = 'none';
        window.location.href = '/variants.html';
    });

    if (variantId) {
        loadVariantTitle();
        loadQuestions();
        submitBtn?.addEventListener('click', submitExam);
    } else {
        document.getElementById('questions-container').innerHTML = '<p>Ошибка: вариант не выбран</p>';
    }
})();