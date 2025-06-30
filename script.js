document.addEventListener('DOMContentLoaded', () => {
    const amountInput = document.getElementById('amount');
    const fromCurrency = document.getElementById('from-currency');
    const toCurrency = document.getElementById('to-currency');
    const resultInput = document.getElementById('result');
    const convertBtn = document.getElementById('convert-btn');
    const swapBtn = document.getElementById('swap-btn');
    const rateInfo = document.getElementById('rate-info');
    const fromFlag = document.getElementById('from-flag');
    const toFlag = document.getElementById('to-flag');
    const timeButtons = document.querySelectorAll('.time-btn');
    const chartTitle = document.querySelector('.chart-container h3');
    
    const ctx = document.getElementById('history-chart').getContext('2d');
    let historyChart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: false } }
        }
    });

    function updateChartTitle(days) {
        const from = fromCurrency.value;
        const to = toCurrency.value;
        let periodText = '';
        
        switch(days) {
            case 7: periodText = 'Últimos 7 días'; break;
            case 30: periodText = 'Últimos 30 días'; break;
            case 90: periodText = 'Últimos 90 días'; break;
            default: periodText = `Últimos ${days} días`;
        }
        chartTitle.textContent = `Historial de Tasas (${periodText}) - ${from} a ${to}`;
    }

    function clearConversionFields() {
        amountInput.value = "";
        resultInput.value = "";
        rateInfo.textContent = "";
    }

    async function getExchangeRate(from, to) {
        try {
            const response = await fetch(`https://api.frankfurter.app/latest?from=${from}`);
            const data = await response.json();
            return data.rates[to];
        } catch (error) {
            console.error("Error al obtener tasas:", error);
            return null;
        }
    }

    async function getHistoricalData(days = 30) {
        const from = fromCurrency.value;
        const to = toCurrency.value;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        
        try {
            const response = await fetch(`https://api.frankfurter.app/${formatDate(startDate)}..${formatDate(endDate)}?from=${from}&to=${to}`);
            return await response.json();
        } catch (error) {
            console.error("Error al obtener histórico:", error);
            return null;
        }
    }

    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    async function updateChart(days = 30) {
        updateChartTitle(days);
        const historicalData = await getHistoricalData(days);
        
        if (historicalData?.rates) {
            const labels = Object.keys(historicalData.rates).sort();
            const rates = labels.map(date => historicalData.rates[date][toCurrency.value]);
            
            historyChart.data.labels = labels;
            historyChart.data.datasets = [{
                label: `${fromCurrency.value} a ${toCurrency.value}`,
                data: rates,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.4,
                fill: true
            }];
            historyChart.update();
        }
    }

    function updateFlags() {
        const fromFlagFile = fromCurrency.selectedOptions[0].getAttribute('data-flag');
        const toFlagFile = toCurrency.selectedOptions[0].getAttribute('data-flag');
        
        fromFlag.src = `img/${fromFlagFile}`;
        toFlag.src = `img/${toFlagFile}`;
        
        fromFlag.classList.add('animate__animated', 'animate__fadeIn');
        toFlag.classList.add('animate__animated', 'animate__fadeIn');
        setTimeout(() => {
            fromFlag.classList.remove('animate__animated', 'animate__fadeIn');
            toFlag.classList.remove('animate__animated', 'animate__fadeIn');
        }, 500);
    }

    async function convertCurrency() {
        const amount = parseFloat(amountInput.value);
        const from = fromCurrency.value;
        const to = toCurrency.value;

        if (!amount || amount <= 0) {
            clearConversionFields();
            return;
        }

        convertBtn.disabled = true;
        convertBtn.textContent = "Calculando...";

        try {
            const rate = await getExchangeRate(from, to);
            if (rate) {
                const result = amount * rate;
                resultInput.value = result.toFixed(2);
                rateInfo.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;
                
                resultInput.classList.add("animate__animated", "animate__bounceIn");
                setTimeout(() => {
                    resultInput.classList.remove("animate__animated", "animate__bounceIn");
                }, 1000);
            }
        } finally {
            convertBtn.disabled = false;
            convertBtn.textContent = "Convertir";
        }
    }

    function swapCurrencies() {
        const temp = fromCurrency.value;
        fromCurrency.value = toCurrency.value;
        toCurrency.value = temp;
        updateFlags();
        if (amountInput.value) convertCurrency();
        updateChart();
    }

    fromCurrency.addEventListener('change', () => {
        updateFlags();
        clearConversionFields();
        updateChart();
    });

    toCurrency.addEventListener('change', () => {
        updateFlags();
        clearConversionFields();
        updateChart();
    });

    amountInput.addEventListener('input', convertCurrency);
    convertBtn.addEventListener('click', convertCurrency);
    swapBtn.addEventListener('click', swapCurrencies);
    amountInput.addEventListener('keyup', (e) => e.key === 'Enter' && convertCurrency());

    timeButtons.forEach(button => {
        button.addEventListener('click', () => {
            timeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            updateChart(parseInt(button.dataset.days));
        });
    });

    updateFlags();
    updateChart();
});