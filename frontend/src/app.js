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

    // Initialize application
    function initialize() {
        setupEventListeners();
        setupLiveTime();
        setDefaultDate();
        loadInitialData();
        setupChartDefaults();
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
});
