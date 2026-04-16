const { ITDClient } = require('itd-sdk-js');

async function main() {
    console.log('🔄 Инициализация клиента ИТД...');
    const client = new ITDClient();
    
    try {
        const user = await client.getUserProfile('vladlenka');
        
        console.log('\n✅ Результат:');
        console.log(`ID: ${user.id}`);
        console.log(`Юзернейм: ${user.username}`);
        console.log(`Отображаемое имя: ${user.displayName || user.username}`);
        console.log(`Аватар: ${user.avatar || 'нет'}`);
        console.log(`Био: ${user.bio || 'нет'}`);
        console.log(`Верифицирован: ${user.verified ? '✅ Да' : '❌ Нет'}`);
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        if (error.response) {
            console.error('Детали:', error.response.data);
        }
    }
}

main();