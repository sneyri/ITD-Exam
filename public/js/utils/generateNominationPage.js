const nominations = [
    {
        name: 'Король ИТД',
        users: [
            'виталий😎',
            'zpvlc🦥',
            'Ангел крови😈',
            'gruppa_sovet🎸',
            'друзьяшка🚨',
            '☭ Коммунистическая Партия ИТД☭',
            'Skorlange🫠',
            'Pustota🕳️',
            'Доброе утро📀',
            'Роман Плетнев Евгеньевич♐',
            'Густой бульон🥣',
            'HUSH⁴²🪲',
            'Денис femboy🎮',
            'никита аэро🛩️',
            'Ктсупер🙃',
            'VAL🤢',
            'Sigmashishka🐢',
            'кайд99🏔️',
            'hungry wolf🐺',
            'Владислав Смирнов🧑‍🎓',
            'ИТД STATUS👽'
        ]
    },
    {
        name: 'Королева ИТД',
        users: [
            'dregrav🙄',
            '501💥',
            'Вика Вилка🧌',
            'meok🎱',
            'heroka👩‍❤️‍💋‍👩',
            'Paleray',
            'рыжая radami🃏',
            'nowrikins😵',
            'SANDY👻',
            'ougiiuu🌿',
            'Гирни🍕',
            'Юмено Сайкуру👀',
            'KENZI IDK',
            'patato🧌',
            'Бутерброд майнкрафтович🥪',
            'асюта🫢',
            'Сумерки🪻',
            'вожак стаи🐺',
            'lienn🦋',
            'Мерша🚯'
        ]
    },
    {
        name: 'Лучший мемодел ИТД',
        users: [
            '∀⌨️',
            'hungry wolf🐺',
            'БАБРИК🦫',
            'японка вич💀',
            'кукувекуку🚾',
            'Густой бульон🥣',
            'HUSH42🪲',
            'Серёжа Местный🐼',
            'Роман Плетнев Евгеньевич♐',
            'мохнатая жопка🐝',
            '501💥',
            'вожак стаи🐺',
            'VAL🤢',
            'Pustota🕳️',
            'никита аэро🛩️',
            'Мемляндия💡',
            'Иисус Христос👁️‍🗨️',
            'друзьяшка🚨',
            'wassupski🦎',
            'Ангел крови😈',
            'Бутерброд майнкрафтович🥪'
        ]
    },
    {
        name: 'Лучший музыкант ИТД',
        users: [
            'Влад aikko🖤',
            'никита аэро🛩️',
            'Стримы Сэма🫠',
            'Лешка Пеняжкин🔥',
            'klorbot💜',
            'CookieMail🍪',
            'gr1mor🎧',
            'гнилаялирика💩',
            'Кирилл Роки🤮'
        ]
    },
    {
        name: 'Лучший художник в ИТД',
        users: [
            'meok🎱',
            'heroka👩‍❤️‍💋‍👩',
            'Paleray✨',
            'SANDY👻',
            'ougiiuu🌿',
            'Юмено Сайкуру👀',
            'Бутерброд майнкрафтович🥪',
            'lienn🦋',
            'МершаМерша🚯',
            'Ладно 0+🧟‍♂️',
            'Мусорный бак⁴²🦎',
            'Naodd💕',
            'kairu.🖌️',
            'yuutamashi🐢',
            'hOrlOk🫀',
            'houki🦊',
            'ouranou🗯️',
            'netochka👽',
            'асмогелька нежно🐾',
            'пустой.сигнал🧊',
            'Фабу🃏',
            'доримээ🦈',
            'Ляксанда🎸',
            'Redikili🎨'
        ]
    },
    {
        name: 'Лучшие ивенты в ИТД',
        users: [
            'никита аэро🛩️',
            'кайд99🏔️',
            'Maelstorm!🌀',
            'Pustota🕳️',
            '𝕰𝖛𝖌𝖊𝖓𝖞 𝕭𝖆𝖘𝖍𝖊𝖛🤠',
            'Ктсупер🙃',
        ]
    },
    {
        name: 'Лучшая галочка ИТД',
        users: [
            'Валерий Шурик💅',
            'Авиасейлс✈️',
            'Кирилл Смотрит🐲',
            'Гога Скалетта🦘',
            'Кирилл Тефни🤡',
            'ШУРИК И ШАРИК🐕',
            'ДЕЛАЙ КРУГ🐳',
            'Дмитрий ШГШ💙',
            'влада🦘',
            'glookipail🥄',
            'Крис Мастика🧌',
            'Ksenon👽',
            'псветвт🫧',
            'японка вич💀',
            'Максим Гельмо🐱',
            'алиса виалиска🧃',
            'эйфория!!😎',
            'ЛПП🦁',
            'сильв🦐',
            'Димончик кодинг♿',
            'Никита🧠'
        ]
    }
];

async function generateNominations() {
    const nominationContainer = document.querySelector('.nominations');

    let myVotes = [];
    try {
        const response = await fetch('/api/nominations/my-votes');
        const data = await response.json();
        myVotes = data;
    } catch (error) {
        console.error('Ошибка загрузки голосов:', error);
    }

    const votesMap = {};
    myVotes.forEach(vote => {
        votesMap[vote.nomination_name] = vote.nominee;
    });

    for (let nomination of nominations) {
        const hasVoted = votesMap.hasOwnProperty(nomination.name);
        const votedFor = votesMap[nomination.name];

        let nominationHTML = `
            <div class="nomination ${hasVoted ? 'nomination--voted' : ''}">
                <h2 class="nomination__name">${nomination.name}</h2>
                <div class="nomination__users">
        `;

        if (nomination.users.length > 0) {
            for (let nominationUser of nomination.users) {
                const isSelected = hasVoted && nominationUser === votedFor;

                nominationHTML += `
                    <div class="nomination__user 
                        ${hasVoted ? 'nomination__user--disabled' : ''} 
                        ${isSelected ? 'nomination__user--selected' : ''}"
                        ${hasVoted ? 'style="pointer-events: none;"' : ''}>
                        ${nominationUser}
                    </div>
                `;
            }
        } else {
            nominationHTML += `
                <p class="nomination__empty">Пока нет участников</p>
            `;
        }

        nominationHTML += `
                </div>
            </div>
        `;

        nominationContainer.innerHTML += nominationHTML;
    }

    document.querySelectorAll('.nomination__user:not(.nomination__user--disabled)').forEach(user => {
        user.addEventListener('click', async function () {
            const nominee = this.textContent;
            const nomination = this.closest('.nomination');
            const nominationName = nomination.querySelector('.nomination__name').textContent;

            try {
                const response = await fetch('/api/nominations/vote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nominee, nominationName })
                });

                if (response.ok) {
                    nomination.classList.add('nomination--voted');

                    nomination.querySelectorAll('.nomination__user').forEach(u => {
                        u.classList.add('nomination__user--disabled');
                        u.style.pointerEvents = 'none';
                    });

                    this.classList.add('nomination__user--selected');
                } else {
                    const data = await response.json();
                    alert(data.error);
                }
            } catch (error) {
                console.error('Ошибка:', error);
            }
        });
    });
}

generateNominations();