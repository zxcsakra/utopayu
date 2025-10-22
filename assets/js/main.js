class Messenger {
    constructor() {
        this.currentUser = null;
        this.currentChat = null;
        this.users = JSON.parse(localStorage.getItem('messenger_users')) || {};
        this.messages = JSON.parse(localStorage.getItem('messenger_messages')) || {};
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuth();
        this.loadUsers();
    }

    bindEvents() {
        // Авторизация
        document.getElementById('authForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAuth();
        });

        // Переключение темы
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Выход
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Отправка сообщения
        document.getElementById('sendBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Поиск пользователей
        document.getElementById('searchUsers').addEventListener('click', () => {
            this.showUserSearch();
        });

        document.getElementById('closeSearchModal').addEventListener('click', () => {
            this.hideUserSearch();
        });

        document.getElementById('userSearchInput').addEventListener('input', (e) => {
            this.searchUsers(e.target.value);
        });

        // Запись голоса
        document.getElementById('recordBtn').addEventListener('click', () => {
            this.toggleRecording();
        });

        // Отправка файлов
        document.getElementById('fileBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files[0]);
        });
    }

    handleAuth() {
        const nickname = document.getElementById('nicknameInput').value;
        const password = document.getElementById('passwordInput').value;

        if (!nickname || !password) {
            alert('Заполните все поля');
            return;
        }

        if (this.users[nickname]) {
            // Проверка пароля
            if (this.users[nickname].password === password) {
                this.login(nickname);
            } else {
                alert('Неверный пароль');
            }
        } else {
            // Регистрация
            this.users[nickname] = {
                password: password,
                createdAt: new Date().toISOString()
            };
            localStorage.setItem('messenger_users', JSON.stringify(this.users));
            this.login(nickname);
        }
    }

    login(nickname) {
        this.currentUser = nickname;
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'block';
        this.updateUI();
    }

    logout() {
        this.currentUser = null;
        this.currentChat = null;
        document.getElementById('authModal').style.display = 'flex';
        document.getElementById('logoutBtn').style.display = 'none';
        this.updateUI();
    }

    checkAuth() {
        // В реальном приложении здесь была бы проверка токена
        if (this.currentUser) {
            document.getElementById('authModal').style.display = 'none';
            document.getElementById('logoutBtn').style.display = 'block';
        } else {
            document.getElementById('authModal').style.display = 'flex';
        }
    }

    toggleTheme() {
        const body = document.body;
        const themeToggle = document.getElementById('themeToggle');
        
        if (body.classList.contains('light-theme')) {
            body.classList.replace('light-theme', 'dark-theme');
            themeToggle.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.replace('dark-theme', 'light-theme');
            themeToggle.textContent = '🌙';
            localStorage.setItem('theme', 'light');
        }
    }

    loadUsers() {
        const userList = document.getElementById('userList');
        userList.innerHTML = '';

        Object.keys(this.users).forEach(username => {
            if (username !== this.currentUser) {
                const userItem = document.createElement('div');
                userItem.className = 'user-item';
                userItem.textContent = username;
                userItem.addEventListener('click', () => {
                    this.selectChat(username);
                });
                userList.appendChild(userItem);
            }
        });
    }

    selectChat(username) {
        this.currentChat = username;
        document.querySelectorAll('.user-item').forEach(item => {
            item.classList.remove('active');
        });
        event.target.classList.add('active');
        this.loadMessages();
    }

    sendMessage() {
        const input = document.getElementById('messageInput');
        const content = input.value.trim();

        if (!content || !this.currentChat) return;

        const message = {
            id: Date.now(),
            from: this.currentUser,
            to: this.currentChat,
            content: content,
            timestamp: new Date().toISOString(),
            type: 'text'
        };

        this.saveMessage(message);
        this.displayMessage(message);
        input.value = '';
    }

    saveMessage(message) {
        const chatId = [this.currentUser, this.currentChat].sort().join('_');
        if (!this.messages[chatId]) {
            this.messages[chatId] = [];
        }
        this.messages[chatId].push(message);
        localStorage.setItem('messenger_messages', JSON.stringify(this.messages));
    }

    displayMessage(message) {
        const messagesContainer = document.getElementById('messagesContainer');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.from === this.currentUser ? 'own' : ''}`;
        
        messageDiv.innerHTML = `
            <div class="message-info">
                ${message.from} • ${new Date(message.timestamp).toLocaleTimeString()}
            </div>
            <div class="message-content">
                ${this.formatMessageContent(message)}
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    formatMessageContent(message) {
        switch (message.type) {
            case 'voice':
                return `<audio controls src="${message.content}"></audio>`;
            case 'file':
                return `<a href="${message.content}" download>📎 ${message.fileName}</a>`;
            default:
                return message.content;
        }
    }

    loadMessages() {
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = '';

        if (!this.currentChat) return;

        const chatId = [this.currentUser, this.currentChat].sort().join('_');
        const chatMessages = this.messages[chatId] || [];

        chatMessages.forEach(message => {
            this.displayMessage(message);
        });
    }

    showUserSearch() {
        document.getElementById('userSearchModal').style.display = 'flex';
    }

    hideUserSearch() {
        document.getElementById('userSearchModal').style.display = 'none';
    }

    searchUsers(query) {
        const resultsContainer = document.getElementById('userSearchResults');
        resultsContainer.innerHTML = '';

        if (!query) return;

        const filteredUsers = Object.keys(this.users).filter(username => 
            username.toLowerCase().includes(query.toLowerCase()) && 
            username !== this.currentUser
        );

        filteredUsers.forEach(username => {
            const userDiv = document.createElement('div');
            userDiv.className = 'user-item';
            userDiv.textContent = username;
            userDiv.addEventListener('click', () => {
                this.selectChat(username);
                this.hideUserSearch();
            });
            resultsContainer.appendChild(userDiv);
        });
    }

    async toggleRecording() {
        if (!this.isRecording) {
            await this.startRecording();
        } else {
            this.stopRecording();
        }
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                this.sendVoiceMessage(audioUrl);
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            document.getElementById('recordBtn').classList.add('recording');
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Не удалось получить доступ к микрофону');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            this.isRecording = false;
            document.getElementById('recordBtn').classList.remove('recording');
        }
    }

    sendVoiceMessage(audioUrl) {
        if (!this.currentChat) return;

        const message = {
            id: Date.now(),
            from: this.currentUser,
            to: this.currentChat,
            content: audioUrl,
            timestamp: new Date().toISOString(),
            type: 'voice'
        };

        this.saveMessage(message);
        this.displayMessage(message);
    }

    handleFileUpload(file) {
        if (!file || !this.currentChat) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const message = {
                id: Date.now(),
                from: this.currentUser,
                to: this.currentChat,
                content: e.target.result,
                fileName: file.name,
                timestamp: new Date().toISOString(),
                type: 'file'
            };

            this.saveMessage(message);
            this.displayMessage(message);
        };
        reader.readAsDataURL(file);
    }

    updateUI() {
        const mainContent = document.querySelector('.main-container');
        if (this.currentUser) {
            mainContent.style.display = 'flex';
            this.loadUsers();
        } else {
            mainContent.style.display = 'none';
        }
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    // Восстановление темы
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.add(savedTheme + '-theme');
    document.getElementById('themeToggle').textContent = 
        savedTheme === 'light' ? '🌙' : '☀️';

    new Messenger();
});
