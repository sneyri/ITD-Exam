(function () {
    let currentVariantId = null;
    let currentImageUrl = null;
    let currentEditId = null;
    let currentEditImageUrl = null;

    window.loadVariants = async function () {
        const tbody = document.getElementById('variantsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="2"><div class="loading">Загрузка...</div></td></tr>';

        try {
            const variants = await getJSON('/api/variants');

            if (variants.length === 0) {
                tbody.innerHTML = '<tr><td colspan="2">Нет вариантов. Создайте первый!<\/div><\/div>';
                return;
            }

            let html = '';
            for (const v of variants) {
                html += `
                    <tr data-id="${v.id}">
                        <td class="variant-title">${escapeHtml(v.title)}</td>
                        <td class="variant-actions">
                            <button class="btn-toggle-variant ${v.is_active ? 'active' : 'inactive'}" data-id="${v.id}" data-active="${v.is_active}">
                                ${v.is_active ? 'Вкл' : 'Выкл'}
                            </button>
                            <button class="btn-edit-questions" data-id="${v.id}" data-title="${escapeHtml(v.title)}">Редактировать</button>
                            <button class="btn-delete" data-id="${v.id}">Удалить</button>
                        </td>
                    </tr>
                `;
            }
            tbody.innerHTML = html;

            document.querySelectorAll('.btn-toggle-variant').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    const isActive = btn.getAttribute('data-active') === 'true';

                    const newState = !isActive;

                    await fetch(`/api/variants/${id}/toggle`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ is_active: newState })
                    });

                    loadVariants();
                });
            });

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
            tbody.innerHTML = '<tr><td colspan="2">Ошибка загрузки вариантов<\/div><\/div>';
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
        currentImageUrl = null;

        const variantsContainer = document.getElementById('tab-variants');
        const editor = document.getElementById('questionsEditor');

        if (variantsContainer) variantsContainer.style.display = 'none';
        if (editor) editor.style.display = 'flex';

        await loadQuestionsList();
    };

    async function loadQuestionsList() {
        const listContainer = document.getElementById('questionsEditorList');
        if (!listContainer) return;

        listContainer.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3>Вопросы варианта: ${escapeHtml(document.querySelector('.btn-edit-questions.active')?.getAttribute('data-title') || '')}</h3>
                </div>
                <div class="modal-body">
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
                        <div id="imageUploadContainer">
                            <label>Изображение (необязательно):</label>
                            <input type="file" id="newImage" accept="image/jpeg,image/png,image/webp">
                            <div id="imagePreview" style="display: none; margin-top: 10px;">
                                <img id="previewImg" style="max-width: 200px; border-radius: 8px;">
                                <button type="button" id="removeImageBtn" class="btn-small" style="background: var(--danger); margin-left: 10px;">✖ Удалить</button>
                            </div>
                        </div>
                        <input type="number" id="newPoints" placeholder="Баллы" value="1">
                        <button id="addQuestionBtn" class="btn">Добавить вопрос</button>
                    </div>
                    <h3>Список вопросов</h3>
                    <div id="questionsListContainer">Загрузка...</div>
                </div>
            </div>
            <div id="editQuestionModal" class="edit-modal">
                <div class="edit-modal-content">
                    <h3>Редактировать вопрос</h3>
                    <input type="text" id="editQuestionText" placeholder="Текст вопроса">
                    <div id="editOptionsContainer">
                        <h4>Варианты ответов</h4>
                        <div id="editOptionsList"></div>
                        <button type="button" id="addEditOptionBtn" class="btn-small">Добавить вариант</button>
                    </div>
                    <input type="number" id="editPoints" placeholder="Баллы">
                    <div id="editImageContainer">
                        <label>Изображение:</label>
                        <input type="file" id="editImage" accept="image/jpeg,image/png,image/webp">
                        <div id="editImagePreview" style="display: none; margin-top: 10px;">
                            <img id="editPreviewImg" style="max-width: 200px; border-radius: 8px;">
                            <button type="button" id="removeEditImageBtn" class="btn-small">✖ Удалить</button>
                        </div>
                    </div>
                    <div class="edit-modal-buttons">
                        <button id="saveEditQuestionBtn" class="btn">Сохранить</button>
                        <button id="cancelEditQuestionBtn" class="btn cancel-btn">Отмена</button>
                    </div>
                </div>
            </div>
        `;

        let optionCounter = 1;
        let editOptionCounter = 0;

        document.getElementById('closeQuestionsEditor').onclick = () => {
            document.getElementById('questionsEditor').style.display = 'none';
            document.getElementById('tab-variants').style.display = 'block';
        };

        document.getElementById('addNewOptionBtn').onclick = () => {
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

        document.getElementById('newImage').onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('image', file);

            try {
                const response = await fetch('/api/upload', { method: 'POST', body: formData });
                const data = await response.json();
                currentImageUrl = data.imageUrl;
                document.getElementById('previewImg').src = currentImageUrl;
                document.getElementById('imagePreview').style.display = 'block';
            } catch (err) {
                alert('Ошибка загрузки изображения');
            }
        };

        document.getElementById('removeImageBtn').onclick = () => {
            currentImageUrl = null;
            document.getElementById('imagePreview').style.display = 'none';
            document.getElementById('previewImg').src = '';
            document.getElementById('newImage').value = '';
        };

        function addEditOptionRow(optionText = '', isCorrect = false, index = null) {
            const container = document.getElementById('editOptionsList');
            const rowId = index !== null ? index : editOptionCounter++;

            const row = document.createElement('div');
            row.className = 'option-row';
            row.innerHTML = `
                <input type="text" class="edit-option-text" value="${escapeHtml(optionText)}" placeholder="Вариант ответа" style="flex: 3;">
                <label><input type="radio" name="editCorrectOption" value="${rowId}" ${isCorrect ? 'checked' : ''} class="edit-correct-radio"> Верный</label>
                <button type="button" class="remove-edit-option-btn">✖</button>
            `;
            container.appendChild(row);

            row.querySelector('.remove-edit-option-btn').onclick = () => row.remove();
        }

        async function openEditModal(questionId) {
            const modal = document.getElementById('editQuestionModal');
            if (!modal) return;

            currentEditId = questionId;
            editOptionCounter = 0;

            const question = await getJSON(`/api/questions/${questionId}`);

            document.getElementById('editQuestionText').value = question.question_text;
            document.getElementById('editPoints').value = question.points;

            const optionsContainer = document.getElementById('editOptionsList');
            optionsContainer.innerHTML = '';

            if (question.options && question.options.length > 0) {
                question.options.forEach((opt, idx) => {
                    addEditOptionRow(opt.option_text, opt.is_correct, idx);
                    editOptionCounter = idx + 1;
                });
            } else {
                addEditOptionRow('', true, 0);
                editOptionCounter = 1;
            }

            if (question.image_url) {
                currentEditImageUrl = question.image_url;
                document.getElementById('editPreviewImg').src = question.image_url;
                document.getElementById('editImagePreview').style.display = 'block';
            } else {
                currentEditImageUrl = null;
                document.getElementById('editImagePreview').style.display = 'none';
            }

            modal.style.display = 'flex';
        }

        document.getElementById('addEditOptionBtn')?.addEventListener('click', () => {
            addEditOptionRow('', false);
        });

        document.getElementById('editImage')?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('image', file);

            try {
                const response = await fetch('/api/upload', { method: 'POST', body: formData });
                const data = await response.json();
                currentEditImageUrl = data.imageUrl;
                document.getElementById('editPreviewImg').src = currentEditImageUrl;
                document.getElementById('editImagePreview').style.display = 'block';
            } catch (err) {
                alert('Ошибка загрузки изображения');
            }
        });

        document.getElementById('removeEditImageBtn')?.addEventListener('click', () => {
            currentEditImageUrl = null;
            document.getElementById('editImagePreview').style.display = 'none';
            document.getElementById('editPreviewImg').src = '';
            document.getElementById('editImage').value = '';
        });

        document.getElementById('saveEditQuestionBtn')?.addEventListener('click', async () => {
            const question_text = document.getElementById('editQuestionText').value;
            const points = parseInt(document.getElementById('editPoints').value);

            if (!question_text) {
                alert('Введите текст вопроса');
                return;
            }

            const optionTexts = document.querySelectorAll('#editOptionsList .edit-option-text');
            const correctRadio = document.querySelector('input[name="editCorrectOption"]:checked');
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

            const data = {
                question_text,
                points,
                variant_id: currentVariantId,
                options,
                image_url: currentEditImageUrl
            };

            await putJSON(`/api/questions/${currentEditId}`, data);

            document.getElementById('editQuestionModal').style.display = 'none';
            loadQuestionsList();
        });

        document.getElementById('cancelEditQuestionBtn')?.addEventListener('click', () => {
            document.getElementById('editQuestionModal').style.display = 'none';
        });

        document.getElementById('addQuestionBtn').onclick = async () => {
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
                options: options,
                image_url: currentImageUrl
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
                currentImageUrl = null;
                document.getElementById('imagePreview').style.display = 'none';
                document.getElementById('newImage').value = '';
                loadQuestionsList();
            } catch (err) {
                alert('Ошибка: ' + err.message);
            }
        };

        const questionsContainer = document.getElementById('questionsListContainer');
        if (questionsContainer) {
            questionsContainer.innerHTML = '<div class="loading">Загрузка вопросов...</div>';

            try {
                const questions = await getJSON(`/api/questions/variant/${currentVariantId}`);

                if (questions.length === 0) {
                    questionsContainer.innerHTML = '<p>Нет вопросов. Добавьте первый!</p>';
                    return;
                }

                let html = '<table class="admin-table"><thead><tr><th>ID</th><th>Текст вопроса</th><th>Изображение</th><th>Баллы</th><th>Действия</th></tr></thead><tbody>';
                for (const q of questions) {
                    html += `
                        <tr>
                            <td>${q.id}</td>
                            <td>${escapeHtml(q.question_text)}</div>
                            <td>${q.image_url ? '<span style="color: var(--success);">Есть</span>' : '—'}</div>
                            <td>${q.points}</div>
                            <td>
                                <button class="edit-question-btn" data-id="${q.id}">Ред.</button>
                                <button class="delete-question-btn" data-id="${q.id}">Удалить</button>
                            </div>
                        </div>
                    `;
                }
                html += '</tbody></div>';
                questionsContainer.innerHTML = html;

                document.querySelectorAll('.edit-question-btn').forEach(btn => {
                    btn.onclick = async () => {
                        const id = btn.getAttribute('data-id');
                        await openEditModal(id);
                    };
                });

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

    if (document.getElementById('variantsTableBody')) {
        loadVariants();
    }
})();