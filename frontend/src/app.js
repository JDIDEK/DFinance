// DFinance Pro - Advanced Personal Finance Tracker
// Lamborghini-inspired design with enhanced functionality

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3001';
    
    // Application state
    const state = {
        transactions: [],
        goals: [],
        budgets: [],
        categories: {
            income: [],
            expense: []
        },
        currentFilter: 'all',
        analytics: {
            summary: null,
            trends: null
        }
    };

    // DOM elements
    const elements = {
        form: document.getElementById('transaction-form'),
        typeSelect: document.getElementById('type'),
        categorySelect: document.getElementById('category'),
        dateInput: document.getElementById('date'),
        transactionList: document.getElementById('transaction-list'),
        goalsList: document.getElementById('goals-list'),
        goalModal: document.getElementById('goal-modal'),
        goalForm: document.getElementById('goal-form'),
        liveTime: document.getElementById('live-time'),
    };

    // Chart instances
    let categoryChartInstance = null;
    let monthlyChartInstance = null;

    // Tutorial system
    let currentTutorialStep = 0;
    let tutorialActive = false;
    const tutorialSteps = [
        {
            target: '#live-time',
            title: '⚡ Temps en direct',
            content: 'L\'heure se met à jour en temps réel. Parfait pour suivre le temps que vous passez à gérer vos finances !',
            position: 'bottom'
        },
        {
            target: '#total-income',
            title: '💰 Revenus totaux',
            content: 'Ici s\'affichent tous vos revenus cumulés. Cette valeur se met à jour automatiquement à chaque nouvelle transaction.',
            position: 'bottom'
        },
        {
            target: '#total-expenses',
            title: '💸 Dépenses totales',
            content: 'Le total de toutes vos dépenses. Gardez un œil dessus pour contrôler votre budget !',
            position: 'bottom'
        },
        {
            target: '#net-balance',
            title: '⚖️ Solde net',
            content: 'Votre solde net (revenus - dépenses). En vert si positif, en rouge si négatif.',
            position: 'bottom'
        },
        {
            target: '#month-savings',
            title: '📈 Épargne du mois',
            content: 'Combien vous avez économisé ce mois-ci. L\'objectif est de garder ce chiffre positif !',
            position: 'bottom'
        },
        {
            target: '#transaction-form',
            title: '⚡ Ajouter une transaction',
            content: 'Formulaire principal pour ajouter vos revenus et dépenses. Remplissez simplement les champs et cliquez sur "ADD TRANSACTION".',
            position: 'right'
        },
        {
            target: '#type',
            title: '🔄 Type de transaction',
            content: 'Choisissez entre "Dépense" ou "Revenu". Les catégories changeront automatiquement selon votre choix.',
            position: 'right'
        },
        {
            target: '#category',
            title: '📂 Catégories',
            content: 'Sélectionnez la catégorie appropriée. Chaque catégorie a son icône pour faciliter l\'identification.',
            position: 'right'
        },
        {
            target: '#payment_method',
            title: '💳 Méthode de paiement',
            content: 'Indiquez comment vous avez payé : espèces, carte, virement, ou même crypto !',
            position: 'right'
        },
        {
            target: '#goals-list',
            title: '🎯 Objectifs financiers',
            content: 'Définissez et suivez vos objectifs d\'épargne. Ajoutez des montants pour voir votre progression !',
            position: 'right'
        },
        {
            target: '#add-goal-btn',
            title: '➕ Ajouter un objectif',
            content: 'Cliquez ici pour créer un nouvel objectif financier avec un montant cible et une date limite.',
            position: 'left'
        },
        {
            target: '#category-chart',
            title: '🍩 Graphique des catégories',
            content: 'Visualisez la répartition de vos dépenses par catégorie. Parfait pour identifier où va votre argent !',
            position: 'top'
        },
        {
            target: '#monthly-chart',
            title: '📊 Tendances mensuelles',
            content: 'Suivez l\'évolution de vos revenus et dépenses sur les 6 derniers mois. Idéal pour détecter les tendances.',
            position: 'top'
        },
        {
            target: '#filter-all',
            title: '🔍 Filtres de transactions',
            content: 'Filtrez vos transactions par type : toutes, revenus seulement, ou dépenses seulement.',
            position: 'left'
        },
        {
            target: '#transaction-list',
            title: '📋 Liste des transactions',
            content: 'Toutes vos transactions récentes s\'affichent ici. Vous pouvez les modifier ou les supprimer avec les boutons à droite.',
            position: 'top'
        }
    ];

    // Initialize application
    function initialize() {
        setupEventListeners();
        setupLiveTime();
        setDefaultDate();
        loadInitialData();
        setupChartDefaults();
        
        // Check if this is the first visit
        setTimeout(() => {
            if (!localStorage.getItem('dfinance_tutorial_completed')) {
                showWelcomeMessage();
            }
        }, 2000);
    }

    // Setup event listeners
    function setupEventListeners() {
        elements.form.addEventListener('submit', handleTransactionSubmit);
        elements.typeSelect.addEventListener('change', populateCategories);
        
        // Goal modal events
        document.getElementById('add-goal-btn').addEventListener('click', openGoalModal);
        document.getElementById('close-goal-modal').addEventListener('click', closeGoalModal);
        elements.goalForm.addEventListener('submit', handleGoalSubmit);
        
        // Filter buttons
        document.getElementById('filter-all').addEventListener('click', () => filterTransactions('all'));
        document.getElementById('filter-income').addEventListener('click', () => filterTransactions('income'));
        document.getElementById('filter-expense').addEventListener('click', () => filterTransactions('expense'));
        
        // Close modal on backdrop click
        elements.goalModal.addEventListener('click', (e) => {
            if (e.target === elements.goalModal) closeGoalModal();
        });
    }

    // Setup live time display
    function setupLiveTime() {
        function updateTime() {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            if (elements.liveTime) {
                elements.liveTime.textContent = timeString;
            }
        }
        updateTime();
        setInterval(updateTime, 1000);
    }

    // Set default date to today
    function setDefaultDate() {
        elements.dateInput.value = new Date().toISOString().split('T')[0];
    }

    // Setup Chart.js defaults
    function setupChartDefaults() {
        Chart.defaults.color = '#ffffff';
        Chart.defaults.borderColor = '#404040';
        Chart.defaults.backgroundColor = 'rgba(255, 107, 0, 0.1)';
    }

    // Load initial data
    async function loadInitialData() {
        try {
            showLoadingState();
            await Promise.all([
                fetchCategories(),
                fetchTransactions(),
                fetchGoals(),
                fetchAnalytics()
            ]);
            populateCategories();
            renderAll();
            hideLoadingState();
        } catch (error) {
            console.error('Error loading initial data:', error);
            showNotification('Error loading data. Please refresh the page.', 'error');
        }
    }

    // API calls
    async function fetchCategories() {
        try {
            const [incomeRes, expenseRes] = await Promise.all([
                fetch(`${API_URL}/categories?type=income`),
                fetch(`${API_URL}/categories?type=expense`)
            ]);
            
            state.categories.income = await incomeRes.json();
            state.categories.expense = await expenseRes.json();
        } catch (error) {
            console.error('Error fetching categories:', error);
            // Fallback to default categories
            state.categories = {
                income: [
                    { name: 'Salary', icon: '💰' },
                    { name: 'Freelance', icon: '💻' },
                    { name: 'Investment', icon: '📈' },
                    { name: 'Gift', icon: '🎁' }
                ],
                expense: [
                    { name: 'Food & Groceries', icon: '🍕' },
                    { name: 'Transport', icon: '🚗' },
                    { name: 'Housing & Utilities', icon: '🏠' },
                    { name: 'Entertainment', icon: '🎬' },
                    { name: 'Health', icon: '🏥' },
                    { name: 'Shopping', icon: '🛍️' }
                ]
            };
        }
    }

    async function fetchTransactions() {
        try {
            const response = await fetch(`${API_URL}/transactions`);
            if (!response.ok) throw new Error('Failed to fetch transactions');
            state.transactions = await response.json();
        } catch (error) {
            console.error('Error fetching transactions:', error);
            showNotification('Error loading transactions', 'error');
        }
    }

    async function fetchGoals() {
        try {
            const response = await fetch(`${API_URL}/goals`);
            if (!response.ok) throw new Error('Failed to fetch goals');
            state.goals = await response.json();
        } catch (error) {
            console.error('Error fetching goals:', error);
            showNotification('Error loading goals', 'error');
        }
    }

    async function fetchAnalytics() {
        try {
            const [summaryRes, trendsRes] = await Promise.all([
                fetch(`${API_URL}/analytics/summary`),
                fetch(`${API_URL}/analytics/trends`)
            ]);
            
            state.analytics.summary = await summaryRes.json();
            state.analytics.trends = await trendsRes.json();
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    }

    // Form handlers
    async function handleTransactionSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(elements.form);
        const editId = elements.form.getAttribute('data-edit-id');
        
        const transactionData = {
            type: formData.get('type'),
            description: formData.get('description'),
            amount: parseFloat(formData.get('amount')),
            date: formData.get('date'),
            category: formData.get('category'),
            payment_method: formData.get('payment_method') || 'cash',
            notes: formData.get('notes') || ''
        };

        try {
            showLoadingButton(elements.form.querySelector('button[type="submit"]'));
            
            let response;
            if (editId) {
                response = await fetch(`${API_URL}/transactions/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(transactionData)
                });
                
                if (response.ok) {
                    const updated = await response.json();
                    const index = state.transactions.findIndex(t => t.id == editId);
                    if (index !== -1) state.transactions[index] = updated;
                    showNotification('Transaction updated successfully!', 'success');
                }
            } else {
                response = await fetch(`${API_URL}/transactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(transactionData)
                });
                
                if (response.ok) {
                    const saved = await response.json();
                    state.transactions.unshift(saved);
                    showNotification('Transaction added successfully!', 'success');
                }
            }

            if (!response.ok) throw new Error('Failed to save transaction');

            resetForm();
            renderAll();
            
        } catch (error) {
            console.error('Error saving transaction:', error);
            showNotification('Error saving transaction. Please try again.', 'error');
        } finally {
            hideLoadingButton(elements.form.querySelector('button[type="submit"]'));
        }
    }

    async function handleGoalSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(elements.goalForm);
        const goalData = {
            title: formData.get('title') || document.getElementById('goal-title').value,
            target_amount: parseFloat(formData.get('amount') || document.getElementById('goal-amount').value),
            target_date: formData.get('date') || document.getElementById('goal-date').value,
            category: 'General'
        };

        try {
            const response = await fetch(`${API_URL}/goals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(goalData)
            });

            if (!response.ok) throw new Error('Failed to create goal');

            const saved = await response.json();
            state.goals.unshift(saved);
            
            closeGoalModal();
            renderGoals();
            showNotification('Goal created successfully!', 'success');
            
        } catch (error) {
            console.error('Error creating goal:', error);
            showNotification('Error creating goal. Please try again.', 'error');
        }
    }

    // UI functions
    function populateCategories() {
        const type = elements.typeSelect.value;
        const categories = state.categories[type] || [];
        
        elements.categorySelect.innerHTML = categories
            .map(cat => `<option value="${cat.name}">${cat.icon || '📊'} ${cat.name}</option>`)
            .join('');
    }

    function resetForm() {
        elements.form.reset();
        elements.form.removeAttribute('data-edit-id');
        elements.form.querySelector('button[type="submit"]').innerHTML = '⚡ ADD TRANSACTION';
        setDefaultDate();
        populateCategories();
    }

    function renderAll() {
        renderSummary();
        renderTransactionList();
        renderGoals();
        renderCategoryChart();
        renderMonthlyChart();
    }

    function renderSummary() {
        const totalIncome = state.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
        const totalExpenses = state.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
        const netBalance = totalIncome - totalExpenses;
        
        // Calculate this month's savings
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyIncome = state.transactions
            .filter(t => {
                const date = new Date(t.date);
                return t.type === 'income' && 
                       date.getMonth() === currentMonth && 
                       date.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
        const monthlyExpenses = state.transactions
            .filter(t => {
                const date = new Date(t.date);
                return t.type === 'expense' && 
                       date.getMonth() === currentMonth && 
                       date.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
        const monthlySavings = monthlyIncome - monthlyExpenses;

        // Update DOM
        document.getElementById('total-income').textContent = formatCurrency(totalIncome);
        document.getElementById('total-expenses').textContent = formatCurrency(totalExpenses);
        document.getElementById('net-balance').textContent = formatCurrency(netBalance);
        document.getElementById('month-savings').textContent = formatCurrency(monthlySavings);
        
        // Color coding
        const netBalanceElement = document.getElementById('net-balance');
        netBalanceElement.className = netBalance >= 0 ? 'text-3xl font-bold text-green-400 display-font' : 'text-3xl font-bold text-red-400 display-font';
        
        const monthSavingsElement = document.getElementById('month-savings');
        monthSavingsElement.className = monthlySavings >= 0 ? 'text-3xl font-bold text-blue-400 display-font' : 'text-3xl font-bold text-red-400 display-font';
    }

    function renderTransactionList() {
        const filteredTransactions = state.currentFilter === 'all' 
            ? state.transactions 
            : state.transactions.filter(t => t.type === state.currentFilter);

        if (filteredTransactions.length === 0) {
            elements.transactionList.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <span class="text-4xl">🏁</span>
                    <p class="mt-2">No ${state.currentFilter === 'all' ? '' : state.currentFilter + ' '}transactions yet. Start your financial journey!</p>
                </div>
            `;
            return;
        }

        elements.transactionList.innerHTML = filteredTransactions
            .slice(0, 20) // Limit to 20 recent transactions
            .map(transaction => {
                const isIncome = transaction.type === 'income';
                const amountColor = isIncome ? 'text-green-400' : 'text-red-400';
                const sign = isIncome ? '+' : '-';
                const bgColor = isIncome ? 'bg-green-500 bg-opacity-10' : 'bg-red-500 bg-opacity-10';
                const borderColor = isIncome ? 'border-green-500' : 'border-red-500';
                
                const formattedDate = new Date(transaction.date).toLocaleDateString('en-GB', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                });

                const categoryIcon = getCategoryIcon(transaction.category, transaction.type);
                const paymentMethodIcon = getPaymentMethodIcon(transaction.payment_method);

                return `
                    <div class="transaction-card ${bgColor} border-l-4 ${borderColor} flex items-center justify-between p-4 hover:scale-[1.02] transition-all duration-300">
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 rounded-full flex items-center justify-center ${bgColor} border ${borderColor}">
                                <span class="text-xl">${categoryIcon}</span>
                            </div>
                            <div>
                                <p class="font-semibold text-white text-lg">${transaction.description}</p>
                                <div class="flex items-center space-x-2 text-sm text-gray-400">
                                    <span>${formattedDate}</span>
                                    <span>•</span>
                                    <span>${transaction.category}</span>
                                    <span>•</span>
                                    <span>${paymentMethodIcon} ${transaction.payment_method?.replace('_', ' ') || 'cash'}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-4">
                            <p class="font-bold text-xl ${amountColor} display-font">${sign}${formatCurrency(Math.abs(transaction.amount))}</p>
                            <div class="flex space-x-2">
                                <button onclick="editTransaction(${transaction.id})" 
                                        class="p-2 bg-blue-500 bg-opacity-20 text-blue-400 rounded-lg hover:bg-opacity-30 transition-all"
                                        title="Edit Transaction">
                                    ✏️
                                </button>
                                <button onclick="deleteTransaction(${transaction.id})" 
                                        class="p-2 bg-red-500 bg-opacity-20 text-red-400 rounded-lg hover:bg-opacity-30 transition-all"
                                        title="Delete Transaction">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
    }

    function renderGoals() {
        if (state.goals.length === 0) {
            elements.goalsList.innerHTML = `
                <div class="text-center text-gray-400 py-4">
                    <span class="text-2xl">🎯</span>
                    <p class="mt-2 text-sm">No goals set. Click + to add your first goal!</p>
                </div>
            `;
            return;
        }

        elements.goalsList.innerHTML = state.goals.map(goal => {
            const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
            const isCompleted = progress >= 100;
            const statusColor = isCompleted ? 'text-green-400' : progress > 50 ? 'text-orange-400' : 'text-blue-400';
            
            const daysLeft = goal.target_date ? Math.ceil((new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
            
            return `
                <div class="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-orange-500 transition-all">
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="font-semibold text-white">${goal.title}</h4>
                        <span class="text-sm ${statusColor}">${Math.round(progress)}%</span>
                    </div>
                    <div class="goal-progress mb-3">
                        <div class="goal-progress-bar" style="width: ${progress}%"></div>
                    </div>
                    <div class="flex justify-between text-sm text-gray-400">
                        <span>${formatCurrency(goal.current_amount)} / ${formatCurrency(goal.target_amount)}</span>
                        ${daysLeft !== null ? `<span>${daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}</span>` : ''}
                    </div>
                    ${!isCompleted ? `
                        <button onclick="addToGoal(${goal.id})" 
                                class="mt-2 w-full text-xs bg-orange-500 bg-opacity-20 text-orange-400 py-1 rounded hover:bg-opacity-30 transition-all">
                            + Add Progress
                        </button>
                    ` : `
                        <div class="mt-2 text-center">
                            <span class="text-green-400 text-sm font-semibold">🏆 Goal Achieved!</span>
                        </div>
                    `}
                </div>
            `;
        }).join('');
    }

    function renderCategoryChart() {
        const ctx = document.getElementById('category-chart').getContext('2d');
        
        const expenseData = state.transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
                return acc;
            }, {});

        const labels = Object.keys(expenseData);
        const data = Object.values(expenseData);
        
        const chartData = {
            labels: labels.length > 0 ? labels : ['No expenses yet'],
            datasets: [{
                label: 'Expenses by Category',
                data: data.length > 0 ? data : [1],
                backgroundColor: [
                    '#FF6B00', '#FF8C00', '#FF4500', '#E55A00',
                    '#CC4900', '#B33F00', '#993600', '#802D00',
                    '#662400', '#4D1B00', '#331200', '#1A0900'
                ],
                borderColor: '#1a1a1a',
                borderWidth: 2,
                hoverOffset: 8
            }]
        };

        if (categoryChartInstance) {
            categoryChartInstance.data = chartData;
            categoryChartInstance.update();
        } else {
            categoryChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { 
                            position: 'bottom',
                            labels: {
                                color: '#ffffff',
                                font: { size: 12 }
                            }
                        },
                        tooltip: {
                            backgroundColor: '#1a1a1a',
                            titleColor: '#FF6B00',
                            bodyColor: '#ffffff',
                            borderColor: '#FF6B00',
                            borderWidth: 1,
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ${formatCurrency(context.parsed)}`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    function renderMonthlyChart() {
        const ctx = document.getElementById('monthly-chart').getContext('2d');
        
        // Get last 6 months of data
        const monthlyData = {};
        const now = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });
            monthlyData[monthKey] = { income: 0, expense: 0 };
        }

        state.transactions.forEach(t => {
            const date = new Date(t.date);
            const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });
            
            if (monthlyData[monthKey]) {
                monthlyData[monthKey][t.type] += parseFloat(t.amount);
            }
        });

        const labels = Object.keys(monthlyData);
        const incomeData = labels.map(month => monthlyData[month].income);
        const expenseData = labels.map(month => monthlyData[month].expense);

        const chartData = {
            labels: labels,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: 'rgba(0, 255, 136, 0.3)',
                    borderColor: '#00FF88',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    backgroundColor: 'rgba(255, 51, 102, 0.3)',
                    borderColor: '#FF3366',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                }
            ]
        };

        if (monthlyChartInstance) {
            monthlyChartInstance.data = chartData;
            monthlyChartInstance.update();
        } else {
            monthlyChartInstance = new Chart(ctx, {
                type: 'line',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: '#404040' },
                            ticks: {
                                color: '#ffffff',
                                callback: function(value) {
                                    return formatCurrency(value);
                                }
                            }
                        },
                        x: {
                            grid: { color: '#404040' },
                            ticks: { color: '#ffffff' }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: { color: '#ffffff' }
                        },
                        tooltip: {
                            backgroundColor: '#1a1a1a',
                            titleColor: '#FF6B00',
                            bodyColor: '#ffffff',
                            borderColor: '#FF6B00',
                            borderWidth: 1,
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // Utility functions
    function formatCurrency(amount) {
        return new Intl.NumberFormat('de-DE', { 
            style: 'currency', 
            currency: 'EUR' 
        }).format(amount);
    }

    function getCategoryIcon(category, type) {
        const icons = {
            // Income icons
            'Salary': '💰',
            'Freelance': '💻',
            'Investment': '📈',
            'Gift': '🎁',
            // Expense icons
            'Food & Groceries': '🍕',
            'Transport': '🚗',
            'Housing & Utilities': '🏠',
            'Entertainment': '🎬',
            'Health': '🏥',
            'Shopping': '🛍️',
            'Education': '📚',
            'Technology': '💻'
        };
        return icons[category] || (type === 'income' ? '💰' : '💸');
    }

    function getPaymentMethodIcon(method) {
        const icons = {
            'cash': '💵',
            'credit_card': '💳',
            'debit_card': '💳',
            'bank_transfer': '🏦',
            'crypto': '₿'
        };
        return icons[method] || '💵';
    }

    function filterTransactions(type) {
        state.currentFilter = type;
        
        // Update filter buttons
        document.querySelectorAll('[id^="filter-"]').forEach(btn => {
            btn.classList.remove('bg-orange-500', 'bg-opacity-30', 'text-orange-300');
            btn.classList.add('bg-opacity-20');
        });
        
        const activeBtn = document.getElementById(`filter-${type}`);
        activeBtn.classList.add('bg-orange-500', 'bg-opacity-30', 'text-orange-300');
        
        renderTransactionList();
    }

    function openGoalModal() {
        elements.goalModal.classList.remove('hidden');
        document.getElementById('goal-title').focus();
    }

    function closeGoalModal() {
        elements.goalModal.classList.add('hidden');
        elements.goalForm.reset();
    }

    function showLoadingState() {
        // Add loading spinners or skeleton screens
        console.log('Loading...');
    }

    function hideLoadingState() {
        console.log('Loading complete');
    }

    function showLoadingButton(button) {
        button.disabled = true;
        button.innerHTML = '<div class="loading-spinner mx-auto"></div>';
    }

    function hideLoadingButton(button) {
        button.disabled = false;
        button.innerHTML = '⚡ ADD TRANSACTION';
    }

    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl max-w-sm transform transition-all duration-300 ${
            type === 'success' ? 'bg-green-600' :
            type === 'error' ? 'bg-red-600' :
            type === 'warning' ? 'bg-orange-500' :
            'bg-blue-600'
        } text-white`;
        
        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <span class="text-xl">
                    ${type === 'success' ? '✅' :
                      type === 'error' ? '❌' :
                      type === 'warning' ? '⚠️' :
                      'ℹ️'}
                </span>
                <span class="font-semibold">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Global functions for onclick handlers
    window.editTransaction = function(id) {
        const transaction = state.transactions.find(t => t.id === id);
        if (!transaction) return;

        elements.form.elements['type'].value = transaction.type;
        populateCategories();
        elements.form.elements['description'].value = transaction.description;
        elements.form.elements['amount'].value = transaction.amount;
        elements.form.elements['date'].value = transaction.date;
        elements.form.elements['category'].value = transaction.category;
        elements.form.elements['payment_method'].value = transaction.payment_method || 'cash';
        
        elements.form.setAttribute('data-edit-id', id);
        elements.form.querySelector('button[type="submit"]').innerHTML = '⚡ UPDATE TRANSACTION';
        
        // Scroll to form
        elements.form.scrollIntoView({ behavior: 'smooth' });
        showNotification('Transaction loaded for editing', 'info');
    };

    window.deleteTransaction = async function(id) {
        if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/transactions/${id}`, { 
                method: 'DELETE' 
            });
            
            if (!response.ok) throw new Error('Failed to delete transaction');
            
            state.transactions = state.transactions.filter(t => t.id !== id);
            renderAll();
            showNotification('Transaction deleted successfully', 'success');
            
        } catch (error) {
            console.error('Error deleting transaction:', error);
            showNotification('Error deleting transaction. Please try again.', 'error');
        }
    };

    window.addToGoal = async function(goalId) {
        const amount = prompt('Enter amount to add to this goal:');
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return;

        try {
            const response = await fetch(`${API_URL}/goals/${goalId}/progress`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: parseFloat(amount) })
            });

            if (!response.ok) throw new Error('Failed to update goal progress');

            const updatedGoal = await response.json();
            const index = state.goals.findIndex(g => g.id === goalId);
            if (index !== -1) state.goals[index] = updatedGoal;
            
            renderGoals();
            showNotification(`Added ${formatCurrency(amount)} to goal!`, 'success');
            
        } catch (error) {
            console.error('Error updating goal:', error);
            showNotification('Error updating goal progress', 'error');
        }
    };

    // Initialize the application
    initialize();

    // Tutorial functions
    function startTutorial() {
        tutorialActive = true;
        currentTutorialStep = 0;
        createTutorialOverlay();
        showTutorialStep(currentTutorialStep);
        
        // Show tutorial start notification
        showNotification('🎓 Bienvenue dans le tour guidé de DFinance !', 'info');
    }

    function createTutorialOverlay() {
        // Create overlay with blur effect
        const overlay = document.createElement('div');
        overlay.id = 'tutorial-overlay';
        overlay.className = 'fixed inset-0 z-40 transition-all duration-500';
        overlay.style.backdropFilter = 'blur(4px) brightness(0.4)';
        overlay.style.webkitBackdropFilter = 'blur(4px) brightness(0.4)';
        document.body.appendChild(overlay);

        // Create tutorial tooltip
        const tooltip = document.createElement('div');
        tooltip.id = 'tutorial-tooltip';
        tooltip.className = 'fixed z-50 bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl p-6 shadow-2xl border border-orange-500 max-w-sm transition-all duration-500 transform';
        tooltip.innerHTML = `
            <div id="tutorial-content">
                <h3 id="tutorial-title" class="text-lg font-bold text-orange-400 mb-3"></h3>
                <p id="tutorial-text" class="text-gray-300 mb-4 leading-relaxed"></p>
                <div class="flex items-center justify-between">
                    <div id="tutorial-progress" class="text-xs text-gray-400"></div>
                    <div class="flex space-x-2">
                        <button id="tutorial-skip" class="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors">
                            Passer
                        </button>
                        <button id="tutorial-prev" class="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm transition-colors">
                            Précédent ←
                        </button>
                        <button id="tutorial-next" class="px-4 py-1 bg-orange-500 hover:bg-orange-400 text-white rounded-lg text-sm font-semibold transition-colors">
                            Suivant →
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(tooltip);

        // Add event listeners
        document.getElementById('tutorial-skip').addEventListener('click', endTutorial);
        document.getElementById('tutorial-prev').addEventListener('click', previousTutorialStep);
        document.getElementById('tutorial-next').addEventListener('click', nextTutorialStep);
        
        // Close tutorial on overlay click
        overlay.addEventListener('click', endTutorial);
    }

    function showTutorialStep(stepIndex) {
        const step = tutorialSteps[stepIndex];
        const target = document.querySelector(step.target);
        const tooltip = document.getElementById('tutorial-tooltip');
        
        if (!target || !tooltip) return;

        // Update tooltip content
        document.getElementById('tutorial-title').textContent = step.title;
        document.getElementById('tutorial-text').textContent = step.content;
        document.getElementById('tutorial-progress').textContent = `Étape ${stepIndex + 1} sur ${tutorialSteps.length}`;
        
        // Update button states
        const prevBtn = document.getElementById('tutorial-prev');
        const nextBtn = document.getElementById('tutorial-next');
        
        prevBtn.style.display = stepIndex === 0 ? 'none' : 'block';
        
        if (stepIndex === tutorialSteps.length - 1) {
            nextBtn.textContent = 'Terminer 🎉';
            nextBtn.classList.add('bg-green-500', 'hover:bg-green-400');
            nextBtn.classList.remove('bg-orange-500', 'hover:bg-orange-400');
        } else {
            nextBtn.textContent = 'Suivant →';
            nextBtn.classList.remove('bg-green-500', 'hover:bg-green-400');
            nextBtn.classList.add('bg-orange-500', 'hover:bg-orange-400');
        }

        // Highlight target element
        highlightElement(target);
        
        // Position tooltip
        positionTooltip(tooltip, target, step.position);
        
        // Scroll target into view
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function highlightElement(element) {
        // Remove previous highlights
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
        
        // Add highlight to current element
        element.classList.add('tutorial-highlight');
        
        // Add highlight styles if not already added
        if (!document.getElementById('tutorial-styles')) {
            const style = document.createElement('style');
            style.id = 'tutorial-styles';
            style.textContent = `
                .tutorial-highlight {
                    position: relative;
                    z-index: 45;
                    box-shadow: 0 0 0 4px rgba(255, 107, 0, 0.9), 0 0 30px rgba(255, 107, 0, 0.6), 0 0 60px rgba(255, 107, 0, 0.3);
                    border-radius: 12px;
                    animation: tutorialPulse 2.5s infinite;
                    backdrop-filter: none !important;
                    filter: brightness(1.2) contrast(1.1);
                    transform: scale(1.02);
                    transition: all 0.3s ease;
                }
                
                @keyframes tutorialPulse {
                    0%, 100% { 
                        box-shadow: 0 0 0 4px rgba(255, 107, 0, 0.9), 0 0 30px rgba(255, 107, 0, 0.6), 0 0 60px rgba(255, 107, 0, 0.3);
                        transform: scale(1.02);
                    }
                    50% { 
                        box-shadow: 0 0 0 8px rgba(255, 107, 0, 0.7), 0 0 40px rgba(255, 107, 0, 0.8), 0 0 80px rgba(255, 107, 0, 0.5);
                        transform: scale(1.04);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    function positionTooltip(tooltip, target, position) {
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const padding = 20;
        
        let top, left;
        
        switch (position) {
            case 'top':
                top = targetRect.top - tooltipRect.height - padding;
                left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = targetRect.bottom + padding;
                left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                left = targetRect.left - tooltipRect.width - padding;
                break;
            case 'right':
                top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                left = targetRect.right + padding;
                break;
            default:
                top = targetRect.bottom + padding;
                left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        }
        
        // Ensure tooltip stays within viewport
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        if (left < padding) left = padding;
        if (left + tooltipRect.width > windowWidth - padding) {
            left = windowWidth - tooltipRect.width - padding;
        }
        if (top < padding) top = padding;
        if (top + tooltipRect.height > windowHeight - padding) {
            top = windowHeight - tooltipRect.height - padding;
        }
        
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
        tooltip.style.transform = 'scale(1)';
        tooltip.style.opacity = '1';
    }

    function nextTutorialStep() {
        if (currentTutorialStep < tutorialSteps.length - 1) {
            currentTutorialStep++;
            showTutorialStep(currentTutorialStep);
        } else {
            endTutorial();
        }
    }

    function previousTutorialStep() {
        if (currentTutorialStep > 0) {
            currentTutorialStep--;
            showTutorialStep(currentTutorialStep);
        }
    }

    function endTutorial() {
        tutorialActive = false;
        
        // Remove tutorial elements
        const overlay = document.getElementById('tutorial-overlay');
        const tooltip = document.getElementById('tutorial-tooltip');
        const styles = document.getElementById('tutorial-styles');
        
        if (overlay) overlay.remove();
        if (tooltip) tooltip.remove();
        if (styles) styles.remove();
        
        // Remove highlights
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
        
        // Mark tutorial as completed
        localStorage.setItem('dfinance_tutorial_completed', 'true');
        
        showNotification('🎉 Tour guidé terminé ! Vous maîtrisez maintenant DFinance !', 'success');
    }

    function showWelcomeMessage() {
        const welcomeModal = document.createElement('div');
        welcomeModal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
        welcomeModal.innerHTML = `
            <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 border border-orange-500 shadow-2xl max-w-md mx-4 text-center">
                <div class="text-6xl mb-4">🏁</div>
                <h2 class="text-2xl font-bold text-white mb-4" style="font-family: 'Orbitron', monospace;">
                    Bienvenue dans DFinance Pro !
                </h2>
                <p class="text-gray-300 mb-6 leading-relaxed">
                    Votre gestionnaire financier personnel de niveau Lamborghini ! 
                    Voulez-vous découvrir toutes les fonctionnalités avec notre tour guidé interactif ?
                </p>
                <div class="flex space-x-4 justify-center">
                    <button id="start-tour-btn" class="px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2">
                        <span>🎓</span>
                        <span>Démarrer le tour</span>
                    </button>
                    <button id="skip-tour-btn" class="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-semibold transition-all duration-300">
                        Plus tard
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(welcomeModal);
        
        // Add event listeners
        document.getElementById('start-tour-btn').addEventListener('click', () => {
            welcomeModal.remove();
            setTimeout(startTutorial, 500);
        });
        
        document.getElementById('skip-tour-btn').addEventListener('click', () => {
            welcomeModal.remove();
            localStorage.setItem('dfinance_tutorial_completed', 'true');
        });
        
        // Close on backdrop click
        welcomeModal.addEventListener('click', (e) => {
            if (e.target === welcomeModal) {
                welcomeModal.remove();
                localStorage.setItem('dfinance_tutorial_completed', 'true');
            }
        });
    }

    // Expose tutorial function globally
    window.startTutorial = startTutorial;
});
