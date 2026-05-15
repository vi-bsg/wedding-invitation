// === ТАЙМЕР ДО 15 АВГУСТА 2026 ===
const target = new Date(2026, 7, 15, 15, 0, 0);

function updateTimer() {
    const now = new Date();
    const diff = target - now;

    if (diff <= 0) {
        document.getElementById("days").textContent = "0";
        document.getElementById("hours").textContent = "0";
        document.getElementById("minutes").textContent = "0";
        document.getElementById("seconds").textContent = "0";
        return;
    }

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    document.getElementById("days").textContent = days;
    document.getElementById("hours").textContent = hours;
    document.getElementById("minutes").textContent = minutes;
    document.getElementById("seconds").textContent = seconds;
}

setInterval(updateTimer, 1000);
updateTimer();

// === АНИМАЦИИ ПРИ СКРОЛЛЕ ===
const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add("show");
        }
    });
});

document.querySelectorAll('.fade').forEach(el => observer.observe(el));

// === НАСТРОЙКИ TELEGRAM ===
const BOT_TOKEN = '8681241596:AAHgPWXTxRPs23_osHNHxfz2xgdLyfWuJhU';
const CHAT_ID = '832855643';

// === ЭЛЕМЕНТЫ ФОРМЫ ===
const form = document.getElementById('rsvpForm');
const feedbackDiv = document.getElementById('formFeedback');

// === СЧЁТЧИКИ ===
let totalGuests = 0;
let totalTransfer = 0;
let responses = [];

function loadCounters() {
    const saved = localStorage.getItem('wedding_stats');
    if (saved) {
        const data = JSON.parse(saved);
        totalGuests = data.totalGuests || 0;
        totalTransfer = data.totalTransfer || 0;
        responses = data.responses || [];
    }
}
loadCounters();

function saveCounters() {
    localStorage.setItem('wedding_stats', JSON.stringify({
        totalGuests: totalGuests,
        totalTransfer: totalTransfer,
        responses: responses
    }));
}

// === ОТПРАВКА В TELEGRAM ===
async function sendToTelegram(name, answer, transfer) {
    const answerText = answer === 'yes' ? '✅ Будет на банкете' : '❌ Не будет на банкете';
    const transferText = transfer === 'yes' ? '🚌 Будет в трансфере' : '🚗 Едет сама/сам';

    const message = `✨ НОВЫЙ ОТВЕТ ✨\n\n👤 Гость: ${name}\n📝 Банкет: ${answerText}\n🚌 Трансфер: ${transferText}\n\n📊 Сейчас:\n🎉 Всего гостей: ${totalGuests}\n🚍 На трансфере: ${totalTransfer}\n⏰ ${new Date().toLocaleString('ru-RU')}`;

    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: CHAT_ID, text: message })
        });
        return response.ok;
    } catch (error) {
        console.error('Ошибка:', error);
        return false;
    }
}

// === ПРОВЕРКА ДЕДЛАЙНА (1 ИЮЛЯ 2026) ===
function isAfterDeadline() {
    const deadline = new Date(2026, 6, 1);
    const today = new Date();
    return today > deadline;
}

// === ОБРАБОТКА ОТПРАВКИ ФОРМЫ ===
form.addEventListener('submit', async function(e) {
    e.preventDefault();

    if (isAfterDeadline()) {
        feedbackDiv.innerHTML = '📅 Приём ответов завершён 1 июля. Если хотите изменить ответ, свяжитесь с нами лично 🤍';
        feedbackDiv.style.color = '#b68b68';
        return;
    }

    const name = document.getElementById('guestName').value.trim();
    const attendance = document.getElementById('attendance').value;
    const zaggs = document.getElementById('zaggs').value;

    if (!name) {
        feedbackDiv.innerHTML = '❌ Пожалуйста, укажите ваше имя.';
        feedbackDiv.style.color = '#b1624d';
        return;
    }

    if (!attendance) {
        feedbackDiv.innerHTML = '❌ Пожалуйста, ответьте, будете ли вы на банкете.';
        feedbackDiv.style.color = '#b1624d';
        return;
    }

    if (!zaggs) {
        feedbackDiv.innerHTML = '❌ Пожалуйста, ответьте про трансфер.';
        feedbackDiv.style.color = '#b1624d';
        return;
    }

    const existing = responses.find(r => r.name.toLowerCase() === name.toLowerCase());
    if (existing) {
        feedbackDiv.innerHTML = `🙏 ${name}, вы уже отвечали. Если хотите изменить ответ, свяжитесь с нами лично.`;
        feedbackDiv.style.color = '#b68b68';
        return;
    }

    if (attendance === 'yes') {
        totalGuests++;
        if (zaggs === 'yes') totalTransfer++;
    }

    responses.push({
        name: name,
        attendance: attendance,
        transfer: zaggs,
        timestamp: new Date().toLocaleString('ru-RU')
    });
    saveCounters();

    const sent = await sendToTelegram(name, attendance, zaggs);

    if (sent) {
        const answerRu = attendance === 'yes' ? 'придёте на банкет 🎉' : 'не сможете прийти 🕊️';
        feedbackDiv.innerHTML = `✅ Спасибо, ${name}! Мы получили ваш ответ: ${answerRu}`;
        feedbackDiv.style.color = '#548c6f';
        document.getElementById('guestName').value = '';
        document.getElementById('attendance').value = '';
        document.getElementById('zaggs').value = '';
    } else {
        feedbackDiv.innerHTML = '❌ Ошибка отправки. Попробуйте ещё раз или напишите нам лично.';
        feedbackDiv.style.color = '#b1624d';
    }

    setTimeout(() => {
        feedbackDiv.innerHTML = '';
    }, 5000);
});
