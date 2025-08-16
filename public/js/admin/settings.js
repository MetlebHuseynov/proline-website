class SettingsManager {
    constructor() {
        // Auto-detect environment for API URL
        const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        this.apiUrl = isProduction ? 'https://proline-website.onrender.com/api' : 'http://localhost:3000/api';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSystemInfo();
        this.loadSettings();
    }

    bindEvents() {
        // General settings form
        document.getElementById('general-settings-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveGeneralSettings();
        });

        // Security settings form
        document.getElementById('security-settings-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSecuritySettings();
        });

        // Email settings form
        document.getElementById('email-settings-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEmailSettings();
        });

        // Backup settings form
        document.getElementById('backup-settings-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBackupSettings();
        });

        // Test email button
        document.getElementById('test-email-btn').addEventListener('click', () => {
            this.testEmailSettings();
        });

        // Backup buttons
        document.getElementById('create-backup-btn').addEventListener('click', () => {
            this.createBackup();
        });

        document.getElementById('download-backup-btn').addEventListener('click', () => {
            this.downloadBackup();
        });

        document.getElementById('restore-backup-btn').addEventListener('click', () => {
            this.restoreBackup();
        });

        // Refresh system info
        document.getElementById('refresh-info-btn').addEventListener('click', () => {
            this.loadSystemInfo();
        });
    }

    getAuthToken() {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showMessage(message, type = 'success') {
        // Create a simple message display
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            background-color: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#ffc107'};
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    async loadSettings() {
        try {
            this.showLoading();
            
            const response = await fetch(`${this.apiUrl}/settings`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (response.ok) {
                const settings = await response.json();
                this.populateSettings(settings);
            } else {
                console.log('Settings not found, using defaults');
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            this.hideLoading();
        }
    }

    populateSettings(settings) {
        // General settings
        if (settings.general) {
            document.getElementById('site-title').value = settings.general.siteTitle || 'Old Bridge';
            document.getElementById('site-description').value = settings.general.siteDescription || '';
            document.getElementById('contact-email').value = settings.general.contactEmail || '';
            document.getElementById('contact-phone').value = settings.general.contactPhone || '';
        }

        // Security settings
        if (settings.security) {
            document.getElementById('session-timeout').value = settings.security.sessionTimeout || 60;
            document.getElementById('max-login-attempts').value = settings.security.maxLoginAttempts || 5;
            document.getElementById('require-strong-password').checked = settings.security.requireStrongPassword || false;
            document.getElementById('enable-two-factor').checked = settings.security.enableTwoFactor || false;
        }

        // Email settings
        if (settings.email) {
            document.getElementById('smtp-host').value = settings.email.smtpHost || '';
            document.getElementById('smtp-port').value = settings.email.smtpPort || 587;
            document.getElementById('smtp-security').value = settings.email.smtpSecurity || 'tls';
            document.getElementById('smtp-username').value = settings.email.smtpUsername || '';
            document.getElementById('from-email').value = settings.email.fromEmail || '';
        }

        // Backup settings
        if (settings.backup) {
            document.getElementById('auto-backup').checked = settings.backup.autoBackup || false;
            document.getElementById('backup-frequency').value = settings.backup.backupFrequency || 'weekly';
            document.getElementById('backup-retention').value = settings.backup.backupRetention || 30;
        }
    }

    async saveGeneralSettings() {
        try {
            this.showLoading();
            
            const formData = new FormData(document.getElementById('general-settings-form'));
            const settings = {
                siteTitle: formData.get('siteTitle'),
                siteDescription: formData.get('siteDescription'),
                contactEmail: formData.get('contactEmail'),
                contactPhone: formData.get('contactPhone')
            };

            const response = await fetch(`${this.apiUrl}/settings/general`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                this.showMessage('Ümumi tənzimləmələr saxlanıldı');
            } else {
                throw new Error('Failed to save general settings');
            }
        } catch (error) {
            console.error('Error saving general settings:', error);
            this.showMessage('Tənzimləmələr saxlanılarkən xəta baş verdi', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async saveSecuritySettings() {
        try {
            this.showLoading();
            
            const formData = new FormData(document.getElementById('security-settings-form'));
            const settings = {
                sessionTimeout: parseInt(formData.get('sessionTimeout')),
                maxLoginAttempts: parseInt(formData.get('maxLoginAttempts')),
                requireStrongPassword: formData.get('requireStrongPassword') === 'on',
                enableTwoFactor: formData.get('enableTwoFactor') === 'on'
            };

            const response = await fetch(`${this.apiUrl}/settings/security`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                this.showMessage('Təhlükəsizlik tənzimləmələri saxlanıldı');
            } else {
                throw new Error('Failed to save security settings');
            }
        } catch (error) {
            console.error('Error saving security settings:', error);
            this.showMessage('Tənzimləmələr saxlanılarkən xəta baş verdi', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async saveEmailSettings() {
        try {
            this.showLoading();
            
            const formData = new FormData(document.getElementById('email-settings-form'));
            const settings = {
                smtpHost: formData.get('smtpHost'),
                smtpPort: parseInt(formData.get('smtpPort')),
                smtpSecurity: formData.get('smtpSecurity'),
                smtpUsername: formData.get('smtpUsername'),
                smtpPassword: formData.get('smtpPassword'),
                fromEmail: formData.get('fromEmail')
            };

            const response = await fetch(`${this.apiUrl}/settings/email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                this.showMessage('Email tənzimləmələri saxlanıldı');
            } else {
                throw new Error('Failed to save email settings');
            }
        } catch (error) {
            console.error('Error saving email settings:', error);
            this.showMessage('Tənzimləmələr saxlanılarkən xəta baş verdi', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async saveBackupSettings() {
        try {
            this.showLoading();
            
            const formData = new FormData(document.getElementById('backup-settings-form'));
            const settings = {
                autoBackup: formData.get('autoBackup') === 'on',
                backupFrequency: formData.get('backupFrequency'),
                backupRetention: parseInt(formData.get('backupRetention'))
            };

            const response = await fetch(`${this.apiUrl}/settings/backup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                this.showMessage('Yedəkləmə tənzimləmələri saxlanıldı');
            } else {
                throw new Error('Failed to save backup settings');
            }
        } catch (error) {
            console.error('Error saving backup settings:', error);
            this.showMessage('Tənzimləmələr saxlanılarkən xəta baş verdi', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async testEmailSettings() {
        try {
            this.showLoading();
            
            const response = await fetch(`${this.apiUrl}/settings/email/test`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (response.ok) {
                this.showMessage('Test email göndərildi');
            } else {
                throw new Error('Failed to send test email');
            }
        } catch (error) {
            console.error('Error testing email:', error);
            this.showMessage('Email test edilərkən xəta baş verdi', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async createBackup() {
        try {
            this.showLoading();
            
            const response = await fetch(`${this.apiUrl}/backup/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (response.ok) {
                this.showMessage('Yedək yaradıldı');
                this.loadBackupInfo();
            } else {
                throw new Error('Failed to create backup');
            }
        } catch (error) {
            console.error('Error creating backup:', error);
            this.showMessage('Yedək yaradılarkən xəta baş verdi', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async downloadBackup() {
        try {
            const response = await fetch(`${this.apiUrl}/backup/download`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `backup-${new Date().toISOString().split('T')[0]}.zip`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                this.showMessage('Yedək yükləndi');
            } else {
                throw new Error('Failed to download backup');
            }
        } catch (error) {
            console.error('Error downloading backup:', error);
            this.showMessage('Yedək yüklənərkən xəta baş verdi', 'error');
        }
    }

    async restoreBackup() {
        if (!confirm('Bu əməliyyat mövcud məlumatları əvəz edəcək. Davam etmək istəyirsiniz?')) {
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                this.showLoading();
                
                const formData = new FormData();
                formData.append('backup', file);

                const response = await fetch(`${this.apiUrl}/backup/restore`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.getAuthToken()}`
                    },
                    body: formData
                });

                if (response.ok) {
                    this.showMessage('Yedəkdən bərpa edildi');
                } else {
                    throw new Error('Failed to restore backup');
                }
            } catch (error) {
                console.error('Error restoring backup:', error);
                this.showMessage('Yedəkdən bərpa edilərkən xəta baş verdi', 'error');
            } finally {
                this.hideLoading();
            }
        };
        input.click();
    }

    async loadSystemInfo() {
        try {
            const response = await fetch(`${this.apiUrl}/system/info`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (response.ok) {
                const info = await response.json();
                document.getElementById('node-version').textContent = info.nodeVersion || '-';
                document.getElementById('memory-usage').textContent = info.memoryUsage || '-';
                document.getElementById('disk-space').textContent = info.diskSpace || '-';
                document.getElementById('server-time').textContent = new Date().toLocaleString('az-AZ');
            }
        } catch (error) {
            console.error('Error loading system info:', error);
        }
    }

    async loadBackupInfo() {
        try {
            const response = await fetch(`${this.apiUrl}/backup/info`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (response.ok) {
                const info = await response.json();
                document.getElementById('last-backup').textContent = info.lastBackup || 'Heç vaxt';
                document.getElementById('backup-count').textContent = info.backupCount || '0';
            }
        } catch (error) {
            console.error('Error loading backup info:', error);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SettingsManager();
});