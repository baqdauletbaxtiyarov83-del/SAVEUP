const DEFAULT_SAMPLE_DATA = {
            transactions: [
                { id: 't1', amount: 500, date: '2026-09-15', category: 'Emergency', goalId: 'g1', note: 'Initial emergency fund deposit' },
                { id: 't2', amount: 300, date: '2026-09-20', category: 'Travel', goalId: 'g2', note: 'Flight savings' },
                { id: 't3', amount: 450, date: '2026-10-01', category: 'Education', goalId: 'g3', note: 'Course fee savings' },
                { id: 't4', amount: 200, date: '2026-10-10', category: 'Phone', goalId: '', note: 'Tech upgrades' },
                { id: 't5', amount: 750, date: '2026-10-22', category: 'Emergency', goalId: 'g1', note: 'Monthly stash' },
            ],
            goals: [
                { id: 'g1', name: 'Emergency Rainy Fund', target: 3000, current: 1250, date: '2026-12-31', category: 'Emergency' },
                { id: 'g2', name: 'Europe Summer Trip', target: 2500, current: 800, date: '2027-06-15', category: 'Travel' },
                { id: 'g3', name: 'Coding Bootcamp', target: 1200, current: 1200, date: '2026-11-01', category: 'Education' }
            ]
        };

        let appData = {
            transactions: [],
            goals: []
        };

        let activeTab = 'dashboard';
        let dashGrowthChartInstance = null;
        let dashCategoryChartInstance = null;
        let analyticsBarChartInstance = null;
        let analyticsCategoryBarChartInstance = null;
        let calcForecastChartInstance = null;
        let currentPageHistory = 1;
        const itemsPerPageHistory = 5;

        // --- MOTIVATIONAL QUOTES ---
        const MOTIVATION_QUOTES = [
            { quote: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett" },
            { quote: "A penny saved is a penny earned.", author: "Benjamin Franklin" },
            { quote: "Every little amount counts. Financial peace of mind starts today.", author: "SaveUp Wisdom" },
            { quote: "It’s not how much money you make, but how much money you keep.", author: "Robert Kiyosaki" },
            { quote: "Small habit changes compound into massive financial freedom.", author: "James Clear" }
        ];

        // --- INITIALIZATION ---
        window.addEventListener('DOMContentLoaded', () => {
            loadState();
            setupEventListeners();
            initializeIcons();
            switchTab('dashboard');
            calculateSavings(); // init calculator preview
        });

        function initializeIcons() {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }

        // --- LOCAL STORAGE HELPERS ---
        function loadState() {
            const saved = localStorage.getItem('SAVEUP_APP_DATA');
            if (saved) {
                try {
                    appData = JSON.parse(saved);
                } catch(e) {
                    appData = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_DATA));
                }
            } else {
                appData = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_DATA));
                saveState();
            }

            // Theme load
            if (localStorage.getItem('SAVEUP_THEME') === 'light') {
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add('light');
            } else {
                document.documentElement.classList.add('dark');
                document.documentElement.classList.remove('light');
            }
        }

        function saveState() {
            localStorage.setItem('SAVEUP_APP_DATA', JSON.stringify(appData));
            refreshUI();
        }

        function resetDemoData() {
            if (confirm('Are you sure you want to reset to initial sample data? Custom entries will be replaced.')) {
                appData = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_DATA));
                saveState();
                showToast('Demo data restored successfully!', 'success');
            }
        }

        // --- TAB NAVIGATION ---
        function switchTab(tabId) {
            activeTab = tabId;

            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));

            // Show selected
            const activeEl = document.getElementById(`tab-${tabId}`);
            if (activeEl) activeEl.classList.remove('hidden');

            // Update nav styles
            document.querySelectorAll('.nav-tab').forEach(tab => {
                if (tab.dataset.tab === tabId) {
                    tab.classList.add('bg-gradient-to-r', 'from-emerald-500/20', 'to-transparent', 'text-emerald-400', 'border-l-4', 'border-emerald-400');
                    tab.classList.remove('text-slate-400', 'light:text-slate-600');
                } else {
                    tab.classList.remove('bg-gradient-to-r', 'from-emerald-500/20', 'to-transparent', 'text-emerald-400', 'border-l-4', 'border-emerald-400');
                    tab.classList.add('text-slate-400', 'light:text-slate-600');
                }
            });

            // Refresh UI components for specific active view
            refreshUI();

            // Mobile menu close
            closeMobileMenu();
        }

        // --- UI REFRESH DISPATCHER ---
        function refreshUI() {
            renderDashboardMetrics();
            renderDashboardRecent();
            renderDashboardGoals();
            renderDashboardCharts();
            renderGoalsGrid();
            renderHistoryTable();
            renderAnalytics();
            renderBadges();
            initializeIcons();
        }

        // --- FORMATTING HELPERS ---
        function formatMoney(num) {
            return '$' + Number(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        function getCategoryIcon(category) {
            switch(category) {
                case 'Education': return 'graduation-cap';
                case 'Car': return 'car';
                case 'Phone': return 'smartphone';
                case 'Travel': return 'plane';
                case 'Business': return 'briefcase';
                case 'Emergency': return 'shield-alert';
                case 'Housing': return 'home';
                default: return 'piggy-bank';
            }
        }

        // --- DASHBOARD CALCULATIONS & RENDER ---
        function renderDashboardMetrics() {
            const totalSaved = appData.transactions.reduce((sum, t) => sum + Number(t.amount), 0);
            const totalGoalTarget = appData.goals.reduce((sum, g) => sum + Number(g.target), 0);
            const remaining = Math.max(0, totalGoalTarget - totalSaved);
            const pct = totalGoalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalGoalTarget) * 100)) : 0;

            document.getElementById('dash-total-saved').textContent = formatMoney(totalSaved);
            document.getElementById('dash-total-goal').textContent = formatMoney(totalGoalTarget);
            document.getElementById('dash-remaining-amount').textContent = formatMoney(remaining);
            document.getElementById('dash-progress-pct').textContent = `${pct}%`;
            document.getElementById('dash-progress-bar').style.width = `${pct}%`;

            // Calculate growth vs last month dummy/est
            const currentMonth = new Date().getMonth();
            const thisMonthTotal = appData.transactions
                .filter(t => new Date(t.date).getMonth() === currentMonth)
                .reduce((s, t) => s + Number(t.amount), 0);
            const growthPct = totalSaved > 0 ? Math.round((thisMonthTotal / totalSaved) * 100) : 0;
            document.getElementById('dash-growth-pct').textContent = growthPct;
        }

        function renderDashboardRecent() {
            const container = document.getElementById('dash-recent-list');
            container.innerHTML = '';

            const sorted = [...appData.transactions].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 4);

            if (sorted.length === 0) {
                container.innerHTML = `<p class="text-xs text-slate-400 py-4 text-center">No transactions recorded yet.</p>`;
                return;
            }

            sorted.forEach(t => {
                const icon = getCategoryIcon(t.category);
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between p-3 rounded-xl bg-navy-800/60 light:bg-slate-100 border border-slate-700/50 light:border-slate-200';
                item.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <i data-lucide="${icon}" class="w-4 h-4"></i>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-white dark:text-white light:text-slate-800">${t.note || t.category}</p>
                            <p class="text-[11px] text-slate-400">${t.date} • <span class="text-emerald-400/80">${t.category}</span></p>
                        </div>
                    </div>
                    <span class="text-sm font-bold text-emerald-400">+${formatMoney(t.amount)}</span>
                `;
                container.appendChild(item);
            });
        }

        function renderDashboardGoals() {
            const container = document.getElementById('dash-goals-highlight');
            container.innerHTML = '';

            if (appData.goals.length === 0) {
                container.innerHTML = `<p class="text-xs text-slate-400 py-4 text-center">No savings goals created.</p>`;
                return;
            }

            appData.goals.slice(0, 3).forEach(g => {
                const pct = Math.min(100, Math.round((g.current / g.target) * 100));
                const item = document.createElement('div');
                item.className = 'p-3 rounded-xl bg-navy-800/60 light:bg-slate-100 border border-slate-700/50 light:border-slate-200 space-y-2';
                item.innerHTML = `
                    <div class="flex items-center justify-between text-xs">
                        <span class="font-bold text-white dark:text-white light:text-slate-800">${g.name}</span>
                        <span class="font-semibold text-emerald-400">${pct}%</span>
                    </div>
                    <div class="w-full bg-navy-900 light:bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div class="bg-gradient-to-r from-emerald-400 to-cyan-400 h-full rounded-full" style="width: ${pct}%"></div>
                    </div>
                `;
                container.appendChild(item);
            });
        }

        // --- DASHBOARD CHARTS ---
        function renderDashboardCharts() {
            // 1. Line Growth Chart
            const ctx1 = document.getElementById('dashGrowthChart')?.getContext('2d');
            if (ctx1) {
                // Prepare aggregate monthly data
                const monthlySums = {};
                appData.transactions.forEach(t => {
                    const monthKey = t.date.substring(0, 7); // YYYY-MM
                    monthlySums[monthKey] = (monthlySums[monthKey] || 0) + Number(t.amount);
                });

                const labels = Object.keys(monthlySums).sort();
                const data = labels.map(k => monthlySums[k]);

                if (dashGrowthChartInstance) dashGrowthChartInstance.destroy();

                dashGrowthChartInstance = new Chart(ctx1, {
                    type: 'line',
                    data: {
                        labels: labels.length ? labels : ['No Data'],
                        datasets: [{
                            label: 'Monthly Deposit ($)',
                            data: data.length ? data : [0],
                            borderColor: '#10B981',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 3,
                            pointBackgroundColor: '#22D3EE',
                            pointRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94A3B8' } },
                            y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94A3B8' } }
                        }
                    }
                });
            }

            // 2. Category Doughnut
            const ctx2 = document.getElementById('dashCategoryChart')?.getContext('2d');
            if (ctx2) {
                const catSums = {};
                appData.transactions.forEach(t => {
                    catSums[t.category] = (catSums[t.category] || 0) + Number(t.amount);
                });

                const labels = Object.keys(catSums);
                const data = Object.values(catSums);

                if (dashCategoryChartInstance) dashCategoryChartInstance.destroy();

                dashCategoryChartInstance = new Chart(ctx2, {
                    type: 'doughnut',
                    data: {
                        labels: labels.length ? labels : ['Empty'],
                        datasets: [{
                            data: data.length ? data : [1],
                            backgroundColor: ['#10B981', '#06B6D4', '#6366F1', '#F59E0B', '#EC4899', '#8B5CF6', '#64748B'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom', labels: { color: '#94A3B8', boxWidth: 12 } }
                        }
                    }
                });
            }
        }

        // --- GOALS GRID RENDER ---
        function renderGoalsGrid() {
            const grid = document.getElementById('goals-grid');
            grid.innerHTML = '';

            if (appData.goals.length === 0) {
                grid.innerHTML = `
                    <div class="col-span-full glass-card p-12 text-center rounded-3xl space-y-3">
                        <i data-lucide="target" class="w-12 h-12 text-slate-500 mx-auto"></i>
                        <h3 class="text-lg font-bold text-white">No Savings Goals Set Yet</h3>
                        <p class="text-xs text-slate-400">Start defining targets for your dream house, car, or emergency funds.</p>
                        <button onclick="openGoalModal()" class="px-4 py-2 bg-emerald-500 text-navy-900 font-bold text-xs rounded-xl shadow">Create Goal Now</button>
                    </div>
                `;
                return;
            }

            appData.goals.forEach(g => {
                const pct = Math.min(100, Math.round((g.current / g.target) * 100));
                const remaining = Math.max(0, g.target - g.current);
                const isCompleted = g.current >= g.target;
                const icon = getCategoryIcon(g.category);

                const card = document.createElement('div');
                card.className = `glass-card p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between transition-all duration-300 ${isCompleted ? 'border-2 border-emerald-500/80 shadow-lg shadow-emerald-500/10' : 'hover:border-emerald-500/30'}`;

                card.innerHTML = `
                    <div>
                        <div class="flex items-start justify-between gap-3 mb-4">
                            <div class="flex items-center gap-3">
                                <div class="p-3 rounded-2xl ${isCompleted ? 'bg-emerald-500 text-navy-900' : 'bg-emerald-500/10 text-emerald-400'}">
                                    <i data-lucide="${icon}" class="w-6 h-6"></i>
                                </div>
                                <div>
                                    <h3 class="font-extrabold text-lg text-white dark:text-white light:text-slate-800">${g.name}</h3>
                                    <p class="text-xs text-slate-400">Target Date: ${g.date}</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-1">
                                <button onclick="editGoal('${g.id}')" class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-navy-700/50"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                                <button onclick="deleteGoal('${g.id}')" class="p-1.5 text-rose-400/70 hover:text-rose-400 rounded-lg hover:bg-rose-500/10"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                            </div>
                        </div>

                        <!-- Amounts -->
                        <div class="flex items-baseline justify-between mb-2">
                            <div>
                                <span class="text-2xl font-extrabold text-emerald-400">${formatMoney(g.current)}</span>
                                <span class="text-xs text-slate-400 font-medium">/ ${formatMoney(g.target)}</span>
                            </div>
                            <span class="text-xs font-bold px-2.5 py-1 rounded-full ${isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-navy-700 text-cyan-400'}">${pct}%</span>
                        </div>

                        <!-- Animated Progress Bar -->
                        <div class="w-full bg-navy-900 light:bg-slate-200 h-3 rounded-full overflow-hidden mb-3">
                            <div class="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-700" style="width: ${pct}%"></div>
                        </div>

                        <p class="text-xs text-slate-400 flex items-center justify-between">
                            <span>Remaining: <strong class="text-slate-200">${formatMoney(remaining)}</strong></span>
                            ${isCompleted ? '<span class="text-emerald-400 font-bold">🎉 Goal Smashed!</span>' : ''}
                        </p>
                    </div>

                    <div class="mt-5 pt-4 border-t border-slate-700/50 light:border-slate-200 flex items-center gap-2">
                        <button onclick="quickAddGoalMoney('${g.id}')" class="w-full py-2.5 rounded-xl bg-navy-700 light:bg-slate-100 hover:bg-navy-600 light:hover:bg-slate-200 text-emerald-400 font-bold text-xs transition flex items-center justify-center gap-2">
                            <i data-lucide="plus-circle" class="w-4 h-4"></i> Add Money To Goal
                        </button>
                    </div>
                `;
                grid.appendChild(card);
            });
        }

        // --- HISTORY LOG RENDER ---
        function renderHistoryTable() {
            const tbody = document.getElementById('history-table-body');
            tbody.innerHTML = '';

            const searchVal = document.getElementById('history-search')?.value.toLowerCase() || '';
            const filterCat = document.getElementById('history-filter-category')?.value || 'ALL';
            const sortVal = document.getElementById('history-sort')?.value || 'date-desc';

            let filtered = appData.transactions.filter(t => {
                const matchesSearch = t.note.toLowerCase().includes(searchVal) || t.category.toLowerCase().includes(searchVal);
                const matchesCat = filterCat === 'ALL' || t.category === filterCat;
                return matchesSearch && matchesCat;
            });

            // Sorting
            filtered.sort((a,b) => {
                if (sortVal === 'date-desc') return new Date(b.date) - new Date(a.date);
                if (sortVal === 'date-asc') return new Date(a.date) - new Date(b.date);
                if (sortVal === 'amount-desc') return b.amount - a.amount;
                if (sortVal === 'amount-asc') return a.amount - b.amount;
            });

            // Count text
            document.getElementById('history-count-text').textContent = `Showing ${filtered.length} entries`;

            if (filtered.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="p-8 text-center text-slate-400 text-xs">No savings entries match your filter.</td>
                    </tr>
                `;
                return;
            }

            // Simple Pagination
            const totalPages = Math.ceil(filtered.length / itemsPerPageHistory);
            if (currentPageHistory > totalPages) currentPageHistory = 1;

            const startIndex = (currentPageHistory - 1) * itemsPerPageHistory;
            const paginated = filtered.slice(startIndex, startIndex + itemsPerPageHistory);

            paginated.forEach(t => {
                const linkedGoal = appData.goals.find(g => g.id === t.goalId);
                const icon = getCategoryIcon(t.category);

                const row = document.createElement('tr');
                row.className = 'hover:bg-navy-700/30 light:hover:bg-slate-100/50 transition';
                row.innerHTML = `
                    <td class="p-4">
                        <div class="flex items-center gap-2.5">
                            <div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                                <i data-lucide="${icon}" class="w-4 h-4"></i>
                            </div>
                            <span class="font-semibold text-white dark:text-white light:text-slate-800">${t.category}</span>
                        </div>
                    </td>
                    <td class="p-4 text-slate-300 light:text-slate-600 text-xs">${t.date}</td>
                    <td class="p-4">
                        <p class="text-xs font-medium text-slate-200 light:text-slate-700">${t.note || '—'}</p>
                        ${linkedGoal ? `<span class="text-[10px] text-emerald-400 inline-flex items-center gap-1"><i data-lucide="link" class="w-3 h-3"></i> Goal: ${linkedGoal.name}</span>` : ''}
                    </td>
                    <td class="p-4 text-right font-extrabold text-emerald-400">+${formatMoney(t.amount)}</td>
                    <td class="p-4 text-center">
                        <button onclick="deleteTransaction('${t.id}')" class="p-1.5 text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition" title="Delete Entry">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });

            // Pagination Controls
            const pagContainer = document.getElementById('history-pagination');
            pagContainer.innerHTML = '';
            for (let i = 1; i <= totalPages; i++) {
                const btn = document.createElement('button');
                btn.className = `px-2.5 py-1 rounded-lg text-xs font-semibold ${i === currentPageHistory ? 'bg-emerald-500 text-navy-900' : 'bg-navy-700 text-slate-300'}`;
                btn.textContent = i;
                btn.onclick = () => { currentPageHistory = i; renderHistoryTable(); };
                pagContainer.appendChild(btn);
            }
        }

        // --- ANALYTICS VIEW ---
        function renderAnalytics() {
            const total = appData.transactions.reduce((s,t) => s + Number(t.amount), 0);
            const count = appData.transactions.length;
            const avg = count > 0 ? total / count : 0;

            document.getElementById('analytics-avg-save').textContent = formatMoney(avg);

            // Find top category
            const catMap = {};
            appData.transactions.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount); });
            let topCat = 'None';
            let maxCatVal = 0;
            Object.entries(catMap).forEach(([k,v]) => {
                if (v > maxCatVal) { maxCatVal = v; topCat = k; }
            });
            document.getElementById('analytics-top-category').textContent = topCat;

            // 1 Year projection (average monthly * 12)
            const projected = (total / Math.max(1, count)) * 12;
            document.getElementById('analytics-projection').textContent = formatMoney(projected);

            // Render Bar Charts
            const ctx1 = document.getElementById('analyticsBarChart')?.getContext('2d');
            if (ctx1) {
                const monthlySums = {};
                appData.transactions.forEach(t => {
                    const m = t.date.substring(0, 7);
                    monthlySums[m] = (monthlySums[m] || 0) + Number(t.amount);
                });
                const labels = Object.keys(monthlySums).sort();
                const data = labels.map(k => monthlySums[k]);

                if (analyticsBarChartInstance) analyticsBarChartInstance.destroy();
                analyticsBarChartInstance = new Chart(ctx1, {
                    type: 'bar',
                    data: {
                        labels: labels.length ? labels : ['No Data'],
                        datasets: [{
                            label: 'Deposited Amount ($)',
                            data: data.length ? data : [0],
                            backgroundColor: '#10B981',
                            borderRadius: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { grid: { display: false }, ticks: { color: '#94A3B8' } },
                            y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94A3B8' } }
                        }
                    }
                });
            }

            const ctx2 = document.getElementById('analyticsCategoryBarChart')?.getContext('2d');
            if (ctx2) {
                const labels = Object.keys(catMap);
                const data = Object.values(catMap);

                if (analyticsCategoryBarChartInstance) analyticsCategoryBarChartInstance.destroy();
                analyticsCategoryBarChartInstance = new Chart(ctx2, {
                    type: 'bar',
                    data: {
                        labels: labels.length ? labels : ['No Data'],
                        datasets: [{
                            label: 'Total Saved ($)',
                            data: data.length ? data : [0],
                            backgroundColor: '#06B6D4',
                            borderRadius: 8
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94A3B8' } },
                            y: { grid: { display: false }, ticks: { color: '#94A3B8' } }
                        }
                    }
                });
            }
        }

        // --- CALCULATOR ENGINE ---
        function calculateSavings() {
            const target = parseFloat(document.getElementById('calc-target').value) || 0;
            const initial = parseFloat(document.getElementById('calc-initial').value) || 0;
            const contrib = parseFloat(document.getElementById('calc-contribution').value) || 0;
            const freq = document.getElementById('calc-frequency').value;
            const ratePct = parseFloat(document.getElementById('calc-interest').value) || 0;

            if (target <= 0 || contrib <= 0) return;

            const monthlyRate = (ratePct / 100) / 12;
            const monthlyContrib = freq === 'weekly' ? contrib * 4.33 : contrib;

            let current = initial;
            let months = 0;
            let totalInterest = 0;

            const labels = ['Start'];
            const balanceData = [initial];

            while (current < target && months < 360) { // cap 30 yrs
                months++;
                const interest = current * monthlyRate;
                totalInterest += interest;
                current += monthlyContrib + interest;

                if (months % 3 === 0 || current >= target) {
                    labels.push(`Month ${months}`);
                    balanceData.push(Math.round(current));
                }
            }

            // Display Results
            document.getElementById('calc-res-time').textContent = `${months} Month${months !== 1 ? 's' : ''}`;
            
            const completionDate = new Date();
            completionDate.setMonth(completionDate.getMonth() + months);
            document.getElementById('calc-res-date').textContent = completionDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

            document.getElementById('calc-res-interest').textContent = formatMoney(totalInterest);

            // Chart forecast
            const ctx = document.getElementById('calcForecastChart')?.getContext('2d');
            if (ctx) {
                if (calcForecastChartInstance) calcForecastChartInstance.destroy();
                calcForecastChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Forecast Balance ($)',
                            data: balanceData,
                            borderColor: '#34D399',
                            backgroundColor: 'rgba(52, 211, 153, 0.1)',
                            fill: true,
                            tension: 0.3
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94A3B8' } },
                            y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94A3B8' } }
                        }
                    }
                });
            }
        }

        // --- MOTIVATION & BADGES ---
        function renderBadges() {
            const totalSaved = appData.transactions.reduce((s,t) => s + Number(t.amount), 0);
            const totalGoalsCompleted = appData.goals.filter(g => g.current >= g.target).length;

            const badges = [
                { title: 'First Deposit', desc: 'Made your first savings entry', unlocked: appData.transactions.length > 0, icon: 'shield-check' },
                { title: 'Goal Smasher', desc: 'Completed at least 1 goal 100%', unlocked: totalGoalsCompleted > 0, icon: 'trophy' },
                { title: 'High Roller', desc: 'Accumulated over $1,000 saved', unlocked: totalSaved >= 1000, icon: 'zap' },
                { title: 'Savings Master', desc: 'Accumulated over $5,000 saved', unlocked: totalSaved >= 5000, icon: 'crown' }
            ];

            const grid = document.getElementById('badges-grid');
            grid.innerHTML = '';

            badges.forEach(b => {
                const card = document.createElement('div');
                card.className = `glass-card p-5 rounded-2xl border flex items-center gap-4 ${b.unlocked ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-800 opacity-60'}`;
                card.innerHTML = `
                    <div class="p-3 rounded-xl ${b.unlocked ? 'bg-emerald-500 text-navy-900 shadow-lg shadow-emerald-500/20' : 'bg-navy-700 text-slate-500'}">
                        <i data-lucide="${b.icon}" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-sm text-white dark:text-white light:text-slate-800">${b.title}</h4>
                        <p class="text-xs text-slate-400 mt-0.5">${b.desc}</p>
                        <span class="inline-block mt-2 text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-md ${b.unlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-navy-700 text-slate-500'}">
                            ${b.unlocked ? 'Unlocked' : 'Locked'}
                        </span>
                    </div>
                `;
                grid.appendChild(card);
            });
        }

        function getNewQuote() {
            const randomIndex = Math.floor(Math.random() * MOTIVATION_QUOTES.length);
            const q = MOTIVATION_QUOTES[randomIndex];
            document.getElementById('daily-quote-text').textContent = `"${q.quote}"`;
            document.getElementById('daily-quote-author').textContent = `— ${q.author}`;
        }

        // --- DEPOSIT MODAL ACTIONS ---
        function openDepositModal() {
            // Populate goal options select
            const goalSelect = document.getElementById('dep-goal-id');
            goalSelect.innerHTML = `<option value="">-- General Savings (No Goal Link) --</option>`;
            appData.goals.forEach(g => {
                goalSelect.innerHTML += `<option value="${g.id}">${g.name} (${formatMoney(g.current)} / ${formatMoney(g.target)})</option>`;
            });

            document.getElementById('dep-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('deposit-modal').classList.remove('hidden');
        }

        function closeDepositModal() {
            document.getElementById('deposit-modal').classList.add('hidden');
            document.getElementById('deposit-form').reset();
        }

        function handleDepositSubmit(e) {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('dep-amount').value);
            const date = document.getElementById('dep-date').value;
            const category = document.getElementById('dep-category').value;
            const goalId = document.getElementById('dep-goal-id').value;
            const note = document.getElementById('dep-note').value.trim();

            if (!amount || amount <= 0) {
                showToast('Please enter a valid deposit amount', 'error');
                return;
            }

            const newTx = {
                id: 't_' + Date.now(),
                amount,
                date,
                category,
                goalId,
                note: note || `${category} deposit`
            };

            appData.transactions.push(newTx);

            // If linked to goal, update goal amount
            if (goalId) {
                const targetGoal = appData.goals.find(g => g.id === goalId);
                if (targetGoal) {
                    targetGoal.current += amount;
                    if (targetGoal.current >= targetGoal.target) {
                        triggerConfetti();
                        showToast(`🎉 Milestone reached! You smashed your goal "${targetGoal.name}"!`, 'success');
                    }
                }
            }

            saveState();
            closeDepositModal();
            showToast(`Added deposit of ${formatMoney(amount)} successfully!`, 'success');
        }

        // --- GOAL MODAL ACTIONS ---
        function openGoalModal() {
            document.getElementById('goal-id').value = '';
            document.getElementById('goal-modal-title').innerHTML = `<i data-lucide="target" class="w-5 h-5 text-emerald-400"></i> Create Savings Goal`;
            document.getElementById('goal-form').reset();
            document.getElementById('goal-modal').classList.remove('hidden');
            initializeIcons();
        }

        function closeGoalModal() {
            document.getElementById('goal-modal').classList.add('hidden');
        }

        function editGoal(goalId) {
            const goal = appData.goals.find(g => g.id === goalId);
            if (!goal) return;

            document.getElementById('goal-id').value = goal.id;
            document.getElementById('goal-name').value = goal.name;
            document.getElementById('goal-target').value = goal.target;
            document.getElementById('goal-current').value = goal.current;
            document.getElementById('goal-date').value = goal.date;
            document.getElementById('goal-category').value = goal.category;

            document.getElementById('goal-modal-title').innerHTML = `<i data-lucide="edit-3" class="w-5 h-5 text-emerald-400"></i> Edit Savings Goal`;
            document.getElementById('goal-modal').classList.remove('hidden');
            initializeIcons();
        }

        function handleGoalSubmit(e) {
            e.preventDefault();
            const id = document.getElementById('goal-id').value;
            const name = document.getElementById('goal-name').value.trim();
            const target = parseFloat(document.getElementById('goal-target').value);
            const current = parseFloat(document.getElementById('goal-current').value) || 0;
            const date = document.getElementById('goal-date').value;
            const category = document.getElementById('goal-category').value;

            if (!name || target <= 0) {
                showToast('Please fill all required goal fields accurately.', 'error');
                return;
            }

            if (id) {
                // Edit existing
                const existingIndex = appData.goals.findIndex(g => g.id === id);
                if (existingIndex !== -1) {
                    appData.goals[existingIndex] = { id, name, target, current, date, category };
                    showToast('Goal updated successfully!', 'success');
                }
            } else {
                // Create new
                const newGoal = {
                    id: 'g_' + Date.now(),
                    name,
                    target,
                    current,
                    date,
                    category
                };
                appData.goals.push(newGoal);
                showToast('New Savings Goal created!', 'success');
            }

            saveState();
            closeGoalModal();
        }

        function deleteGoal(goalId) {
            if (confirm('Are you sure you want to delete this goal?')) {
                appData.goals = appData.goals.filter(g => g.id !== goalId);
                saveState();
                showToast('Savings goal deleted.', 'info');
            }
        }

        function quickAddGoalMoney(goalId) {
            openDepositModal();
            document.getElementById('dep-goal-id').value = goalId;
        }

        function deleteTransaction(txId) {
            if (confirm('Delete this deposit entry? Total balance will recalculate.')) {
                appData.transactions = appData.transactions.filter(t => t.id !== txId);
                saveState();
                showToast('Entry removed successfully', 'info');
            }
        }

        // --- CSV EXPORT ---
        function exportToCSV() {
            if (appData.transactions.length === 0) {
                showToast('No entries to export', 'error');
                return;
            }

            let csvContent = "data:text/csv;charset=utf-8,ID,Date,Category,Amount,Note\n";
            appData.transactions.forEach(t => {
                csvContent += `"${t.id}","${t.date}","${t.category}","${t.amount}","${t.note.replace(/"/g, '""')}"\n`;
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `SaveUp_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('CSV Export generated!', 'success');
        }

        // --- CONFETTI ANIMATION ---
        function triggerConfetti() {
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 120,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        }

        // --- TOAST NOTIFICATION SYSTEM ---
        function showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');

            const bgClass = type === 'success' ? 'bg-emerald-600 text-white' : type === 'error' ? 'bg-rose-600 text-white' : 'bg-navy-700 text-white';
            toast.className = `px-4 py-3 rounded-2xl shadow-xl font-medium text-xs flex items-center gap-2 pointer-events-auto transform transition-all duration-300 translate-y-2 opacity-0 ${bgClass}`;

            toast.innerHTML = `
                <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info'}" class="w-4 h-4"></i>
                <span>${message}</span>
            `;

            container.appendChild(toast);
            initializeIcons();

            setTimeout(() => {
                toast.classList.remove('translate-y-2', 'opacity-0');
            }, 10);

            setTimeout(() => {
                toast.classList.add('opacity-0', 'translate-y-2');
                setTimeout(() => toast.remove(), 300);
            }, 3500);
        }

        // --- EVENT LISTENERS & MENU CONTROLS ---
        function setupEventListeners() {
            // Navigation tabs
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    e.preventDefault();
                    switchTab(tab.dataset.tab);
                });
            });

            // Mobile menu handlers
            const mobileBtn = document.getElementById('mobile-menu-btn');
            const closeBtn = document.getElementById('close-mobile-menu');
            const overlay = document.getElementById('mobile-menu-overlay');

            mobileBtn?.addEventListener('click', openMobileMenu);
            closeBtn?.addEventListener('click', closeMobileMenu);
            overlay?.addEventListener('click', closeMobileMenu);

            // Theme toggles
            document.getElementById('theme-toggle-sidebar')?.addEventListener('click', toggleTheme);
            document.getElementById('theme-toggle-mobile')?.addEventListener('click', toggleTheme);
            document.getElementById('reset-data-btn')?.addEventListener('click', resetDemoData);

            // History table search and filters
            document.getElementById('history-search')?.addEventListener('input', () => { currentPageHistory = 1; renderHistoryTable(); });
            document.getElementById('history-filter-category')?.addEventListener('change', () => { currentPageHistory = 1; renderHistoryTable(); });
            document.getElementById('history-sort')?.addEventListener('change', () => { currentPageHistory = 1; renderHistoryTable(); });
        }

        function openMobileMenu() {
            document.getElementById('sidebar').classList.remove('-translate-x-full');
            document.getElementById('mobile-menu-overlay').classList.remove('hidden');
        }

        function closeMobileMenu() {
            document.getElementById('sidebar').classList.add('-translate-x-full');
            document.getElementById('mobile-menu-overlay').classList.add('hidden');
        }

        function toggleTheme() {
            const html = document.documentElement;
            if (html.classList.contains('dark')) {
                html.classList.remove('dark');
                html.classList.add('light');
                localStorage.setItem('SAVEUP_THEME', 'light');
            } else {
                html.classList.remove('light');
                html.classList.add('dark');
                localStorage.setItem('SAVEUP_THEME', 'dark');
            }
            // Re-render charts for crisp color theme alignment
            renderDashboardCharts();
            renderAnalytics();
            calculateSavings();
        }