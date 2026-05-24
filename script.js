let tractionData = null;
let chart = null;

const notchSlider = document.getElementById('notch-slider');
const speedSlider = document.getElementById('speed-slider');
const notchVal = document.getElementById('notch-val');
const speedVal = document.getElementById('speed-val');
const tractionVal = document.getElementById('traction-val');
const dataTableBody = document.querySelector('#data-table tbody');

// JSONデータの読み込み
async function init() {
    try {
        const response = await fetch('traction_data.json');
        tractionData = await response.json();
        
        setupEventListeners();
        initChart();
        updateDisplay();
    } catch (error) {
        console.error('データの読み込みに失敗しました:', error);
        alert('JSONデータの読み込みに失敗しました。ローカルサーバー（http://localhost 等）経由でアクセスしているか確認してください。');
    }
}

function setupEventListeners() {
    notchSlider.addEventListener('input', () => {
        notchVal.textContent = notchSlider.value;
        updateDisplay();
        updateChartDataset();
    });

    speedSlider.addEventListener('input', () => {
        const val = parseFloat(speedSlider.value).toFixed(1);
        speedVal.textContent = val;
        updateDisplay();
        highlightTableRow(val);
        updateChartProgressPoint();
    });
}

function updateDisplay() {
    if (!tractionData) return;
    
    const notch = notchSlider.value;
    const speed = parseFloat(speedSlider.value).toFixed(1);
    
    const val = tractionData[notch][speed];
    tractionVal.textContent = Math.round(val).toLocaleString();
    
    renderTable(notch, speed);
}

function renderTable(notch, currentSpeed) {
    const notchData = tractionData[notch];
    let html = '';
    
    const speeds = Object.keys(notchData).sort((a, b) => parseFloat(a) - parseFloat(b));
    
    speeds.forEach(speed => {
        const isCurrent = parseFloat(speed).toFixed(1) === parseFloat(currentSpeed).toFixed(1);
        const className = isCurrent ? 'class="highlight" id="row-' + parseFloat(speed).toFixed(1) + '"' : '';
        html += `<tr ${className}>
            <td>${parseFloat(speed).toFixed(1)}</td>
            <td>${Math.round(notchData[speed]).toLocaleString()}</td>
        </tr>`;
    });
    
    dataTableBody.innerHTML = html;
    scrollToActiveRow(currentSpeed);
}

function highlightTableRow(currentSpeed) {
    const rows = dataTableBody.querySelectorAll('tr');
    rows.forEach(row => row.classList.remove('highlight'));
    
    const activeRow = document.getElementById('row-' + currentSpeed);
    if (activeRow) {
        activeRow.classList.add('highlight');
        scrollToActiveRow(currentSpeed);
    }
}

function scrollToActiveRow(currentSpeed) {
    const activeRow = document.getElementById('row-' + currentSpeed);
    if (activeRow) {
        const wrapper = document.querySelector('.table-wrapper');
        // スムーズスクロールで中央付近に表示
        wrapper.scrollTop = activeRow.offsetTop - wrapper.offsetTop - (wrapper.clientHeight / 2) + (activeRow.clientHeight / 2);
    }
}

function getChartDataForNotch(notch) {
    const notchData = tractionData[notch];
    const speeds = Object.keys(notchData).sort((a, b) => parseFloat(a) - parseFloat(b));
    return speeds.map(s => ({ x: parseFloat(s), y: notchData[s] }));
}

function initChart() {
    const ctx = document.getElementById('tractionChart').getContext('2d');
    const notch = notchSlider.value;
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: `ノッチ ${notch} の引張力曲線`,
                    data: getChartDataForNotch(notch),
                    borderColor: '#3182ce',
                    backgroundColor: 'rgba(49, 130, 206, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    pointRadius: 0,
                    tension: 0.1
                },
                {
                    label: '現在の状態',
                    data: [], 
                    borderColor: '#e53e3e',
                    backgroundColor: '#e53e3e',
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    showLine: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: '速度 (km/h)' },
                    min: 0,
                    max: 85
                },
                y: {
                    title: { display: true, text: '動輪周引張力 (kg)' },
                    min: 0
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
    
    updateChartProgressPoint();
}

function updateChartDataset() {
    if (!chart || !tractionData) return;
    const notch = notchSlider.value;
    
    chart.data.datasets[0].label = `ノッチ ${notch} の引張力曲線`;
    chart.data.datasets[0].data = getChartDataForNotch(notch);
    
    updateChartProgressPoint();
}

function updateChartProgressPoint() {
    if (!chart || !tractionData) return;
    const notch = notchSlider.value;
    const speed = parseFloat(speedSlider.value).toFixed(1);
    const val = tractionData[notch][speed];
    
    chart.data.datasets[1].data = [{ x: parseFloat(speed), y: val }];
    chart.update();
}

window.addEventListener('DOMContentLoaded', init);
