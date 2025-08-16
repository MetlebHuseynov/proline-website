const { Octokit } = require('@octokit/rest');
const { createAppAuth } = require('@octokit/auth-app');
const fs = require('fs');
require('dotenv').config();

async function getInstallationId() {
    console.log('GitHub App Installation ID əldə edilir...');
    console.log('App ID:', process.env.GITHUB_APP_ID);
    
    // Private key faylının mövcudluğunu yoxla
    const privateKeyPath = process.env.GITHUB_PRIVATE_KEY_PATH || './private-key.pem';
    
    if (!fs.existsSync(privateKeyPath)) {
        console.error('❌ Private key faylı tapılmadı:', privateKeyPath);
        console.log('\n📝 Private key əldə etmək üçün:');
        console.log('1. GitHub App səhifəsinə gedin');
        console.log('2. "Generate a private key" düyməsinə basın');
        console.log('3. Yüklənən .pem faylını proyekt qovluğuna kopyalayın');
        console.log('4. Faylı "private-key.pem" adı ilə saxlayın');
        return;
    }
    
    try {
        const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        
        const octokit = new Octokit({
            authStrategy: createAppAuth,
            auth: {
                appId: process.env.GITHUB_APP_ID,
                privateKey: privateKey,
            },
        });

        const { data: installations } = await octokit.rest.apps.listInstallations();
        
        if (installations.length === 0) {
            console.log('❌ Heç bir installation tapılmadı.');
            console.log('\n📝 GitHub App quraşdırmaq üçün:');
            console.log('1. GitHub App səhifəsinə gedin');
            console.log('2. "Install App" seçin');
            console.log('3. Repository seçin və quraşdırın');
            return;
        }
        
        console.log('\n✅ Installation(lar) tapıldı:');
        console.log('=' .repeat(50));
        
        installations.forEach((installation, index) => {
            console.log(`\n📦 Installation ${index + 1}:`);
            console.log(`   ID: ${installation.id}`);
            console.log(`   Account: ${installation.account.login}`);
            console.log(`   Type: ${installation.account.type}`);
            console.log(`   Repository Access: ${installation.repository_selection}`);
            console.log(`   Created: ${new Date(installation.created_at).toLocaleDateString()}`);
            
            if (installation.repository_selection === 'selected') {
                console.log(`   Selected Repositories: ${installation.repositories?.length || 'N/A'}`);
            }
        });
        
        // Əsas installation ID-ni göstər
        const mainInstallation = installations[0];
        console.log('\n🎯 Əsas Installation ID:', mainInstallation.id);
        console.log('\n📝 .env faylınızda bu dəyəri istifadə edin:');
        console.log(`GITHUB_INSTALLATION_ID=${mainInstallation.id}`);
        
        // .env faylını avtomatik yenilə
        const envPath = './.env';
        if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, 'utf8');
            
            if (envContent.includes('GITHUB_INSTALLATION_ID=')) {
                envContent = envContent.replace(
                    /GITHUB_INSTALLATION_ID=.*/,
                    `GITHUB_INSTALLATION_ID=${mainInstallation.id}`
                );
            } else {
                envContent += `\nGITHUB_INSTALLATION_ID=${mainInstallation.id}\n`;
            }
            
            fs.writeFileSync(envPath, envContent);
            console.log('\n✅ .env faylı avtomatik yeniləndi!');
        }
        
    } catch (error) {
        console.error('❌ Xəta baş verdi:', error.message);
        
        if (error.status === 401) {
            console.log('\n🔐 Authentication xətası:');
            console.log('- App ID düzgündür? (1791092)');
            console.log('- Private key faylı düzgündür?');
            console.log('- Private key faylı zədələnməyib?');
        } else if (error.status === 403) {
            console.log('\n🚫 İcazə xətası:');
            console.log('- GitHub App icazələrini yoxlayın');
            console.log('- App aktiv vəziyyətdədir?');
        }
    }
}

// Skripti işə sal
if (require.main === module) {
    getInstallationId().catch(console.error);
}

module.exports = { getInstallationId };