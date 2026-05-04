const nominations__container = document.querySelector('.nominations');
const nominations = [
    {
        name: 'Король ИТД',
        users: [
            'ИТД Status',
            'виталий',
            'Ангел крови',
            'друзьяшка',
            'Коммунистическая Партия ИТД',
            'Skorlange',
            'Густой бульон',
            'Pustota',
            'Роман Плетнев Евгеньевич',
            'Sigmashishka'
        ]
    },
    {
        name: 'Королева ИТД',
        users: [
            'dregrav',
            'аля',
            'Вика Вилка',
            '501',
            'меок',
            'heroka',
            'японка вич',
            'ougiiuu',
            'Юмено Сайкуру',
            'nowrikins'
        ]
    },
    {
        name: 'Лучший мемодел ИТД',
        users: []
    },
    {
        name: 'Лучший музыкант ИТД',
        users: []
    },
    {
        name: 'Лучший художник в ИТД',
        users: []
    },
    {
        name: 'Самый креативный в ИТД',
        users: []
    },
    {
        name: 'Лучший мейкап в ИТД',
        users: []
    }
];

const votedNominations = new Map();

async function generatePage() {
    if (!nominations__container) {
        console.error('Container .nominations not found');
        return;
    }
    
    nominations__container.innerHTML = '';
    let userIndex = 0;
    
    await fetchUserVotes();
    
    for (const nomination of nominations) {
        let usersHTML = '';
        
        for (let i = 0; i < nomination.users.length; i++) {
            const user = nomination.users[i];
            const voteId = `${user}_${userIndex}`;
            
            try {
                const response = await getJSON(`/api/nominations/vote/${voteId}`);
                const votesCount = response.votes || 0;
                
                const voteInfo = votedNominations.get(nomination.name);
                const isUserVotedForThis = voteInfo?.hasVoted && voteInfo.votedFor === voteId;
                const isNominationVoted = voteInfo?.hasVoted;
                
                let buttonText = 'проголосовать';
                let buttonDisabled = false;
                let buttonClass = 'card__vote';
                let cardClass = 'card__user';
                
                if (isUserVotedForThis) {
                    buttonText = '✓ Вы голосовали';
                    buttonDisabled = true;
                    buttonClass = 'card__vote voted';
                    cardClass = 'card__user voted-card';
                } else if (isNominationVoted) {
                    buttonText = 'Уже проголосовали';
                    buttonDisabled = true;
                    buttonClass = 'card__vote disabled';
                    cardClass = 'card__user disabled-card';
                }
                
                usersHTML += `
                <div class="${cardClass}" data-id="${voteId}" data-nomination="${nomination.name}">
                    <img class="nomination__image" src="assets/nominations/Users/${user}.png" alt="картинка" onerror="this.src='assets/default.png'">
                    <p>${escapeHtml(user)}</p>
                    <button class="${buttonClass}" ${buttonDisabled ? 'disabled' : ''}>${buttonText}</button>
                    ${isUserVotedForThis ? '<span class="voted-badge">Ваш голос</span>' : ''}
                </div>
                `;
            } catch (error) {
                usersHTML += `
                <div class="card__user" data-id="${voteId}" data-nomination="${nomination.name}">
                    <img class="nomination__image" src="assets/nominations/Users/${user}.png" alt="картинка">
                    <p>${escapeHtml(user)}</p>
                    <button class="card__vote" disabled>Ошибка</button>
                </div>
                `;
            }
            userIndex++;
        }
        
        const voteInfo = votedNominations.get(nomination.name);
        const nominationClass = voteInfo?.hasVoted ? 'nomination voted-nomination' : 'nomination';
        
        nominations__container.innerHTML += `
        <div class="${nominationClass}" data-nomination="${nomination.name}">
            <div class="nomination__name">${escapeHtml(nomination.name)}</div>
            <div class="nomination__userList">${usersHTML}</div>
        </div>
        `;
    }
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    enhanceVotedStyles();
    attachVoteHandlers();
}

async function fetchUserVotes() {
    try {
        const response = await fetch('/api/nominations/user-votes');
        if (!response.ok) return;
        
        const userVotes = await response.json();
        
        for (const vote of userVotes) {
            if (vote.nomination_name) {
                votedNominations.set(vote.nomination_name, {
                    hasVoted: true,
                    votedFor: vote.nominee
                });
            }
        }
    } catch (error) {
        console.error('Error fetching user votes:', error);
    }
}

function enhanceVotedStyles() {
    for (const [nominationName, voteInfo] of votedNominations) {
        if (!voteInfo.hasVoted) continue;
        
        const nominationDiv = document.querySelector(`.nomination[data-nomination="${nominationName}"]`);
        if (!nominationDiv) continue;
        
        if (!nominationDiv.classList.contains('voted-nomination')) {
            nominationDiv.classList.add('voted-nomination');
        }
        
        const cards = nominationDiv.querySelectorAll('.card__user');
        
        cards.forEach(card => {
            const cardId = card.dataset.id;
            
            if (cardId === voteInfo.votedFor) {
                card.classList.add('voted-card');
                card.classList.remove('disabled-card');
                
                const btn = card.querySelector('.card__vote');
                if (btn) {
                    btn.textContent = '✓ Вы голосовали';
                    btn.classList.add('voted');
                    btn.disabled = true;
                }
                
                if (!card.querySelector('.voted-badge')) {
                    const badge = document.createElement('span');
                    badge.className = 'voted-badge';
                    badge.textContent = 'Ваш голос';
                    card.appendChild(badge);
                }
            } else {
                card.classList.add('disabled-card');
                const btn = card.querySelector('.card__vote');
                if (btn && !btn.disabled) {
                    btn.textContent = 'Уже проголосовали';
                    btn.classList.add('disabled');
                    btn.disabled = true;
                }
            }
        });
    }
}

function attachVoteHandlers() {
    document.body.addEventListener('click', async (event) => {
        const voteBtn = event.target.closest('.card__vote');
        if (!voteBtn || voteBtn.disabled) return;
        
        const userCard = voteBtn.closest('.card__user');
        if (!userCard) return;
        
        const id = userCard.dataset.id;
        const nominationName = userCard.dataset.nomination;
        
        if (votedNominations.has(nominationName)) {
            alert('Вы уже голосовали в этой номинации!');
            voteBtn.disabled = true;
            return;
        }
        
        const originalText = voteBtn.textContent;
        
        voteBtn.disabled = true;
        voteBtn.textContent = 'Отправка...';
        voteBtn.classList.add('loading');
        
        try {
            const result = await postJSON('/api/nominations/vote', { 
                id: id,
                nominationName: nominationName 
            });
            
            if (result.status) {
                votedNominations.set(nominationName, {
                    hasVoted: true,
                    votedFor: id
                });
                
                updateNominationUI(nominationName, id, result.votesCount);
                
                userCard.classList.add('vote-success');
                setTimeout(() => userCard.classList.remove('vote-success'), 600);
                
            } else {
                throw new Error(result.error || 'Ошибка');
            }
        } catch (error) {
            console.error(error);
            voteBtn.textContent = 'Ошибка';
            setTimeout(() => {
                voteBtn.textContent = originalText;
                voteBtn.disabled = false;
                voteBtn.classList.remove('loading');
            }, 2000);
            alert(error.message || 'Ошибка при голосовании');
        }
    });
}

function updateNominationUI(nominationName, votedForId, votesCount) {
    const nominationDiv = document.querySelector(`.nomination[data-nomination="${nominationName}"]`);
    if (!nominationDiv) return;
    
    nominationDiv.classList.add('voted-nomination');
    
    const cards = nominationDiv.querySelectorAll('.card__user');
    
    cards.forEach(card => {
        const cardId = card.dataset.id;
        const btn = card.querySelector('.card__vote');
        
        if (cardId === votedForId) {
            card.classList.add('voted-card');
            card.classList.remove('disabled-card');
            
            if (btn) {
                btn.textContent = '✓ Вы голосовали';
                btn.classList.add('voted');
                btn.disabled = true;
                btn.classList.remove('loading');
            }
            
            if (!card.querySelector('.voted-badge')) {
                const badge = document.createElement('span');
                badge.className = 'voted-badge';
                badge.textContent = 'Ваш голос';
                card.appendChild(badge);
            }
        } else {
            card.classList.add('disabled-card');
            if (btn) {
                btn.textContent = 'Уже проголосовали';
                btn.classList.add('disabled');
                btn.disabled = true;
                btn.classList.remove('loading');
            }
        }
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => generatePage());
} else {
    generatePage();
}