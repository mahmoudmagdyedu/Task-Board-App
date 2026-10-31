// ============================================================
// TaskFlow — Interactive Kanban Task Board
// Built with TypeScript for type-safe task management
// ============================================================

// ── Types & Interfaces ──────────────────────────────────────

enum Priority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

enum Status {
  Todo = 'todo',
  InProgress = 'in-progress',
  Done = 'done',
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  createdAt: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// ── Constants ───────────────────────────────────────────────

const STORAGE_KEY = 'taskflow-tasks';

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  [Priority.Low]: { label: 'منخفضة', color: 'text-green-700', bg: 'bg-green-100' },
  [Priority.Medium]: { label: 'متوسطة', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  [Priority.High]: { label: 'عالية', color: 'text-red-700', bg: 'bg-red-100' },
};

const STATUS_CONFIG: Record<Status, { label: string; icon: string }> = {
  [Status.Todo]: { label: 'المهام الجديدة', icon: '📝' },
  [Status.InProgress]: { label: 'قيد التنفيذ', icon: '⚡' },
  [Status.Done]: { label: 'مكتملة', icon: '✅' },
};

// ── Storage Manager ─────────────────────────────────────────

class TaskStorage {
  static load(): Task[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      console.warn('Failed to load tasks from localStorage');
      return [];
    }
  }

  static save(tasks: Task[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      console.warn('Failed to save tasks to localStorage');
    }
  }
}

// ── Validator ───────────────────────────────────────────────

class TaskValidator {
  static validate(title: string, description: string): ValidationResult {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'عنوان المهمة مطلوب';
    } else if (title.trim().length < 3) {
      errors.title = 'العنوان يجب أن يكون 3 أحرف على الأقل';
    } else if (title.trim().length > 100) {
      errors.title = 'العنوان يجب ألا يتجاوز 100 حرف';
    }

    if (description.trim().length > 500) {
      errors.description = 'الوصف يجب ألا يتجاوز 500 حرف';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}

// ── Task Board Application ──────────────────────────────────

class TaskBoard {
  private tasks: Task[] = [];
  private editingTaskId: string | null = null;
  private draggedTaskId: string | null = null;

  constructor() {
    this.tasks = TaskStorage.load();
    this.init();
  }

  private init(): void {
    this.render();
    this.setupEventListeners();
    this.setupDragAndDrop();
  }

  // ── Rendering ─────────────────────────────────────────────

  private render(): void {
    const columns: Status[] = [Status.Todo, Status.InProgress, Status.Done];
    columns.forEach((status) => this.renderColumn(status));
  }

  private renderColumn(status: Status): void {
    const container = document.getElementById(`${status}-tasks`);
    const counter = document.getElementById(`${status}-count`);
    if (!container) return;

    const columnTasks = this.tasks.filter((t) => t.status === status);
    if (counter) counter.textContent = String(columnTasks.length);

    container.innerHTML = columnTasks.length === 0
      ? `<div class="text-center py-8 text-slate-400">
           <p class="text-3xl mb-2">📭</p>
           <p class="text-sm">لا توجد مهام هنا</p>
         </div>`
      : columnTasks.map((task) => this.createTaskCard(task)).join('');

    // Re-attach card event listeners
    container.querySelectorAll('[data-task-id]').forEach((card) => {
      const taskId = (card as HTMLElement).dataset.taskId!;

      card.querySelector('.btn-edit')?.addEventListener('click', () => this.openEditModal(taskId));
      card.querySelector('.btn-delete')?.addEventListener('click', () => this.deleteTask(taskId));

      // Drag events on cards
      card.addEventListener('dragstart', (e) => this.onDragStart(e as DragEvent, taskId));
      card.addEventListener('dragend', () => this.onDragEnd());
    });
  }

  private createTaskCard(task: Task): string {
    const pri = PRIORITY_CONFIG[task.priority];
    const date = new Date(task.createdAt).toLocaleDateString('ar-EG', {
      day: 'numeric', month: 'short',
    });

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
            <button class="btn-edit text-slate-400 hover:text-primary-600 transition p-1" title="تعديل">✏️</button>
            <button class="btn-delete text-slate-400 hover:text-red-500 transition p-1" title="حذف">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }

  // ── Event Listeners ───────────────────────────────────────

  private setupEventListeners(): void {
    document.getElementById('btn-add-task')?.addEventListener('click', () => this.openAddModal());

    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).id === 'modal-overlay') this.closeModal();
    });
    document.getElementById('btn-cancel')?.addEventListener('click', () => this.closeModal());

    document.getElementById('task-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });

    document.getElementById('input-title')?.addEventListener('input', () => this.validateForm());
  }

  // ── Drag & Drop ───────────────────────────────────────────

  private setupDragAndDrop(): void {
    const columns = document.querySelectorAll('.drop-zone');
    columns.forEach((col) => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        (col as HTMLElement).classList.add('ring-2', 'ring-primary-400', 'bg-primary-50/50');
      });
      col.addEventListener('dragleave', () => {
        (col as HTMLElement).classList.remove('ring-2', 'ring-primary-400', 'bg-primary-50/50');
      });
      col.addEventListener('drop', (e) => {
        e.preventDefault();
        (col as HTMLElement).classList.remove('ring-2', 'ring-primary-400', 'bg-primary-50/50');
        const newStatus = (col as HTMLElement).dataset.status as Status;
        if (this.draggedTaskId && newStatus) {
          this.moveTask(this.draggedTaskId, newStatus);
        }
      });
    });
  }

  private onDragStart(e: DragEvent, taskId: string): void {
    this.draggedTaskId = taskId;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', taskId);
    }
    setTimeout(() => {
      const card = document.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement;
      if (card) card.style.opacity = '0.4';
    }, 0);
  }

  private onDragEnd(): void {
    if (this.draggedTaskId) {
      const card = document.querySelector(`[data-task-id="${this.draggedTaskId}"]`) as HTMLElement;
      if (card) card.style.opacity = '1';
    }
    this.draggedTaskId = null;
    document.querySelectorAll('.drop-zone').forEach((col) => {
      (col as HTMLElement).classList.remove('ring-2', 'ring-primary-400', 'bg-primary-50/50');
    });
  }

  private moveTask(taskId: string, newStatus: Status): void {
    const task = this.tasks.find((t) => t.id === taskId);
    if (task && task.status !== newStatus) {
      const oldStatus = task.status;
      task.status = newStatus;
      TaskStorage.save(this.tasks);
      this.renderColumn(oldStatus);
      this.renderColumn(newStatus);
    }
  }

  // ── Modal Management ──────────────────────────────────────

  private openAddModal(): void {
    this.editingTaskId = null;
    this.resetForm();
    const title = document.getElementById('modal-title');
    const btn = document.getElementById('btn-submit');
    if (title) title.textContent = 'إضافة مهمة جديدة';
    if (btn) btn.textContent = 'إضافة';
    this.showModal();
  }

  private openEditModal(taskId: string): void {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return;

    this.editingTaskId = taskId;
    const titleInput = document.getElementById('input-title') as HTMLInputElement;
    const descInput = document.getElementById('input-description') as HTMLTextAreaElement;
    const prioInput = document.getElementById('input-priority') as HTMLSelectElement;

    if (titleInput) titleInput.value = task.title;
    if (descInput) descInput.value = task.description;
    if (prioInput) prioInput.value = task.priority;

    const title = document.getElementById('modal-title');
    const btn = document.getElementById('btn-submit');
    if (title) title.textContent = 'تعديل المهمة';
    if (btn) btn.textContent = 'حفظ التعديلات';

    this.showModal();
  }

  private showModal(): void {
    document.getElementById('modal-overlay')?.classList.remove('hidden');
    document.getElementById('modal-overlay')?.classList.add('flex');
    (document.getElementById('input-title') as HTMLInputElement)?.focus();
  }

  private closeModal(): void {
    document.getElementById('modal-overlay')?.classList.add('hidden');
    document.getElementById('modal-overlay')?.classList.remove('flex');
    this.editingTaskId = null;
    this.resetForm();
  }

  private resetForm(): void {
    (document.getElementById('task-form') as HTMLFormElement)?.reset();
    document.getElementById('error-title')!.textContent = '';
    document.getElementById('error-description')!.textContent = '';
  }

  // ── Form Handling ─────────────────────────────────────────

  private validateForm(): ValidationResult {
    const title = (document.getElementById('input-title') as HTMLInputElement).value;
    const description = (document.getElementById('input-description') as HTMLTextAreaElement).value;
    const result = TaskValidator.validate(title, description);

    document.getElementById('error-title')!.textContent = result.errors.title || '';
    document.getElementById('error-description')!.textContent = result.errors.description || '';

    return result;
  }

  private handleFormSubmit(): void {
    const validation = this.validateForm();
    if (!validation.isValid) return;

    const title = (document.getElementById('input-title') as HTMLInputElement).value.trim();
    const description = (document.getElementById('input-description') as HTMLTextAreaElement).value.trim();
    const priority = (document.getElementById('input-priority') as HTMLSelectElement).value as Priority;

    if (this.editingTaskId) {
      this.updateTask(this.editingTaskId, title, description, priority);
    } else {
      this.addTask(title, description, priority);
    }

    this.closeModal();
  }

  // ── CRUD Operations ───────────────────────────────────────

  private addTask(title: string, description: string, priority: Priority): void {
    const newTask: Task = {
      id: this.generateId(),
      title,
      description,
      priority,
      status: Status.Todo,
      createdAt: new Date().toISOString(),
    };
    this.tasks.unshift(newTask);
    TaskStorage.save(this.tasks);
    this.renderColumn(Status.Todo);
  }

  private updateTask(taskId: string, title: string, description: string, priority: Priority): void {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return;
    task.title = title;
    task.description = description;
    task.priority = priority;
    TaskStorage.save(this.tasks);
    this.renderColumn(task.status);
  }

  private deleteTask(taskId: string): void {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (!confirm('هل تريد حذف هذه المهمة؟')) return;
    const status = task.status;
    this.tasks = this.tasks.filter((t) => t.id !== taskId);
    TaskStorage.save(this.tasks);
    this.renderColumn(status);
  }

  // ── Utilities ─────────────────────────────────────────────

  private generateId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// ── Bootstrap ───────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  new TaskBoard();
});
