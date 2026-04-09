// ============================================================
// TaskFlow — Interactive Kanban Task Board
// Compiled from TypeScript (src/app.ts)
// ============================================================

var Priority;
(function (Priority) {
    Priority["Low"] = "low";
    Priority["Medium"] = "medium";
    Priority["High"] = "high";
})(Priority || (Priority = {}));

var Status;
(function (Status) {
    Status["Todo"] = "todo";
    Status["InProgress"] = "in-progress";
    Status["Done"] = "done";
})(Status || (Status = {}));

const STORAGE_KEY = 'taskflow-tasks';

const PRIORITY_CONFIG = {
    [Priority.Low]: { label: '\u0645\u0646\u062E\u0641\u0636\u0629', color: 'text-green-700', bg: 'bg-green-100' },
    [Priority.Medium]: { label: '\u0645\u062A\u0648\u0633\u0637\u0629', color: 'text-yellow-700', bg: 'bg-yellow-100' },
    [Priority.High]: { label: '\u0639\u0627\u0644\u064A\u0629', color: 'text-red-700', bg: 'bg-red-100' },
};

const STATUS_CONFIG = {
    [Status.Todo]: { label: '\u0627\u0644\u0645\u0647\u0627\u0645 \u0627\u0644\u062C\u062F\u064A\u062F\u0629', icon: '\uD83D\uDCDD' },
    [Status.InProgress]: { label: '\u0642\u064A\u062F \u0627\u0644\u062A\u0646\u0641\u064A\u0630', icon: '\u26A1' },
    [Status.Done]: { label: '\u0645\u0643\u062A\u0645\u0644\u0629', icon: '\u2705' },
};

class StorageManager {
    static load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            console.warn('Failed to load tasks from localStorage');
            return [];
        }
    }
    static save(tasks) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        } catch {
            console.warn('Failed to save tasks to localStorage');
        }
    }
}

class TaskValidator {
    static validate(title, description) {
        const errors = {};
        if (!title.trim()) {
            errors.title = '\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0645\u0647\u0645\u0629 \u0645\u0637\u0644\u0648\u0628';
        } else if (title.trim().length < 3) {
            errors.title = '\u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 3 \u0623\u062D\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644';
        } else if (title.trim().length > 100) {
            errors.title = '\u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u064A\u062C\u0628 \u0623\u0644\u0627 \u064A\u062A\u062C\u0627\u0648\u0632 100 \u062D\u0631\u0641';
        }
        if (description.trim().length > 500) {
            errors.description = '\u0627\u0644\u0648\u0635\u0641 \u064A\u062C\u0628 \u0623\u0644\u0627 \u064A\u062A\u062C\u0627\u0648\u0632 500 \u062D\u0631\u0641';
        }
        return {
            isValid: Object.keys(errors).length === 0,
            errors,
        };
    }
}

class TaskBoard {
    constructor() {
        this.tasks = [];
        this.editingTaskId = null;
        this.draggedTaskId = null;
        this.tasks = StorageManager.load();
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.setupDragAndDrop();
    }

    render() {
        const columns = [Status.Todo, Status.InProgress, Status.Done];
        columns.forEach((status) => this.renderColumn(status));
    }

    renderColumn(status) {
        const container = document.getElementById(`${status}-tasks`);
        const counter = document.getElementById(`${status}-count`);
        if (!container) return;
        const columnTasks = this.tasks.filter((t) => t.status === status);
        if (counter) counter.textContent = String(columnTasks.length);
        container.innerHTML = columnTasks.length === 0
            ? '<div class="text-center py-8 text-slate-400"><p class="text-3xl mb-2">\uD83D\uDCED</p><p class="text-sm">\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0647\u0627\u0645 \u0647\u0646\u0627</p></div>'
            : columnTasks.map((task) => this.createTaskCard(task)).join('');

        container.querySelectorAll('[data-task-id]').forEach((card) => {
            const taskId = card.dataset.taskId;
            card.querySelector('.btn-edit')?.addEventListener('click', () => this.openEditModal(taskId));
            card.querySelector('.btn-delete')?.addEventListener('click', () => this.deleteTask(taskId));
            card.addEventListener('dragstart', (e) => this.onDragStart(e, taskId));
            card.addEventListener('dragend', () => this.onDragEnd());
        });
    }

    createTaskCard(task) {
        const pri = PRIORITY_CONFIG[task.priority];
        const date = new Date(task.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
        return `
          <div class="task-card bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
               data-task-id="${task.id}" draggable="true">
            <div class="flex items-start justify-between gap-2 mb-2">
              <h4 class="font-bold text-slate-800 text-sm leading-snug flex-1">${this.escapeHtml(task.title)}</h4>
              <span class="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${pri.bg} ${pri.color}">${pri.label}</span>
            </div>
            ${task.description ? `<p class="text-xs text-slate-500 leading-relaxed mb-3">${this.escapeHtml(task.description)}</p>` : ''}
            <div class="flex items-center justify-between">
              <span class="text-[11px] text-slate-400">${date}</span>
              <div class="flex gap-1">
                <button class="btn-edit text-slate-400 hover:text-primary-600 transition p-1" title="\u062A\u0639\u062F\u064A\u0644">\u270F\uFE0F</button>
                <button class="btn-delete text-slate-400 hover:text-red-500 transition p-1" title="\u062D\u0630\u0641">\uD83D\uDDD1\uFE0F</button>
              </div>
            </div>
          </div>
        `;
    }

    setupEventListeners() {
        document.getElementById('btn-add-task')?.addEventListener('click', () => this.openAddModal());
        document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') this.closeModal();
        });
        document.getElementById('btn-cancel')?.addEventListener('click', () => this.closeModal());
        document.getElementById('task-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });
        document.getElementById('input-title')?.addEventListener('input', () => this.validateForm());
    }

    setupDragAndDrop() {
        const columns = document.querySelectorAll('.drop-zone');
        columns.forEach((col) => {
            col.addEventListener('dragover', (e) => {
                e.preventDefault();
                col.classList.add('ring-2', 'ring-primary-400', 'bg-primary-50/50');
            });
            col.addEventListener('dragleave', () => {
                col.classList.remove('ring-2', 'ring-primary-400', 'bg-primary-50/50');
            });
            col.addEventListener('drop', (e) => {
                e.preventDefault();
                col.classList.remove('ring-2', 'ring-primary-400', 'bg-primary-50/50');
                const newStatus = col.dataset.status;
                if (this.draggedTaskId && newStatus) {
                    this.moveTask(this.draggedTaskId, newStatus);
                }
            });
        });
    }

    onDragStart(e, taskId) {
        this.draggedTaskId = taskId;
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', taskId);
        }
        setTimeout(() => {
            const card = document.querySelector(`[data-task-id="${taskId}"]`);
            if (card) card.style.opacity = '0.4';
        }, 0);
    }

    onDragEnd() {
        if (this.draggedTaskId) {
            const card = document.querySelector(`[data-task-id="${this.draggedTaskId}"]`);
            if (card) card.style.opacity = '1';
        }
        this.draggedTaskId = null;
        document.querySelectorAll('.drop-zone').forEach((col) => {
            col.classList.remove('ring-2', 'ring-primary-400', 'bg-primary-50/50');
        });
    }

    moveTask(taskId, newStatus) {
        const task = this.tasks.find((t) => t.id === taskId);
        if (task && task.status !== newStatus) {
            const oldStatus = task.status;
            task.status = newStatus;
            StorageManager.save(this.tasks);
            this.renderColumn(oldStatus);
            this.renderColumn(newStatus);
        }
    }

    openAddModal() {
        this.editingTaskId = null;
        this.resetForm();
        const title = document.getElementById('modal-title');
        const btn = document.getElementById('btn-submit');
        if (title) title.textContent = '\u0625\u0636\u0627\u0641\u0629 \u0645\u0647\u0645\u0629 \u062C\u062F\u064A\u062F\u0629';
        if (btn) btn.textContent = '\u0625\u0636\u0627\u0641\u0629';
        this.showModal();
    }

    openEditModal(taskId) {
        const task = this.tasks.find((t) => t.id === taskId);
        if (!task) return;
        this.editingTaskId = taskId;
        const titleInput = document.getElementById('input-title');
        const descInput = document.getElementById('input-description');
        const prioInput = document.getElementById('input-priority');
        if (titleInput) titleInput.value = task.title;
        if (descInput) descInput.value = task.description;
        if (prioInput) prioInput.value = task.priority;
        const title = document.getElementById('modal-title');
        const btn = document.getElementById('btn-submit');
        if (title) title.textContent = '\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u0647\u0645\u0629';
        if (btn) btn.textContent = '\u062D\u0641\u0638 \u0627\u0644\u062A\u0639\u062F\u064A\u0644\u0627\u062A';
        this.showModal();
    }

    showModal() {
        document.getElementById('modal-overlay')?.classList.remove('hidden');
        document.getElementById('modal-overlay')?.classList.add('flex');
        document.getElementById('input-title')?.focus();
    }

    closeModal() {
        document.getElementById('modal-overlay')?.classList.add('hidden');
        document.getElementById('modal-overlay')?.classList.remove('flex');
        this.editingTaskId = null;
        this.resetForm();
    }

    resetForm() {
        document.getElementById('task-form')?.reset();
        document.getElementById('error-title').textContent = '';
        document.getElementById('error-description').textContent = '';
    }

    validateForm() {
        const title = document.getElementById('input-title').value;
        const description = document.getElementById('input-description').value;
        const result = TaskValidator.validate(title, description);
        document.getElementById('error-title').textContent = result.errors.title || '';
        document.getElementById('error-description').textContent = result.errors.description || '';
        return result;
    }

    handleFormSubmit() {
        const validation = this.validateForm();
        if (!validation.isValid) return;
        const title = document.getElementById('input-title').value.trim();
        const description = document.getElementById('input-description').value.trim();
        const priority = document.getElementById('input-priority').value;
        if (this.editingTaskId) {
            this.updateTask(this.editingTaskId, title, description, priority);
        } else {
            this.addTask(title, description, priority);
        }
        this.closeModal();
    }

    addTask(title, description, priority) {
        const newTask = {
            id: this.generateId(),
            title,
            description,
            priority,
            status: Status.Todo,
            createdAt: new Date().toISOString(),
        };
        this.tasks.unshift(newTask);
        StorageManager.save(this.tasks);
        this.renderColumn(Status.Todo);
    }

    updateTask(taskId, title, description, priority) {
        const task = this.tasks.find((t) => t.id === taskId);
        if (!task) return;
        task.title = title;
        task.description = description;
        task.priority = priority;
        StorageManager.save(this.tasks);
        this.renderColumn(task.status);
    }

    deleteTask(taskId) {
        const task = this.tasks.find((t) => t.id === taskId);
        if (!task) return;
        if (!confirm('\u0647\u0644 \u062A\u0631\u064A\u062F \u062D\u0630\u0641 \u0647\u0630\u0647 \u0627\u0644\u0645\u0647\u0645\u0629\u061F')) return;
        const status = task.status;
        this.tasks = this.tasks.filter((t) => t.id !== taskId);
        StorageManager.save(this.tasks);
        this.renderColumn(status);
    }

    generateId() {
        return `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TaskBoard();
});
