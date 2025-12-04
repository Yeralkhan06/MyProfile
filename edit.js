/**
 * JavaScript для страницы редактирования профиля
 * Автор: MiniMax Agent
 */

class ProfileEditor {
    constructor() {
        this.profileData = null;
        this.projects = [];
        this.init();
    }

    async init() {
        try {
            // Инициализация Lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            // Загрузка данных профиля
            await this.loadProfile();
            
            // Инициализация событий
            this.initEventListeners();
            
            // Заполнение формы
            this.populateForm();
            
            // Инициализация первой группы проектов
            if (this.projects.length === 0) {
                this.addProject();
            }
            
        } catch (error) {
            console.error('Ошибка инициализации редактора:', error);
            this.showNotification('Не удалось загрузить данные профиля', 'error');
        }
    }

    async loadProfile() {
        try {
            const response = await fetch('/api/profile');
            const result = await response.json();
            
            if (result.success) {
                this.profileData = result.data;
                this.projects = result.data.projects || [];
            } else {
                throw new Error(result.error || 'Неизвестная ошибка');
            }
        } catch (error) {
            console.error('Ошибка загрузки профиля:', error);
            throw error;
        }
    }

    initEventListeners() {
        // Обработчик формы
        const form = document.getElementById('profile-form');
        form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Валидация в реальном времени
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });

        // Глобальные функции
        window.addProject = () => this.addProject();
        window.removeProject = (index) => this.removeProject(index);
        window.resetForm = () => this.resetForm();
        window.exportProfile = () => this.exportProfile();
    }

    populateForm() {
        if (!this.profileData) return;

        // Заполнение основных полей
        document.getElementById('full_name').value = this.profileData.full_name;
        document.getElementById('description').value = this.profileData.description;
        document.getElementById('phone').value = this.profileData.phone;
        document.getElementById('github_url').value = this.profileData.github_url || '';
        document.getElementById('education').value = this.profileData.education;
        document.getElementById('photo_url').value = this.profileData.photo_url || '';

        // Заполнение навыков
        const skillsText = (this.profileData.skills || []).join(', ');
        document.getElementById('skills').value = skillsText;

        // Заполнение проектов
        this.renderProjects();
    }

    renderProjects() {
        const container = document.getElementById('projects-container');
        container.innerHTML = '';

        this.projects.forEach((project, index) => {
            this.addProject(project, index);
        });
    }

    addProject(project = { title: '', description: '', url: '' }, index = null) {
        const container = document.getElementById('projects-container');
        const projectIndex = index !== null ? index : this.projects.length;
        
        // Создание элемента проекта
        const projectElement = document.createElement('div');
        projectElement.className = 'project-form-group';
        projectElement.id = `project-${projectIndex}`;
        
        projectElement.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <label class="form-label">Название проекта</label>
                    <input type="text" class="form-control" id="project-title-${projectIndex}" 
                           value="${this.escapeHtml(project.title)}" placeholder="Мой проект">
                </div>
                <div class="col-md-6">
                    <label class="form-label">URL проекта</label>
                    <input type="url" class="form-control" id="project-url-${projectIndex}" 
                           value="${this.escapeHtml(project.url)}" placeholder="https://example.com">
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Описание</label>
                <textarea class="form-control" id="project-description-${projectIndex}" 
                         rows="2" placeholder="Краткое описание проекта">${this.escapeHtml(project.description)}</textarea>
            </div>
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeProject(${projectIndex})">
                <i data-lucide="trash-2" class="me-1"></i>
                Удалить
            </button>
        `;
        
        container.appendChild(projectElement);
        
        // Обновление массива проектов
        if (index === null) {
            this.projects.push(project);
        } else {
            this.projects[index] = project;
        }
        
        // Инициализация иконок
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    removeProject(index) {
        // Удаление из массива
        this.projects.splice(index, 1);
        
        // Удаление из DOM
        const element = document.getElementById(`project-${index}`);
        if (element) {
            element.remove();
        }
        
        // Переиндексация оставшихся проектов
        this.reindexProjects();
    }

    reindexProjects() {
        const container = document.getElementById('projects-container');
        const projectElements = container.querySelectorAll('.project-form-group');
        
        projectElements.forEach((element, newIndex) => {
            const oldIndex = parseInt(element.id.split('-')[1]);
            
            // Обновление ID элемента
            element.id = `project-${newIndex}`;
            
            // Обновление ID полей ввода
            const titleInput = element.querySelector(`#project-title-${oldIndex}`);
            const urlInput = element.querySelector(`#project-url-${oldIndex}`);
            const descTextarea = element.querySelector(`#project-description-${oldIndex}`);
            const removeBtn = element.querySelector('button');
            
            if (titleInput) titleInput.id = `project-title-${newIndex}`;
            if (urlInput) urlInput.id = `project-url-${newIndex}`;
            if (descTextarea) descTextarea.id = `project-description-${newIndex}`;
            if (removeBtn) removeBtn.onclick = () => this.removeProject(newIndex);
        });
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        
        // Валидация формы
        if (!this.validateForm(form)) {
            return;
        }
        
        // Подготовка данных
        const profileData = this.prepareFormData();
        
        try {
            // Показ модального окна загрузки
            const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
            loadingModal.show();
            
            // Отправка данных
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });
            
            const result = await response.json();
            
            // Скрытие модального окна загрузки
            loadingModal.hide();
            
            if (result.success) {
                // Показ успешного сообщения
                const successModal = new bootstrap.Modal(document.getElementById('successModal'));
                successModal.show();
            } else {
                throw new Error(result.error || 'Неизвестная ошибка');
            }
            
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            this.showNotification('Ошибка сохранения профиля', 'error');
        }
    }

    validateForm(form) {
        let isValid = true;
        
        // Очистка предыдущих ошибок
        form.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });
        
        // Валидация обязательных полей
        const requiredFields = [
            { id: 'full_name', name: 'Полное имя' },
            { id: 'description', name: 'Описание' },
            { id: 'phone', name: 'Телефон' },
            { id: 'education', name: 'Образование' },
            { id: 'skills', name: 'Навыки' }
        ];
        
        requiredFields.forEach(field => {
            const element = form.querySelector(`#${field.id}`);
            if (!element.value.trim()) {
                this.showFieldError(element, `${field.name} обязательно для заполнения`);
                isValid = false;
            }
        });
        
        // Валидация навыков
        const skills = document.getElementById('skills').value.trim();
        if (skills && skills.split(',').length === 0) {
            this.showFieldError(document.getElementById('skills'), 'Добавьте хотя бы один навык');
            isValid = false;
        }
        
        return isValid;
    }

    validateField(element) {
        if (element.hasAttribute('required') && !element.value.trim()) {
            this.showFieldError(element, 'Это поле обязательно для заполнения');
            return false;
        }
        
        // Специальная валидация для email
        if (element.type === 'email' && element.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(element.value)) {
                this.showFieldError(element, 'Введите корректный email адрес');
                return false;
            }
        }
        
        // Специальная валидация для URL
        if (element.type === 'url' && element.value) {
            try {
                new URL(element.value);
            } catch {
                this.showFieldError(element, 'Введите корректный URL');
                return false;
            }
        }
        
        this.clearFieldError(element);
        return true;
    }

    showFieldError(element, message) {
        element.classList.add('is-invalid');
        
        let feedback = element.parentNode.querySelector('.invalid-feedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            element.parentNode.appendChild(feedback);
        }
        feedback.textContent = message;
    }

    clearFieldError(element) {
        element.classList.remove('is-invalid');
        const feedback = element.parentNode.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.remove();
        }
    }

    prepareFormData() {
        // Получение навыков
        const skillsText = document.getElementById('skills').value;
        const skills = skillsText.split(',').map(skill => skill.trim()).filter(skill => skill);
        
        // Получение проектов
        const projects = [];
        this.projects.forEach((_, index) => {
            const title = document.getElementById(`project-title-${index}`)?.value?.trim();
            const description = document.getElementById(`project-description-${index}`)?.value?.trim();
            const url = document.getElementById(`project-url-${index}`)?.value?.trim();
            
            if (title && description && url) {
                projects.push({ title, description, url });
            }
        });
        
        return {
            full_name: document.getElementById('full_name').value.trim(),
            description: document.getElementById('description').value.trim(),
            skills: skills,
            phone: document.getElementById('phone').value.trim(),
            education: document.getElementById('education').value.trim(),
            github_url: document.getElementById('github_url').value.trim(),
            projects: projects,
            photo_url: document.getElementById('photo_url').value.trim()
        };
    }

    resetForm() {
        if (confirm('Вы уверены, что хотите сбросить все изменения?')) {
            this.populateForm();
            this.showNotification('Форма сброшена', 'success');
        }
    }

    async exportProfile() {
        try {
            const response = await fetch('/api/profile/export');
            const data = await response.json();
            
            if (data.export_info) {
                // Создание и скачивание файла
                const blob = new Blob([JSON.stringify(data, null, 2)], {
                    type: 'application/json'
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `profile_${this.profileData.full_name.replace(/\s+/g, '_')}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                this.showNotification('Профиль экспортирован!', 'success');
            }
        } catch (error) {
            console.error('Ошибка экспорта:', error);
            this.showNotification('Ошибка экспорта профиля', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Создание уведомления
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : 'success'} position-fixed`;
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 1050;
            min-width: 300px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        const icon = type === 'error' ? 'alert-circle' : 'check-circle';
        notification.innerHTML = `
            <i data-lucide="${icon}" class="me-2"></i>
            ${message}
        `;
        
        document.body.appendChild(notification);
        
        // Анимация появления
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Автоматическое скрытие
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
        
        // Инициализация иконки
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Инициализация редактора при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    new ProfileEditor();
});

// Экспорт для использования в других модулях
window.ProfileEditor = ProfileEditor;