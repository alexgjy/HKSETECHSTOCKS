document.addEventListener('DOMContentLoaded', () => {
    const roboticsStocks = [
        { name: 'UBTECH', ticker: '9880.HK', color: '#38bdf8' },
        { name: 'RoboSense', ticker: '2498.HK', color: '#fb923c' }
    ];

    const aiStocks = [
        { name: 'SenseTime', ticker: '0020.HK', color: '#38bdf8' },
        { name: 'Tencent', ticker: '0700.HK', color: '#34d399' },
        { name: 'Alibaba', ticker: '9988.HK', color: '#818cf8' },
        { name: 'Baidu', ticker: '9888.HK', color: '#f472b6' }
    ];

    const consumerElectronicsStocks = [
        { name: 'Xiaomi', ticker: '1810.HK', color: '#38bdf8' },
        { name: 'Lenovo', ticker: '0992.HK', color: '#34d399' },
        { name: 'BYD Electronic', ticker: '0285.HK', color: '#818cf8' },
        { name: 'Sunny Optical', ticker: '2382.HK', color: '#fb923c' }
    ];
    
    const ecommerceStocks = [
        { name: 'Alibaba', ticker: '9988.HK', color: '#38bdf8' },
        { name: 'JD.com', ticker: '9618.HK', color: '#34d399' },
        { name: 'Meituan', ticker: '3690.HK', color: '#818cf8' },
        { name: 'Kuaishou', ticker: '1024.HK', color: '#fb923c' }
    ];

    const digitalAssetsStocks = [
        { name: 'OSL Group', ticker: '0863.HK', color: '#38bdf8' },
        { name: 'Victory Sec.', ticker: '8540.HK', color: '#34d399' },
        { name: 'Futu Holdings', ticker: '3588.HK', color: '#f472b6' },
        { name: 'ZhongAn Online', ticker: '6060.HK', color: '#818cf8' }
    ];

    async function fetchStockData(tickers) {
      const tickerString = tickers.join(',');
      const endpoint = `/api/stockdata?tickers=${tickerString}`;
      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        const result = await response.json();
        if (result.error) {
          throw new Error(`API returned an error: ${result.error}`);
        }
        return result.data;
      } catch (error) {
        console.error(`Failed to fetch stock data for ${tickers.join(', ')}:`, error);
        return null;
      }
    }

    async function renderLiveChart(ctx, stockConfig) {
        ctx.font = "16px Inter, sans-serif";
        ctx.fillStyle = "rgba(156, 163, 175, 0.8)";
        ctx.textAlign = "center";
        ctx.fillText("Loading Financial Data...", ctx.canvas.width / 2, ctx.canvas.height / 2);

        const tickers = stockConfig.map(stock => stock.ticker);
        
        try {
            const stockData = await fetchStockData(tickers);

            if (!stockData || Object.keys(stockData).length === 0) {
                throw new Error("No data returned from API.");
            }

            const labels = stockConfig.map(stock => stock.name);
            const prices = stockConfig.map(stock => {
                const tickerData = stockData[stock.ticker];
                return tickerData ? tickerData.regularMarketPrice : null;
            });
            const backgroundColors = stockConfig.map(stock => stock.color);
            
            const chartData = {
                labels: labels,
                datasets: [{
                    label: 'Current Market Price (HKD)',
                    data: prices,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => color + '99'),
                    borderWidth: 1
                }]
            };

            const barChartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: { 
                            color: 'rgba(156, 163, 175, 0.8)',
                            callback: function(value) { return 'HK$ ' + value.toFixed(2); } 
                        },
                        grid: { color: 'rgba(55, 65, 81, 0.5)' }
                    },
                    x: {
                        ticks: { color: 'rgba(156, 163, 175, 0.8)' },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.8)',
                        titleColor: 'rgba(249, 250, 251, 1)',
                        bodyColor: 'rgba(209, 213, 219, 1)',
                        borderColor: 'rgba(55, 65, 81, 1)',
                        borderWidth: 1,
                        usePointStyle: true,
                        callbacks: {
                            label: function(context) {
                                const lines = [];
                                let priceLabel = context.dataset.label || '';
                                if (priceLabel) {
                                    priceLabel += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    priceLabel += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'HKD' }).format(context.parsed.y);
                                }
                                lines.push(priceLabel);

                                const ticker = stockConfig[context.dataIndex].ticker;
                                const tickerData = stockData[ticker];
                                if (tickerData) {
                                    const change = tickerData.regularMarketChange.toFixed(2);
                                    const percentChange = (tickerData.regularMarketChangePercent * 100).toFixed(2);
                                    const sign = tickerData.regularMarketChange >= 0 ? '+' : '';
                                    lines.push(`Change: ${sign}${change} (${sign}${percentChange}%)`);
                                }
                                return lines;
                            }
                        }
                    }
                }
            };
            
            new Chart(ctx, {
                type: 'bar',
                data: chartData,
                options: barChartOptions
            });

        } catch (error) {
            console.error("Error rendering chart:", error);
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillText("Failed to load chart data. The API proxy may not be available.", ctx.canvas.width / 2, ctx.canvas.height / 2 - 10);
            ctx.font = "12px Inter, sans-serif";
            ctx.fillText("This is a client-side prototype. Ensure the serverless function is deployed.", ctx.canvas.width/2, ctx.canvas.height/2 + 10)
        }
    }

    const renderRoboticsChart = (ctx) => renderLiveChart(ctx, roboticsStocks);
    const renderAiChart = (ctx) => renderLiveChart(ctx, aiStocks);
    const renderConsumerElectronicsChart = (ctx) => renderLiveChart(ctx, consumerElectronicsStocks);
    const renderEcommerceChart = (ctx) => renderLiveChart(ctx, ecommerceStocks);
    const renderDigitalAssetsChart = (ctx) => renderLiveChart(ctx, digitalAssetsStocks);

    const chartMapping = {
        'roboticsChart': renderRoboticsChart,
        'aiChart': renderAiChart,
        'consumerElectronicsChart': renderConsumerElectronicsChart,
        'ecommerceChart': renderEcommerceChart,
        'digitalAssetsChart': renderDigitalAssetsChart
    };
    
    for (const [id, renderFunc] of Object.entries(chartMapping)) {
        const canvas = document.getElementById(id);
        if (canvas) {
            renderFunc(canvas.getContext('2d'));
        }
    }
    
    const allStockConfigs = {
        'Robotics': {stocks: roboticsStocks, canvasId: 'robotics-mini-chart'},
        'AI': {stocks: aiStocks, canvasId: 'ai-mini-chart'},
        'Consumer Electronics': {stocks: consumerElectronicsStocks, canvasId: 'consumer-electronics-mini-chart'},
        'E-commerce': {stocks: ecommerceStocks, canvasId: 'ecommerce-mini-chart'},
        'Digital Assets': {stocks: digitalAssetsStocks, canvasId: 'digital-assets-mini-chart'},
    };

    function renderMarketMovers(gainers, losers) {
        const container = document.getElementById('market-movers-content');
        if (!container) return;

        const createMoverHTML = (stock) => {
            const isGainer = stock.changePercent >= 0;
            const colorClass = isGainer ? 'text-green-400' : 'text-red-400';
            const icon = isGainer ? 'trending-up' : 'trending-down';
            const sign = isGainer ? '+' : '';

            return `
                <div class="flex items-center justify-between mover-item">
                    <div class="flex-1 min-w-0">
                        <p class="font-semibold text-white truncate">${stock.name}</p>
                        <p class="text-sm text-gray-400">${stock.ticker} &bull; ${stock.sector}</p>
                    </div>
                    <div class="flex items-center ${colorClass} font-semibold text-right">
                        <i data-lucide="${icon}" class="w-4 h-4 mr-1"></i>
                        <span>${sign}${(stock.changePercent * 100).toFixed(2)}%</span>
                    </div>
                </div>
            `;
        };

        container.innerHTML = `
            <div>
                <h4 class="text-lg font-semibold text-white mb-3">Top Gainers</h4>
                <div class="space-y-3">
                    ${gainers.map(createMoverHTML).join('')}
                </div>
            </div>
            <div>
                <h4 class="text-lg font-semibold text-white mb-3">Top Losers</h4>
                <div class="space-y-3">
                    ${losers.map(createMoverHTML).join('')}
                </div>
            </div>
        `;
        lucide.createIcons();
    }
    
    function renderSectorMiniChart(canvasId, sectorStocks, allData) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let totalChange = 0;
        let validStocks = 0;
        sectorStocks.forEach(stock => {
            const data = allData[stock.ticker];
            if (data && data.regularMarketChangePercent !== null) {
                totalChange += data.regularMarketChangePercent;
                validStocks++;
            }
        });
        
        const avgChange = validStocks > 0 ? totalChange / validStocks : 0;
        const isPositive = avgChange >= 0;
        const color = isPositive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';
        const borderColor = isPositive ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)';
        
        const chartData = {
            labels: ['Start', 'Mid', 'End'],
            datasets: [{
                data: [0, avgChange * 100, 0],
                fill: true,
                backgroundColor: color,
                borderColor: borderColor,
                borderWidth: 1.5,
                tension: 0.4,
                pointRadius: 0,
            }]
        };

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { display: false },
                x: { display: false }
            },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            animation: {
                duration: 500,
                easing: 'easeInOutQuad'
            }
        };

        new Chart(ctx, { type: 'line', data: chartData, options: chartOptions });
    }

    async function initMarketPulseDashboard() {
        const dashboard = document.getElementById('market-pulse-overview');
        if (!dashboard) return;

        const allStocks = [];
        let allTickers = new Set();
        Object.entries(allStockConfigs).forEach(([sectorName, config]) => {
            config.stocks.forEach(stock => {
                allStocks.push({ ...stock, sector: sectorName });
                allTickers.add(stock.ticker);
            });
        });
        
        const stockData = await fetchStockData(Array.from(allTickers));

        if (!stockData) {
            const container = document.getElementById('market-movers-content');
            if (container) {
                container.innerHTML = `<p class="text-red-400">Failed to load market data. Please try again later.</p>`;
            }
            return;
        }

        const processedStocks = allStocks
            .map(stock => {
                const data = stockData[stock.ticker];
                return data ? {
                    ...stock,
                    changePercent: data.regularMarketChangePercent || 0,
                } : null;
            })
            .filter(Boolean)
            .sort((a, b) => b.changePercent - a.changePercent);

        const gainers = processedStocks.slice(0, 3);
        const losers = processedStocks.slice(-3).reverse();
        
        renderMarketMovers(gainers, losers);

        Object.entries(allStockConfigs).forEach(([sectorName, config]) => {
            renderSectorMiniChart(config.canvasId, config.stocks, stockData);
        });
    }

    initMarketPulseDashboard();
});
