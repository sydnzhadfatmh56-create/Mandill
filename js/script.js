// ========================
// To-Do List Application
// Local Storage Management
// ========================

class TodoApp {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.init();
    }

    init() {
        this.loadTasks();
        this.setupEventListeners();
        this.render();
        console.log('%c✅ To-Do List Loaded Successfully!', 'color: #10b981; font-size: 14px; font-weight: bold;');
    }

    setupEventListeners() {
        // Add task
        document.getElementById('addBtn').addEventListener('click', () => this.addTask());
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Character count
        document.getElementById('taskInput').addEventListener('input', (e) => {
            document.getElementById('charCount').textContent = e.target.value.length;
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.render();
            });
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.render();
        });

        // Clear completed
        document.getElementById('clearCompletedBtn')?.addEventListener('click', () => {
            this.showConfirmModal('آیا می‌خواهید کارهای انجام شده را حذف کنید؟', () => {
                this.tasks = this.tasks.filter(task => !task.completed);
                this.saveTasks();
                this.render();
            });
        });

        // Clear all
        document.getElementById('clearAllBtn')?.addEventListener('click', () => {
            this.showConfirmModal('آیا می‌خواهید تمام کارها را حذف کنید؟ این عمل برگشت‌پذیر نیست!', () => {
                this.tasks = [];
                this.saveTasks();
                this.render();
            });
        });

        // Modal actions
        document.getElementById('cancelBtn')?.addEventListener('click', () => {
            this.hideConfirmModal();
        });
    }

    addTask() {
        const input = document.getElementById('taskInput');
        const text = input.value.trim();

        if (!text) {
            console.warn('⚠️ لطفاً کاری بنویسید!');
            return;
        }

        if (text.length < 2) {
            console.warn('⚠️ کار باید حداقل 2 حرف داشته باشد!');
            return;
        }

        const task = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toLocaleString('fa-IR')
        };

        this.tasks.unshift(task);
        this.saveTasks();
        input.value = '';
        document.getElementById('charCount').textContent = '0';
        this.render();
        console.log('✅ کار با موفقیت افزوده شد:', task.text);
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
            console.log('✓ کار تغییر وضعیت یافت:', task.text);
        }
    }

    deleteTask(id) {
        this.showConfirmModal('آیا می‌خواهید این کار را حذف کنید؟', () => {
            const taskName = this.tasks.find(t => t.id === id)?.text;
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.render();
            console.log('🗑️ کار حذف شد:', taskName);
        });
    }

    filterTasks() {
        let filtered = this.tasks;

        // Apply filter
        if (this.currentFilter === 'active') {
            filtered = filtered.filter(t => !t.completed);
        } else if (this.currentFilter === 'completed') {
            filtered = filtered.filter(t => t.completed);
        }

        // Apply search
        if (this.searchTerm) {
            filtered = filtered.filter(t => 
                t.text.toLowerCase().includes(this.searchTerm)
            );
        }

        return filtered;
    }

    getStats() {
        return {
            total: this.tasks.length,
            active: this.tasks.filter(t => !t.completed).length,
            completed: this.tasks.filter(t => t.completed).length
        };
    }

    render() {
        this.updateStats();
        this.renderTasks();
        this.toggleActionsSection();
    }

    updateStats() {
        const stats = this.getStats();
        document.getElementById('totalCount').textContent = stats.total;
        document.getElementById('activeCount').textContent = stats.active;
        document.getElementById('completedCount').textContent = stats.completed;
    }

    renderTasks() {
        const tasksList = document.getElementById('tasksList');
        const filteredTasks = this.filterTasks();

        if (filteredTasks.length === 0) {
            tasksList.innerHTML = `
                <div class="empty-state">
                    <p class="empty-icon">📭</p>
                    <p class="empty-text">هنوز کار وجود ندارد!</p>
                    <p class="empty-hint">شروع کنید با نوشتن کار جدید</p>
                </div>
            `;
            return;
        }

        tasksList.innerHTML = filteredTasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <input 
                    type="checkbox" 
                    class="task-checkbox" 
                    ${task.completed ? 'checked' : ''}
                    onchange="app.toggleTask(${task.id})"
                >
                <div class="task-content">
                    <div class="task-text">${this.escapeHtml(task.text)}</div>
                    <div class="task-time">⏰ ${task.createdAt}</div>
                </div>
                <div class="task-actions">
                    <button class="task-btn task-btn-delete" onclick="app.deleteTask(${task.id})">
                        🗑️ حذف
                    </button>
                </div>
            </div>
        `).join('');
    }

    toggleActionsSection() {
        const section = document.getElementById('actionsSection');
        if (this.tasks.length > 0) {
            section.style.display = 'flex';
        } else {
            section.style.display = 'none';
        }
    }

    showConfirmModal(message, onConfirm) {
        this.confirmCallback = onConfirm;
        document.getElementById('modalMessage').textContent = message;
        document.getElementById('confirmModal').style.display = 'flex';
        
        document.getElementById('confirmBtn').onclick = () => {
            this.confirmCallback();
            this.hideConfirmModal();
        };
    }

    hideConfirmModal() {
        document.getElementById('confirmModal').style.display = 'none';
    }

    saveTasks() {
        localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
        console.log('💾 کارها ذخیره شدند.');
    }

    loadTasks() {
        const stored = localStorage.getItem('todoTasks');
        this.tasks = stored ? JSON.parse(stored) : [];
        console.log(`📂 ${this.tasks.length} کار بارگذاری شد.`);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TodoApp();
});
