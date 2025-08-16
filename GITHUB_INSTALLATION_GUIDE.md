# GitHub App Installation ID Əldə Etmə Təlimatı

## Installation ID Nədir?

Installation ID, GitHub App-in hansı repository və ya organization-da quraşdırıldığını göstərən unikal identifikatordur. Bu ID webhook-lar və API çağırışları üçün vacibdir.

## Installation ID Əldə Etmə Addımları

### Metod 1: GitHub Web Interface

1. **GitHub hesabınıza daxil olun**
2. **Settings** > **Developer settings** > **GitHub Apps** seçin
3. Yaratdığınız App-i seçin (ProlineGe-Deployment)
4. Sol menyudan **Install App** seçin
5. **Install** düyməsinə basın
6. Repository seçin (MetlebHuseynov/ProlineGe)
7. **Install** düyməsinə basın

### Metod 2: URL-dən Installation ID Əldə Etmə

Quraşdırma tamamlandıqdan sonra URL-də Installation ID görünəcək:
```
https://github.com/settings/installations/12345678
```
Burada `12345678` sizin Installation ID-nizdir.

### Metod 3: API ilə Əldə Etmə

Aşağıdakı Node.js skriptini istifadə edərək Installation ID-ni əldə edə bilərsiniz:

```javascript
const { Octokit } = require('@octokit/rest');
const { createAppAuth } = require('@octokit/auth-app');
const fs = require('fs');

async function getInstallationId() {
    const octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
            appId: 1791092,
            privateKey: fs.readFileSync('./private-key.pem', 'utf8'),
        },
    });

    try {
        const { data: installations } = await octokit.rest.apps.listInstallations();
        console.log('Installations:', installations);
        
        installations.forEach(installation => {
            console.log(`Installation ID: ${installation.id}`);
            console.log(`Account: ${installation.account.login}`);
            console.log(`Repository Access: ${installation.repository_selection}`);
            console.log('---');
        });
    } catch (error) {
        console.error('Error:', error.message);
    }
}

getInstallationId();
```

## .env Faylını Yeniləmə

Installation ID əldə etdikdən sonra `.env` faylında yeniləyin:

```env
GITHUB_INSTALLATION_ID=your_actual_installation_id_here
```

## Private Key Faylını Əlavə Etmə

1. GitHub App səhifəsində **Generate a private key** düyməsinə basın
2. Yüklənən `.pem` faylını proyekt qovluğuna kopyalayın
3. Faylı `private-key.pem` adı ilə saxlayın

## Test Etmə

Konfiqurasiya tamamlandıqdan sonra:

```bash
node -e "console.log('GitHub App ID:', process.env.GITHUB_APP_ID); console.log('Installation ID:', process.env.GITHUB_INSTALLATION_ID);"
```

## Troubleshooting

### Problem: Installation ID tapılmır
**Həll**: GitHub App-in düzgün quraşdırıldığından əmin olun

### Problem: Private key xətası
**Həll**: `.pem` faylının düzgün yerdə olduğunu yoxlayın

### Problem: Permission denied
**Həll**: App icazələrini yoxlayın

## Təhlükəsizlik Qeydləri

- Private key faylını heç vaxt Git repository-yə commit etməyin
- `.env` faylını `.gitignore`-a əlavə edin
- Production-da environment variables istifadə edin

## Nəticə

Installation ID əldə etdikdən sonra GitHub App tam işlək vəziyyətdə olacaq və avtomatik deployment başlayacaq.