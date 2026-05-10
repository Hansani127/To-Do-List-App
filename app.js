// ===== TASKFLOW APP - MAIN JAVASCRIPT =====

// ===== STATE MANAGEMENT =====
let currentUser = null;
let tasks = [];
let currentFilter = 'all';
let editingTaskId = null;

// ===== DOM ELEMENTS =====
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginFormWrapper = document.getElementById('login-form-wrapper');
const registerFormWrapper = document.getElementById('register-form-wrapper');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const toast = document.getElementById('toast');
const editModal = document.getElementById('edit-modal');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    updateDate();
    setGreeting();
    loadTheme();

    // Update greeting every minute
    setInterval(setGreeting, 60000);
});

// ===== AUTHENTICATION =====
function checkAuth() {
    const user = localStorage.getItem('taskflow_user');
    if (user) {
        currentUser = JSON.parse(user);
        showApp();
        loadTasks();
        updateUserInfo();
    } else {
        showAuth();
    }
}

function showAuth() {
    authContainer.classList.remove('hidden');
    appContainer.classList.add('hidden');
}

function showApp() {
    authContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
}

function showRegister() {
    loginFormWrapper.classList.add('form-hidden');
    registerFormWrapper.classList.remove('form-hidden');
    registerFormWrapper.style.animation = 'slideUp 0.4s ease';
    // Reset form
    document.getElementById('register-form').reset();
}

function showLogin() {
    registerFormWrapper.classList.add('form-hidden');
    loginFormWrapper.classList.remove('form-hidden');
    loginFormWrapper.style.animation = 'slideUp 0.4s ease';
    // Reset form
    document.getElementById('login-form').reset();
}

function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Login Handler
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const users = JSON.parse(localStorage.getItem('taskflow_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        currentUser = user;
        localStorage.setItem('taskflow_user', JSON.stringify(user));
        showApp();
        loadTasks();
        updateUserInfo();
        showToast('Welcome back, ' + user.name + '!');
        document.getElementById('login-form').reset();
    } else {
        showToast('Invalid email or password!', 'error');
    }
});

// Register Handler
document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;

    if (password !== confirm) {
        showToast('Passwords do not match!', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('Password must be at least 6 characters!', 'error');
        return;
    }

    const users = JSON.parse(localStorage.getItem('taskflow_users') || '[]');

    if (users.find(u => u.email === email)) {
        showToast('Email already registered!', 'error');
        return;
    }

    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('taskflow_users', JSON.stringify(users));
    localStorage.setItem('taskflow_user', JSON.stringify(newUser));

    currentUser = newUser;
    showApp();
    loadTasks();
    updateUserInfo();
    showToast('Account created successfully!');
    document.getElementById('register-form').reset();
});

function logout() {
    localStorage.removeItem('taskflow_user');
    currentUser = null;
    tasks = [];
    showAuth();
    showToast('Logged out successfully');
}

function updateUserInfo() {
    if (currentUser) {
        document.getElementById('user-name').textContent = currentUser.name;
        document.getElementById('user-email').textContent = currentUser.email;
    }
}

// ===== TASK MANAGEMENT =====
function loadTasks() {
    if (!currentUser) return;
    const stored = localStorage.getItem(`taskflow_tasks_${currentUser.id}`);
    tasks = stored ? JSON.parse(stored) : [];
    renderTasks();
    updateStats();
}

function saveTasks() {
    if (!currentUser) return;
    localStorage.setItem(`taskflow_tasks_${currentUser.id}`, JSON.stringify(tasks));
    updateStats();
}

// Add Task
document.getElementById('add-task-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const text = document.getElementById('task-input').value.trim();
    const priority = document.getElementById('task-priority').value;
    const date = document.getElementById('task-date').value;
    const category = document.getElementById('task-category').value;

    if (!text) return;

    const task = {
        id: Date.now().toString(),
        text,
        priority,
        date: date || new Date().toISOString().split('T')[0],
        category,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(task);
    saveTasks();
    renderTasks();
    document.getElementById('add-task-form').reset();
    document.getElementById('task-priority').value = 'medium';
    document.getElementById('task-category').value = 'personal';
    showToast('Task added successfully!');
});

// Toggle Complete
function toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();

        if (task.completed) {
            showToast('Task completed! Great job!');
        } else {
            showToast('Task marked as pending');
        }
    }
}

// Delete Task
function deleteTask(id) {
    const taskElement = document.querySelector(`[data-task-id="${id}"]`);
    if (taskElement) {
        taskElement.classList.add('deleting');
        setTimeout(() => {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            renderTasks();
            showToast('Task deleted');
        }, 400);
    }
}

// Edit Task
function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    editingTaskId = id;
    document.getElementById('edit-task-text').value = task.text;
    document.getElementById('edit-priority').value = task.priority;
    document.getElementById('edit-date').value = task.date;
    document.getElementById('edit-category').value = task.category;

    editModal.classList.add('active');
}

// Edit Form Submit
document.getElementById('edit-form').addEventListener('submit', (e) => {
    e.preventDefault();

    if (!editingTaskId) return;

    const task = tasks.find(t => t.id === editingTaskId);
    if (task) {
        task.text = document.getElementById('edit-task-text').value.trim();
        task.priority = document.getElementById('edit-priority').value;
        task.date = document.getElementById('edit-date').value;
        task.category = document.getElementById('edit-category').value;

        saveTasks();
        renderTasks();
        closeEditModal();
        showToast('Task updated successfully!');
    }
});

function closeEditModal() {
    editModal.classList.remove('active');
    editingTaskId = null;
}

// Clear Completed
function clearCompleted() {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
        showToast('No completed tasks to clear');
        return;
    }

    if (confirm(`Clear ${completedCount} completed task(s)?`)) {
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        renderTasks();
        showToast('Completed tasks cleared');
    }
}

// Delete All
function deleteAll() {
    if (tasks.length === 0) {
        showToast('No tasks to delete');
        return;
    }

    if (confirm('Delete all tasks? This cannot be undone.')) {
        tasks = [];
        saveTasks();
        renderTasks();
        showToast('All tasks deleted');
    }
}

// ===== RENDER TASKS =====
function renderTasks() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

    let filteredTasks = tasks.filter(task => {
        // Filter by search
        if (searchTerm && !task.text.toLowerCase().includes(searchTerm)) {
            return false;
        }

        // Filter by category
        if (currentFilter === 'completed') return task.completed;
        if (currentFilter === 'pending') return !task.completed;
        if (currentFilter === 'today') {
            const today = new Date().toISOString().split('T')[0];
            return task.date === today;
        }
        return true;
    });

    // Sort: pending first, then by priority
    filteredTasks.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    taskList.innerHTML = '';

    if (filteredTasks.length === 0) {
        emptyState.classList.add('active');
    } else {
        emptyState.classList.remove('active');

        filteredTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    }

    updateBadgeCounts();
}

function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = `task-item ${task.completed ? 'completed' : ''}`;
    div.setAttribute('data-task-id', task.id);

    const isOverdue = !task.completed && task.date < new Date().toISOString().split('T')[0];

    div.innerHTML = `
        <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleComplete('${task.id}')">
            ${task.completed ? '<i class="fas fa-check"></i>' : ''}
        </div>
        <div class="task-content">
            <div class="task-text">${escapeHtml(task.text)}</div>
            <div class="task-meta">
                <span class="task-badge priority-${task.priority}">
                    <i class="fas fa-flag"></i>
                    ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
                <span class="task-badge category">
                    <i class="fas fa-folder"></i>
                    ${task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                </span>
                <span class="task-badge date ${isOverdue ? 'overdue' : ''}">
                    <i class="fas fa-calendar"></i>
                    ${formatDate(task.date)}
                    ${isOverdue ? ' (Overdue)' : ''}
                </span>
            </div>
        </div>
        <div class="task-actions">
            <button class="task-action-btn" onclick="editTask('${task.id}')" title="Edit">
                <i class="fas fa-pen"></i>
            </button>
            <button class="task-action-btn delete" onclick="deleteTask('${task.id}')" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    return div;
}

// ===== STATS =====
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    animateNumber('stat-total', total);
    animateNumber('stat-completed', completed);
    animateNumber('stat-pending', pending);
    animateNumber('stat-progress', progress, '%');
}

function updateBadgeCounts() {
    const today = new Date().toISOString().split('T')[0];

    document.getElementById('all-count').textContent = tasks.length;
    document.getElementById('today-count').textContent = tasks.filter(t => t.date === today).length;
    document.getElementById('completed-count').textContent = tasks.filter(t => t.completed).length;
    document.getElementById('pending-count').textContent = tasks.filter(t => !t.completed).length;
}

function animateNumber(elementId, target, suffix = '') {
    const element = document.getElementById(elementId);
    const start = parseInt(element.textContent) || 0;
    const duration = 500;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (target - start) * easeProgress);

        element.textContent = current + suffix;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// ===== FILTERING =====
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();

        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        currentFilter = item.dataset.filter;

        const titles = {
            all: 'All Tasks',
            today: "Today's Tasks",
            completed: 'Completed Tasks',
            pending: 'Pending Tasks'
        };

        document.getElementById('tasks-title').textContent = titles[currentFilter];
        renderTasks();
    });
});

// Search
document.getElementById('search-input').addEventListener('input', () => {
    renderTasks();
});

// ===== SIDEBAR =====
function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('open');
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle');

    if (window.innerWidth <= 768 && 
        sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        !menuToggle.contains(e.target)) {
        sidebar.classList.remove('open');
    }
});

// ===== THEME =====
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('taskflow_theme', newTheme);

    const icon = document.querySelector('.theme-toggle i');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('taskflow_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const icon = document.querySelector('.theme-toggle i');
    if (savedTheme === 'dark') {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }
}

// ===== DATE & GREETING =====
function updateDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', options);
}

function setGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Good Morning';

    if (hour >= 12 && hour < 17) {
        greeting = 'Good Afternoon';
    } else if (hour >= 17) {
        greeting = 'Good Evening';
    }

    document.getElementById('greeting').textContent = greeting;
}

// ===== TOAST NOTIFICATION =====
function showToast(message, type = 'success') {
    const toastEl = document.getElementById('toast');
    const messageEl = document.getElementById('toast-message');
    const iconEl = toastEl.querySelector('i');

    messageEl.textContent = message;

    if (type === 'error') {
        iconEl.className = 'fas fa-exclamation-circle';
        iconEl.style.color = 'var(--danger)';
    } else {
        iconEl.className = 'fas fa-check-circle';
        iconEl.style.color = 'var(--success)';
    }

    toastEl.classList.add('show');

    setTimeout(() => {
        toastEl.classList.remove('show');
    }, 3000);
}

// ===== UTILITY FUNCTIONS =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateString === today.toISOString().split('T')[0]) {
        return 'Today';
    } else if (dateString === tomorrow.toISOString().split('T')[0]) {
        return 'Tomorrow';
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

// Close modal on outside click
editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
        closeEditModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeEditModal();
    }

    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input').focus();
    }

    // Ctrl/Cmd + N to focus add task
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        document.getElementById('task-input').focus();
    }
});