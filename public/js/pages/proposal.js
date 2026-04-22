(function () {
    if (!requireAuth()) return;

    async function PostProposal() {
        PostProposalButton.textContent = 'Отправка...';
        PostProposalButton.disabled = true;

        const ProposalInput = document.getElementById('proposal_input');
        const ProposalInputText = ProposalInput.value;

        try {
            const result = await fetch('/api/proposal/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ProposalInputText })
            });

            if (result.ok) {
                ProposalInput.value = '';
                alert('Предложение успешно добавлено!');
            } else {
                const error = await result.json();
                alert('Ошибка: ' + error.error);
            }

            PostProposalButton.disabled = false;
            PostProposalButton.textContent = 'Отправить';
        } catch (err){
            showError(errorDiv, err.message || 'Произошла ошибка при отправке');
        }
    }

    const PostProposalButton = document.getElementById('proposal_post_btn');
    PostProposalButton.addEventListener('click', PostProposal);
})();