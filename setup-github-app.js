const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class GitHubAppSetup {
    constructor() {
        this.appId = '1791092';
        this.webhookSecret = 'Iv23liw7hNvMUncWiNXq';
        this.privateKeyPath = './private-key.pem';
        this.envPath = './.env';
    }

    log(message, type = 'info') {
        const icons = {
            info: '📝',
            success: '✅',
            error: '❌',
            warning: '⚠️',
            step: '🔧'
        };
        console.log(`${icons[type]} ${message}`);
    }

    checkPrivateKey() {
        this.log('Private key faylı yoxlanılır...', 'step');
        
        if (!fs.existsSync(this.privateKeyPath)) {
            this.log('Private key faylı tapılmadı!', 'error');
            this.log('\n📋 Private key əldə etmək üçün addımlar:', 'info');
            console.log('1. https://github.com/settings/apps səhifəsinə gedin');
            console.log('2. "ProlineGe-Deployment" app-ini seçin');
            console.log('3. "Generate a private key" düyməsinə basın');
            console.log('4. Yüklənən .pem faylını bu qovluğa kopyalayın');
            console.log('5. Faylı "private-key.pem" adı ilə saxlayın');
            console.log('6. Bu skripti yenidən işə salın');
            return false;
        }
        
        this.log('Private key faylı tapıldı!', 'success');
        return true;
    }

    setupEnvFile() {
        this.log('.env faylı konfiqurasiya edilir...', 'step');
        
        let envContent = '';
        
        if (fs.existsSync(this.envPath)) {
            envContent = fs.readFileSync(this.envPath, 'utf8');
        } else if (fs.existsSync('./.env.example')) {
            envContent = fs.readFileSync('./.env.example', 'utf8');
            this.log('.env.example faylından kopyalanır...', 'info');
        }

        // GitHub App məlumatlarını yenilə
        const updates = {
            'GITHUB_APP_ID': this.appId,
            'GITHUB_WEBHOOK_SECRET': this.webhookSecret,
            'GITHUB_PRIVATE_KEY_PATH': this.privateKeyPath
        };

        Object.entries(updates).forEach(([key, value]) => {
            const regex = new RegExp(`${key}=.*`, 'g');
            if (envContent.includes(`${key}=`)) {
                envContent = envContent.replace(regex, `${key}=${value}`);
            } else {
                envContent += `\n${key}=${value}`;
            }
        });

        fs.writeFileSync(this.envPath, envContent);
        this.log('.env faylı yeniləndi!', 'success');
    }

    async getInstallationId() {
        this.log('Installation ID əldə edilir...', 'step');
        
        try {
            // dotenv yüklə
            require('dotenv').config();
            
            const { Octokit } = require('@octokit/rest');
            const { createAppAuth } = require('@octokit/auth-app');
            
            const privateKey = fs.readFileSync(this.privateKeyPath, 'utf8');
            
            const octokit = new Octokit({
                authStrategy: createAppAuth,
                auth: {
                    appId: this.appId,
                    privateKey: privateKey,
                },
            });

            const { data: installations } = await octokit.rest.apps.listInstallations();
            
            if (installations.length === 0) {
                this.log('Heç bir installation tapılmadı!', 'error');
                this.log('\n📋 GitHub App quraşdırmaq üçün:', 'info');
                console.log('1. https://github.com/settings/apps səhifəsinə gedin');
                console.log('2. "ProlineGe-Deployment" app-ini seçin');
                console.log('3. "Install App" düyməsinə basın');
                console.log('4. "MetlebHuseynov/ProlineGe" repository-ni seçin');
                console.log('5. "Install" düyməsinə basın');
                console.log('6. Bu skripti yenidən işə salın');
                return false;
            }

            const installation = installations[0];
            this.log(`Installation tapıldı: ${installation.account.login}`, 'success');
            this.log(`Installation ID: ${installation.id}`, 'info');

            // .env faylını yenilə
            let envContent = fs.readFileSync(this.envPath, 'utf8');
            const installationRegex = /GITHUB_INSTALLATION_ID=.*/g;
            
            if (envContent.includes('GITHUB_INSTALLATION_ID=')) {
                envContent = envContent.replace(installationRegex, `GITHUB_INSTALLATION_ID=${installation.id}`);
            } else {
                envContent += `\nGITHUB_INSTALLATION_ID=${installation.id}`;
            }
            
            fs.writeFileSync(this.envPath, envContent);
            this.log('Installation ID .env faylına əlavə edildi!', 'success');
            
            return true;
        } catch (error) {
            this.log(`Installation ID əldə edilərkən xəta: ${error.message}`, 'error');
            
            if (error.status === 401) {
                this.log('Authentication xətası - Private key və ya App ID yanlışdır', 'warning');
            }
            
            return false;
        }
    }

    testWebhook() {
        this.log('Webhook konfiqurasiyası test edilir...', 'step');
        
        try {
            const { handleWebhook, getWebhookStatus } = require('./webhook-handler');
            this.log('Webhook handler uğurla yükləndi!', 'success');
            
            // Server.js-də webhook endpoint-in mövcudluğunu yoxla
            const serverContent = fs.readFileSync('./server.js', 'utf8');
            if (serverContent.includes('/webhook')) {
                this.log('Webhook endpoint server.js-də mövcuddur!', 'success');
            } else {
                this.log('Webhook endpoint server.js-də tapılmadı!', 'warning');
            }
            
            return true;
        } catch (error) {
            this.log(`Webhook test xətası: ${error.message}`, 'error');
            return false;
        }
    }

    showFinalInstructions() {
        this.log('\n🎉 GitHub App konfiqurasiyası tamamlandı!', 'success');
        console.log('\n📋 Növbəti addımlar:');
        console.log('1. Server-i işə salın: npm start');
        console.log('2. Repository-də test commit edin');
        console.log('3. Webhook-ların işlədiyini yoxlayın');
        console.log('\n🔗 Faydalı linklər:');
        console.log('- GitHub App: https://github.com/settings/apps');
        console.log('- Repository: https://github.com/MetlebHuseynov/ProlineGe');
        console.log('- Webhook logs: GitHub App səhifəsində "Advanced" > "Recent Deliveries"');
        console.log('\n📁 Yaradılan fayllar:');
        console.log('- .env (GitHub App konfiqurasiyası)');
        console.log('- webhook-handler.js (Webhook işləyicisi)');
        console.log('- get-installation-id.js (Installation ID skripti)');
        console.log('- GITHUB_APP_SETUP.md (Təfərrüatlı təlimat)');
    }

    async run() {
        console.log('🚀 GitHub App Avtomatik Quraşdırma');
        console.log('=' .repeat(50));
        
        // 1. Private key yoxla
        if (!this.checkPrivateKey()) {
            return;
        }
        
        // 2. .env faylını qur
        this.setupEnvFile();
        
        // 3. Installation ID əldə et
        const installationSuccess = await this.getInstallationId();
        if (!installationSuccess) {
            return;
        }
        
        // 4. Webhook test et
        this.testWebhook();
        
        // 5. Final təlimatlar
        this.showFinalInstructions();
    }
}

// Skripti işə sal
if (require.main === module) {
    const setup = new GitHubAppSetup();
    setup.run().catch(console.error);
}

module.exports = GitHubAppSetup;