/**
 * Главный JavaScript файл для отображения профиля
 * Автор: MiniMax Agent
 */

class ProfileApp {
    constructor() {
        this.profileData = null;
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
            
            // Отображение профиля
            this.renderProfile();
            
            // Анимация появления
            this.animateContent();
            
        } catch (error) {
            console.error('Ошибка инициализации приложения:', error);
            this.showError('Не удалось загрузить приложение');
        }
    }

    async loadProfile() {
        try {
            const response = await fetch('/api/profile');
            const result = await response.json();
            
            if (result.success) {
                this.profileData = result.data;
            } else {
                throw new Error(result.error || 'Неизвестная ошибка');
            }
        } catch (error) {
            console.error('Ошибка загрузки профиля:', error);
            throw error;
        }
    }

    renderProfile() {
        if (!this.profileData) return;

        // Обновление основной информации
        document.getElementById('profile-name').textContent = this.profileData.full_name;
        document.getElementById('profile-description').textContent = this.profileData.description;
        document.getElementById('profile-phone').textContent = this.profileData.phone;
        document.getElementById('profile-education').textContent = this.profileData.education;

        // GitHub ссылка
        const githubLink = document.getElementById('profile-github');
        githubLink.href = this.profileData.github_url || '#';
        githubLink.textContent = this.profileData.github_url ? 
            this.profileData.github_url.replace('https://', '') : 'GitHub профиль';

        // Фото профиля
        const avatar = document.getElementById('profile-avatar');
        const avatarPlaceholder = document.getElementById('avatar-placeholder');
        
        if (this.profileData.photo_url) {
            avatar.src = this.profileData.photo_url;
            avatar.style.display = 'block';
            avatarPlaceholder.style.display = 'none';
        } else {
            avatar.style.display = 'none';
            avatarPlaceholder.style.display = 'flex';
        }

        // Отображение навыков
        this.renderSkills();
        
        // Отображение проектов
        this.renderProjects();
    }

    renderSkills() {
        const skillsContainer = document.getElementById('skills-grid');
        skillsContainer.innerHTML = '';

        const skills = this.profileData.skills || [];
        skills.forEach(skill => {
            const skillTag = document.createElement('div');
            skillTag.className = 'skill-tag';
            skillTag.textContent = skill;
            skillsContainer.appendChild(skillTag);
        });
    }

    renderProjects() {
        const projectsContainer = document.getElementById('projects-grid');
        projectsContainer.innerHTML = '';

        const projects = this.profileData.projects || [];
        projects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';
            
            projectCard.innerHTML = `
                <h3 class="project-title">${this.escapeHtml(project.title)}</h3>
                <p class="project-description">${this.escapeHtml(project.description)}</p>
                <a href="${project.url}" target="_blank" class="project-link">
                    Посмотреть проект
                    <i data-lucide="external-link"></i>
                </a>
            `;
            
            projectsContainer.appendChild(projectCard);
        });

        // Инициализация иконок для проектов
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    initEventListeners() {
        // Обработчик для экспорта профиля
        window.exportProfile = () => this.exportProfile();
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

    animateContent() {
        // Анимация появления контента
        const content = document.getElementById('profile-content');
        content.style.display = 'block';
        content.classList.add('fade-in');
        
        // Скрытие загрузчика
        const loading = document.getElementById('loading');
        loading.style.display = 'none';
    }

    showError(message) {
        // Скрытие загрузчика и контента
        document.getElementById('loading').style.display = 'none';
        document.getElementById('profile-content').style.display = 'none';
        
        // Показ ошибки
        const errorElement = document.getElementById('error-message');
        errorElement.style.display = 'block';
        errorElement.querySelector('span').textContent = message;
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

// Инициализация приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    new ProfileApp();
});

// Экспорт для использования в других модулях
window.ProfileApp = ProfileApp;