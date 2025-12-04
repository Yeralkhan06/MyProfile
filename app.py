#!/usr/bin/env python3
"""
Личный профиль веб-разработчика Мақсұт Ералхан
Полноценное веб-приложение с REST API и базой данных
"""

from flask import Flask, jsonify, request, render_template, send_file
from flask_cors import CORS
import sqlite3
import json
from datetime import datetime
import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
import tempfile

app = Flask(__name__)
CORS(app)

# Конфигурация базы данных
DATABASE = 'profile.db'

def init_db():
    """Инициализация базы данных"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Создание таблицы профиля
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS profile (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            description TEXT,
            skills TEXT,
            phone TEXT,
            education TEXT,
            github_url TEXT,
            projects TEXT,
            photo_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Вставка данных по умолчанию
    cursor.execute('''
        INSERT OR REPLACE INTO profile (id, full_name, description, skills, phone, education, github_url, projects, photo_url)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        'Мақсұт Ералхан Дарханұлы',
        'занимается версткой сайта, а также java разработчик',
        'Верстка сайтов, создание небольших приложений, художник, контентмейкер',
        '8 777 199 9922',
        'Выпускник Международного Университета Астана',
        'https://github.com/Yeralkhan06',
        json.dumps([
            {
                'title': 'Ветеринарная клиника API',
                'description': 'API для системы управления ветеринарной клиникой',
                'url': 'https://yeralkhan06.github.io/vet-clinic-api1/'
            },
            {
                'title': 'AirPlan - Планировщик полетов',
                'description': 'Веб-приложение для планирования авиаперелетов',
                'url': 'https://yeralkhan06.github.io/AirPlan3/'
            },
            {
                'title': 'Hello2Site',
                'description': 'Корпоративный сайт для малого бизнеса',
                'url': 'https://yeralkhan06.github.io/Hello2Site/'
            },
            {
                'title': 'Video Production',
                'description': 'Портфолио видеопродакшн студии',
                'url': 'https://yeralkhan06.github.io/Video-Production/'
            }
        ]),
        ''  # Путь к фото (можно загрузить позже)
    ))
    
    conn.commit()
    conn.close()

def get_db_connection():
    """Получение соединения с базой данных"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# API маршруты
@app.route('/api/profile', methods=['GET'])
def get_profile():
    """Получение профиля пользователя"""
    try:
        conn = get_db_connection()
        profile = conn.execute('SELECT * FROM profile WHERE id = 1').fetchone()
        conn.close()
        
        if profile:
            profile_dict = dict(profile)
            # Парсинг JSON полей
            profile_dict['skills'] = json.loads(profile_dict['skills']) if profile_dict['skills'] else []
            profile_dict['projects'] = json.loads(profile_dict['projects']) if profile_dict['projects'] else []
            
            return jsonify({
                'success': True,
                'data': profile_dict
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Профиль не найден'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    """Получение профиля пользователя"""
    try:
        conn = get_db_connection()
        profile = conn.execute('SELECT * FROM profile WHERE id = 1').fetchone()
        conn.close()
        
        if profile:
            profile_dict = dict(profile)
            # Парсинг JSON полей
            profile_dict['skills'] = json.loads(profile_dict['skills']) if profile_dict['skills'] else []
            profile_dict['projects'] = json.loads(profile_dict['projects']) if profile_dict['projects'] else []
            
            return jsonify({
                'success': True,
                'data': profile_dict
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Профиль не найден'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/profile', methods=['PUT'])
def update_profile():
    """Обновление профиля пользователя"""
    try:
        data = request.get_json()
        
        # Валидация обязательных полей
        required_fields = ['full_name', 'description', 'skills', 'phone', 'education']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    'success': False,
                    'error': f'Поле {field} обязательно для заполнения'
                }), 400
        
        conn = get_db_connection()
        
        # Обновление данных профиля
        cursor = conn.execute('''
            UPDATE profile 
            SET full_name = ?, description = ?, skills = ?, phone = ?, 
                education = ?, github_url = ?, projects = ?, photo_url = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        ''', (
            data['full_name'],
            data['description'],
            json.dumps(data['skills']),
            data['phone'],
            data['education'],
            data.get('github_url', ''),
            json.dumps(data['projects']),
            data.get('photo_url', '')
        ))
        
        conn.commit()
        conn.close()
        
        if cursor.rowcount > 0:
            return jsonify({
                'success': True,
                'message': 'Профиль успешно обновлен'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Профиль не найден'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/profile/export', methods=['GET'])
def export_profile():
    """Экспорт профиля в JSON"""
    try:
        conn = get_db_connection()
        profile = conn.execute('SELECT * FROM profile WHERE id = 1').fetchone()
        conn.close()
        
        if profile:
            profile_dict = dict(profile)
            # Парсинг JSON полей
            profile_dict['skills'] = json.loads(profile_dict['skills']) if profile_dict['skills'] else []
            profile_dict['projects'] = json.loads(profile_dict['projects']) if profile_dict['projects'] else []
            
            # Добавление метаданных экспорта
            export_data = {
                'export_info': {
                    'exported_at': datetime.now().isoformat(),
                    'version': '1.0',
                    'format': 'JSON'
                },
                'profile': profile_dict
            }
            
            return jsonify(export_data)
        else:
            return jsonify({
                'success': False,
                'error': 'Профиль не найден'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/profile/resume.pdf', methods=['GET'])
def generate_resume():
    """Генерация резюме в формате PDF"""
    try:
        conn = get_db_connection()
        profile = conn.execute('SELECT * FROM profile WHERE id = 1').fetchone()
        conn.close()
        
        if not profile:
            return jsonify({
                'success': False,
                'error': 'Профиль не найден'
            }), 404
        
        # Создание временного файла для PDF
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        temp_file.close()
        
        # Создание PDF
        doc = SimpleDocTemplate(temp_file.name, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        # Создание кастомных стилей
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            textColor=colors.darkblue,
            alignment=1  # центрирование
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            spaceAfter=12,
            textColor=colors.darkblue
        )
        
        # Заголовок
        story.append(Paragraph(profile['full_name'], title_style))
        story.append(Spacer(1, 12))
        
        # Контактная информация
        story.append(Paragraph('<b>Контактная информация:</b>', heading_style))
        story.append(Paragraph(f'Телефон: {profile["phone"]}', styles['Normal']))
        story.append(Paragraph(f'GitHub: {profile["github_url"]}', styles['Normal']))
        story.append(Spacer(1, 12))
        
        # Описание
        story.append(Paragraph('<b>Описание:</b>', heading_style))
        story.append(Paragraph(profile['description'], styles['Normal']))
        story.append(Spacer(1, 12))
        
        # Навыки
        story.append(Paragraph('<b>Навыки:</b>', heading_style))
        skills = json.loads(profile['skills']) if profile['skills'] else []
        for skill in skills:
            story.append(Paragraph(f'• {skill}', styles['Normal']))
        story.append(Spacer(1, 12))
        
        # Образование
        story.append(Paragraph('<b>Образование:</b>', heading_style))
        story.append(Paragraph(profile['education'], styles['Normal']))
        story.append(Spacer(1, 12))
        
        # Проекты
        story.append(Paragraph('<b>Проекты:</b>', heading_style))
        projects = json.loads(profile['projects']) if profile['projects'] else []
        for project in projects:
            story.append(Paragraph(f'<b>{project["title"]}</b>', styles['Normal']))
            story.append(Paragraph(f'  {project["description"]}', styles['Normal']))
            story.append(Paragraph(f'  {project["url"]}', styles['Normal']))
            story.append(Spacer(1, 6))
        
        # Построение PDF
        doc.build(story)
        
        # Отправка файла
        return send_file(
            temp_file.name,
            as_attachment=True,
            download_name=f'resume_{profile["full_name"].replace(" ", "_")}.pdf',
            mimetype='application/pdf'
        )
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Веб-маршруты
@app.route('/')
def index():
    """Главная страница профиля"""
    return render_template('index.html')

@app.route('/edit')
def edit_profile():
    """Страница редактирования профиля"""
    return render_template('edit.html')

if __name__ == '__main__':
    # Инициализация базы данных
    init_db()
    
    # Запуск сервера
    print("🚀 Запуск сервера разработки...")
    print("📱 Профиль доступен по адресу: http://localhost:5000")
    print("✏️  Редактирование: http://localhost:5000/edit")
    print("📄 PDF резюме: http://localhost:5000/api/profile/resume.pdf")
    print("📤 Экспорт JSON: http://localhost:5000/api/profile/export")
    
    app.run(debug=True, host='0.0.0.0', port=5000)