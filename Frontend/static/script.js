// Global state
let allEvents = [];
let analyticsEvents = [];
let filteredEvents = [];
let currentFilter = 'all';
let currentDateFilter = 'all';
let searchQuery = '';
let previousEventCount = 0;
let soundEnabled = true;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Load theme preference
    loadTheme();
    
    // Initialize components
    initThemeToggle();
    initFilters();
    initSearch();
    initExport();
    initModal();
    initChart();
    
    // Fetch initial data
    fetchEvents();
    
    // Fetch analytics data for the chart
    fetchAnalyticsEvents();
    
    // Start polling - both regular events and analytics
    setInterval(fetchEvents, 15000);
    setInterval(fetchAnalyticsEvents, 15000);
}

// Theme Toggle
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }
}

function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        
        // Update icon
        const icon = themeToggle.querySelector('i');
        icon.className = isLight ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        
        // Update chart colors
        updateChartTheme();
    });
    
    // Set initial icon
    const icon = themeToggle.querySelector('i');
    if (document.body.classList.contains('light-theme')) {
        icon.className = 'fa-solid fa-sun';
    }
}

// Filters
function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Apply filter
            currentFilter = btn.dataset.filter;
            applyFilters();
        });
    });
    
    // Date filter
    const dateFilter = document.getElementById('dateFilter');
    dateFilter.addEventListener('change', (e) => {
        currentDateFilter = e.target.value;
        applyFilters();
    });
}

// Search
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        applyFilters();
    });
}

function applyFilters() {
    filteredEvents = allEvents.filter(event => {
        // Filter by type
        if (currentFilter !== 'all' && event.action !== currentFilter) {
            return false;
        }
        
        // Filter by date
        if (currentDateFilter !== 'all') {
            const eventDate = new Date(event.timestamp);
            const now = new Date();
            
            if (currentDateFilter === 'today') {
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                if (eventDate < today) return false;
            } else if (currentDateFilter === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                if (eventDate < weekAgo) return false;
            } else if (currentDateFilter === 'month') {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                if (eventDate < monthAgo) return false;
            }
        }
        
        // Filter by search query
        if (searchQuery) {
            const authorMatch = event.author && event.author.toLowerCase().includes(searchQuery);
            const branchMatch = (event.from_branch && event.from_branch.toLowerCase().includes(searchQuery)) ||
                              (event.to_branch && event.to_branch.toLowerCase().includes(searchQuery));
            if (!authorMatch && !branchMatch) {
                return false;
            }
        }
        
        return true;
    });
    
    renderEvents();
    updateStats(filteredEvents);
}

// Export
function initExport() {
    const exportBtn = document.getElementById('exportBtn');
    exportBtn.addEventListener('click', () => {
        exportData();
    });
}

function exportData() {
    const dataToExport = filteredEvents.length > 0 ? filteredEvents : allEvents;
    
    // Create CSV content
    const headers = ['Author', 'Action', 'From Branch', 'To Branch', 'Timestamp'];
    const csvContent = [
        headers.join(','),
        ...dataToExport.map(event => [
            event.author,
            event.action,
            event.from_branch || '',
            event.to_branch,
            event.timestamp
        ].map(field => `"${field}"`).join(','))
    ].join('\n');
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `github_events_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('export', 'Export Complete', `Exported ${dataToExport.length} events to CSV`);
}

// Modal
function initModal() {
    const modal = document.getElementById('eventModal');
    const closeBtn = document.getElementById('modalClose');
    
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

// Chart
let activityChart = null;

function initChart() {
    const ctx = document.getElementById('activityChart');
    if (!ctx) return;
    
    const isLight = document.body.classList.contains('light-theme');
    const textColor = isLight ? '#57606a' : '#8b949e';
    const gridColor = isLight ? '#d0d7de' : '#30363d';
    
    activityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Push',
                    data: [],
                    backgroundColor: 'rgba(35, 134, 54, 0.7)',
                    borderColor: '#238636',
                    borderWidth: 1
                },
                {
                    label: 'Pull Request',
                    data: [],
                    backgroundColor: 'rgba(56, 139, 253, 0.7)',
                    borderColor: '#58a6ff',
                    borderWidth: 1
                },
                {
                    label: 'Merge',
                    data: [],
                    backgroundColor: 'rgba(163, 113, 247, 0.7)',
                    borderColor: '#a371f7',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                y: {
                    stacked: true,
                    ticks: { color: textColor, stepSize: 1 },
                    grid: { color: gridColor }
                }
            },
            plugins: {
                legend: {
                    labels: { color: textColor }
                }
            }
        }
    });
}

function updateChartTheme() {
    if (!activityChart) return;
    
    const isLight = document.body.classList.contains('light-theme');
    const textColor = isLight ? '#57606a' : '#8b949e';
    const gridColor = isLight ? '#d0d7de' : '#30363d';
    
    activityChart.options.scales.x.ticks.color = textColor;
    activityChart.options.scales.x.grid.color = gridColor;
    activityChart.options.scales.y.ticks.color = textColor;
    activityChart.options.scales.y.grid.color = gridColor;
    activityChart.options.plugins.legend.labels.color = textColor;
    activityChart.update();
}

function updateChart(events) {
    if (!activityChart || events.length === 0) {
        // Show last 7 days with empty data
        const labels = [];
        const pushData = [];
        const prData = [];
        const mergeData = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
            labels.push(dateStr);
            pushData.push(0);
            prData.push(0);
            mergeData.push(0);
        }
        
        activityChart.data.labels = labels;
        activityChart.data.datasets[0].data = pushData;
        activityChart.data.datasets[1].data = prData;
        activityChart.data.datasets[2].data = mergeData;
        activityChart.update();
        return;
    }
    
    // Group events by date and type
    const last7Days = {};
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toLocaleDateString('en-US', { weekday: 'short' });
        last7Days[dateKey] = { PUSH: 0, PULL_REQUEST: 0, MERGE: 0 };
    }
    
    events.forEach(event => {
        const eventDate = new Date(event.timestamp);
        const now = new Date();
        const daysDiff = Math.floor((now - eventDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 6) {
            const dateKey = eventDate.toLocaleDateString('en-US', { weekday: 'short' });
            if (last7Days[dateKey]) {
                last7Days[dateKey][event.action]++;
            }
        }
    });
    
    const labels = Object.keys(last7Days);
    activityChart.data.labels = labels;
    activityChart.data.datasets[0].data = labels.map(d => last7Days[d].PUSH);
    activityChart.data.datasets[1].data = labels.map(d => last7Days[d].PULL_REQUEST);
    activityChart.data.datasets[2].data = labels.map(d => last7Days[d].MERGE);
    activityChart.update();
}

// Fetch Events
function fetchEvents() {
    fetch('/events')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(events => {
            // Check for new events
            if (previousEventCount > 0 && events.length > previousEventCount) {
                const newEvents = events.slice(0, events.length - previousEventCount);
                newEvents.forEach(event => {
                    showToast(event.action.toLowerCase(), 'New Event', `${event.author} ${getActionText(event.action)}`);
                    playNotificationSound();
                });
            }
            previousEventCount = events.length;
            
            allEvents = events;
            applyFilters();
            
            // Update last updated time
            const now = new Date();
            document.getElementById('last-updated').textContent = `Last updated: ${now.toLocaleTimeString()}`;
            document.getElementById('footer-updated').textContent = `Last updated: ${now.toLocaleTimeString()}`;
        })
        .catch(error => {
            console.error("UI Fetch Error:", error);
        })
        .finally(() => {
            // Hide loading overlay
            const loading = document.getElementById('loading');
            if (loading) {
                loading.classList.add('hidden');
            }
        });
}

// Fetch Analytics Events - for real-time chart updates
function fetchAnalyticsEvents() {
    fetch('/events/analytics')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(events => {
            analyticsEvents = events;
            // Update chart with analytics data
            updateChart(analyticsEvents);
        })
        .catch(error => {
            console.error("Analytics Fetch Error:", error);
        });
}

function getActionText(action) {
    switch (action) {
        case 'PUSH': return 'pushed to';
        case 'PULL_REQUEST': return 'created a pull request in';
        case 'MERGE': return 'merged to';
        default: return 'performed an action in';
    }
}

// Update Stats
function updateStats(events) {
    let pushCount = 0;
    let prCount = 0;
    let mergeCount = 0;
    
    events.forEach(event => {
        if (event.action === 'PUSH') pushCount++;
        else if (event.action === 'PULL_REQUEST') prCount++;
        else if (event.action === 'MERGE') mergeCount++;
    });
    
    document.getElementById('push-count').textContent = pushCount;
    document.getElementById('pr-count').textContent = prCount;
    document.getElementById('merge-count').textContent = mergeCount;
    document.getElementById('total-count').textContent = events.length;
}

// Render Events
function renderEvents() {
    const eventCards = document.getElementById('event-cards');
    eventCards.innerHTML = '';
    
    const eventsToRender = filteredEvents.length > 0 ? filteredEvents : allEvents;
    
    if (eventsToRender.length === 0) {
        eventCards.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-inbox"></i>
                <p>No events found. Push to your repository to see activity here!</p>
            </div>
        `;
        return;
    }
    
    eventsToRender.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.classList.add('event-card');
        
        const eventInfo = document.createElement('div');
        eventInfo.classList.add('event-info');
        
        const eventAuthor = document.createElement('p');
        eventAuthor.classList.add('event-author');
        eventAuthor.innerHTML = `<strong>${event.author}</strong>`;
        
        const eventBranches = document.createElement('p');
        eventBranches.classList.add('event-branches');
        if (event.action === 'PUSH') {
            eventBranches.textContent = `→ ${event.to_branch}`;
        } else {
            eventBranches.textContent = `${event.from_branch || 'unknown'} → ${event.to_branch}`;
        }
        
        eventInfo.appendChild(eventAuthor);
        eventInfo.appendChild(eventBranches);
        
        const actionTag = document.createElement('span');
        actionTag.classList.add('event-action', event.action.toLowerCase());
        actionTag.textContent = event.action.replace('_', ' ');
        
        const eventTimestamp = document.createElement('p');
        eventTimestamp.classList.add('event-timestamp');
        eventTimestamp.textContent = event.timestamp;
        
        eventCard.appendChild(eventInfo);
        eventCard.appendChild(actionTag);
        eventCard.appendChild(eventTimestamp);
        
        // Add click event for modal
        eventCard.addEventListener('click', () => {
            showEventDetails(event);
        });
        
        eventCards.appendChild(eventCard);
    });
}

// Show Event Details Modal
function showEventDetails(event) {
    const modal = document.getElementById('eventModal');
    const detailsPre = document.getElementById('eventDetails');
    
    const formattedEvent = {
        author: event.author,
        action: event.action,
        from_branch: event.from_branch,
        to_branch: event.to_branch,
        timestamp: event.timestamp,
        request_id: event.request_id,
        created_at: event.created_at
    };
    
    detailsPre.textContent = JSON.stringify(formattedEvent, null, 2);
    modal.classList.add('active');
}

// Toast Notifications
function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="toast-icon fa-solid ${getToastIcon(type)}"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

function getToastIcon(type) {
    switch (type) {
        case 'push': return 'fa-upload';
        case 'pull_request': return 'fa-code-pull-request';
        case 'merge': return 'fa-code-merge';
        case 'export': return 'fa-download';
        default: return 'fa-bell';
    }
}

// Sound Notification
function playNotificationSound() {
    if (!soundEnabled) return;
    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        console.log('Audio not supported');
    }
}
