(function () {
    let currentVariantId = null;

    window.loadVariants = async function () {
        const tbody = document.getElementById('variantsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="2"><div class="loading">Загрузка...</div></td></tr>';

        try {
            const variants = await getJSON('/api/variants');

            if (variants.length === 0) {
                tbody.innerHTML = '<tr><td colspan="2">Нет вариантов. Создайте первый!</td></tr>';
                return;
            }

            let html = '';
            for (const v of variants) {
                html += `
                    <tr>
                        <td class="variant-title">${escapeHtml(v.title)}</td>
                        <td class="variant-actions">
                            <button class="btn-edit-questions" data-id="${v.id}" data-title="${escapeHtml(v.title)}">Редактировать</button>
                            <button class="btn-delete" data-id="${v.id}">Удалить</button>
                        </td>
                    </tr>
                `;
            }
            tbody.innerHTML = html;

            document.querySelectorAll('.btn-edit-questions').forEach(btn => {
                btn.addEventListener('click', () => {
                    const variantId = btn.getAttribute('data-id');
                    const variantTitle = btn.getAttribute('data-title');
                    openQuestionsEditor(variantId, variantTitle);
                });
            });

            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    if (confirm('Удалить вариант?')) {
                        await deleteRequest(`/api/variants/${id}`);
                        loadVariants();
                    }
                });
            });
        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="2">Ошибка загрузки вариантов</td></tr>';
        }
    };

    document.getElementById('createVariantBtn')?.addEventListener('click', async () => {
        const title = document.getElementById('newVariantTitle')?.value.trim();
        if (!title) {
            alert('Введите название варианта');
            return;
        }
        await postJSON('/api/variants', { title });
        document.getElementById('newVariantTitle').value = '';
        loadVariants();
    });

    window.openQuestionsEditor = async function (variantId, variantTitle) {
        currentVariantId = variantId;
        
        const editor = document.getElementById('questionsEditor');
        const editorTitle = document.getElementById('questionsEditorTitle');
        
        if (editor) {
            editor.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
        if (editorTitle) editorTitle.textContent = `Вопросы варианта: ${variantTitle}`;
        
        await loadQuestionsList();
    };

    async function loadQuestionsList() {
        const listContainer = document.getElementById('questionsEditorList');
        if (!listContainer) return;

        listContainer.innerHTML = `
            <div class="question-form-container">
                <h3>Добавить новый вопрос</h3>
                <input type="text" id="newQuestionText" placeholder="Текст вопроса">
                <div id="newOptionsContainer">
                    <h4>Варианты ответов</h4>
                    <div id="newOptionsList">
                        <div class="option-row">
                            <input type="text" class="option-text" placeholder="Вариант ответа">
                            <label><input type="radio" name="newCorrectOption" value="0" class="correct-radio" checked> Верный</label>
                            <button type="button" class="remove-option-btn">✖</button>
                        </div>
                    </div>
                    <button type="button" id="addNewOptionBtn" class="btn-small">Добавить вариант</button>
                </div>
                <input type="number" id="newPoints" placeholder="Баллы" value="1">
                <button id="addQuestionBtn" class="btn">Добавить вопрос</button>
            </div>
            <h3>Список вопросов</h3>
            <div id="questionsListContainer">Загрузка...</div>
        `;

        let optionCounter = 1;
        const addNewOptionBtn = document.getElementById('addNewOptionBtn');
        if (addNewOptionBtn) {
            addNewOptionBtn.onclick = () => {
                const container = document.getElementById('newOptionsList');
                const newRow = document.createElement('div');
                newRow.className = 'option-row';
                newRow.innerHTML = `
                    <input type="text" class="option-text" placeholder="Вариант ответа">
                    <label><input type="radio" name="newCorrectOption" value="${optionCounter}" class="correct-radio"> Верный</label>
                    <button type="button" class="remove-option-btn">✖</button>
                `;
                container.appendChild(newRow);
                newRow.querySelector('.remove-option-btn').onclick = () => newRow.remove();
                optionCounter++;
            };
        }

        const addQuestionBtn = document.getElementById('addQuestionBtn');
        if (addQuestionBtn) {
            addQuestionBtn.onclick = async () => {
                const question_text = document.getElementById('newQuestionText').value;
                const points = parseInt(document.getElementById('newPoints').value);

                if (!question_text) {
                    alert('Введите текст вопроса');
                    return;
                }

                const optionTexts = document.querySelectorAll('#newOptionsList .option-text');
                const correctRadio = document.querySelector('input[name="newCorrectOption"]:checked');
                const correctIndex = correctRadio ? parseInt(correctRadio.value) : 0;

                const options = [];
                optionTexts.forEach((opt, idx) => {
                    if (opt.value.trim()) {
                        options.push({
                            option_text: opt.value.trim(),
                            is_correct: (idx === correctIndex)
                        });
                    }
                });

                if (options.length < 2) {
                    alert('Добавьте минимум 2 варианта ответа');
                    return;
                }

                if (!currentVariantId) {
                    alert('Ошибка: вариант не выбран');
                    return;
                }

                const data = {
                    question_text: question_text,
                    points: points,
                    variant_id: parseInt(currentVariantId),
                    options: options
                };

                try {
                    await postJSON('/api/questions', data);
                    document.getElementById('newQuestionText').value = '';
                    document.getElementById('newOptionsList').innerHTML = `
                        <div class="option-row">
                            <input type="text" class="option-text" placeholder="Вариант ответа">
                            <label><input type="radio" name="newCorrectOption" value="0" class="correct-radio" checked> Верный</label>
                            <button type="button" class="remove-option-btn">✖</button>
                        </div>
                    `;
                    loadQuestionsList();
                } catch (err) {
                    alert('Ошибка: ' + err.message);
                }
            };
        }

        const questionsContainer = document.getElementById('questionsListContainer');
        if (questionsContainer) {
            questionsContainer.innerHTML = '<div class="loading">Загрузка вопросов...</div>';

            try {
                const questions = await getJSON(`/api/questions/variant/${currentVariantId}`);

                if (questions.length === 0) {
                    questionsContainer.innerHTML = '<p>Нет вопросов. Добавьте первый!</p>';
                    return;
                }

                let html = '<table class="admin-table"><thead><tr><th>ID</th><th>Текст вопроса</th><th>Баллы</th><th>Действия</th></tr></thead><tbody>';
                for (const q of questions) {
                    html += `
                        <tr>
                            <td>${q.id}</td>
                            <td>${escapeHtml(q.question_text)}</td>
                            <td>${q.points}</td>
                            <td><button class="delete-question-btn" data-id="${q.id}">🗑 Удалить</button></td>
                        </tr>
                    `;
                }
                html += '</tbody></table>';
                questionsContainer.innerHTML = html;

                document.querySelectorAll('.delete-question-btn').forEach(btn => {
                    btn.onclick = async () => {
                        const id = btn.getAttribute('data-id');
                        if (confirm('Удалить вопрос?')) {
                            await deleteRequest(`/api/questions/${id}`);
                            loadQuestionsList();
                        }
                    };
                });
            } catch (err) {
                questionsContainer.innerHTML = '<p class="error-message">Ошибка загрузки вопросов</p>';
            }
        }
    }

    document.getElementById('closeQuestionsEditor')?.addEventListener('click', () => {
        const editor = document.getElementById('questionsEditor');
        if (editor) {
            editor.style.display = 'none';
            document.body.style.overflow = '';
        }
    });

    if (document.getElementById('variantsTableBody')) {
        loadVariants();
    }
})();