# GitHub App Yaratma Təlimatı

## GitHub App Nədir?

GitHub App, GitHub platformasında avtomatik əməliyyatlar aparmaq üçün istifadə olunan bir integrasiya növüdür. Bu, sizə aşağıdakı imkanları verir:

- Repository-lərə avtomatik deployment
- Webhook-lar vasitəsilə real-time yeniləmələr
- GitHub Actions ilə CI/CD pipeline
- Təhlükəsiz authentication

## GitHub App Yaratma Addımları

### 1. GitHub Developer Settings-ə Giriş

1. GitHub hesabınıza daxil olun
2. Sağ yuxarı küncdəki profil şəklinə klikləyin
3. **Settings** seçin
4. Sol menyudan **Developer settings** seçin
5. **GitHub Apps** seçin
6. **New GitHub App** düyməsinə basın

### 2. App Məlumatlarını Doldurma

#### Əsas Məlumatlar:
- **GitHub App name**: `ProlineGe-Deployment`
- **Description**: `Avtomatik deployment və real-time yeniləmələr üçün`
- **Homepage URL**: `https://your-domain.com` (və ya GitHub repo URL-i)

#### Webhook Konfiqurasiyası:
- **Webhook URL**: `https://your-domain.com/webhook` (və ya Vercel/Firebase URL)
- **Webhook secret**: Güclü bir parol yaradın və qeyd edin

### 3. İcazələr (Permissions)

Aşağıdakı icazələri verin:

#### Repository permissions:
- **Contents**: Read & Write
- **Metadata**: Read
- **Pull requests**: Read & Write
- **Issues**: Read & Write
- **Actions**: Read

#### Account permissions:
- **Email addresses**: Read

### 4. Events Subscription

Aşağıdakı event-ləri seçin:
- **Push**
- **Pull request**
- **Issues**
- **Release**

### 5. App Yaratma

1. **Create GitHub App** düyməsinə basın
2. App yaradıldıqdan sonra **App ID**-ni qeyd edin
3. **Generate a private key** düyməsinə basın və `.pem` faylını yükləyin

## Installation və Konfiqurasiya

### 1. App-i Repository-yə Quraşdırma

1. Yaratdığınız App səhifəsində **Install App** seçin
2. Hansı repository-lərə quraşdırmaq istədiyinizi seçin
3. **Install** düyməsinə basın

### 2. Environment Variables

Aşağıdakı məlumatları `.env` faylına əlavə edin:

```env
# GitHub App Konfiqurasiyası
GITHUB_APP_ID=your_app_id
GITHUB_PRIVATE_KEY_PATH=./private-key.pem
GITHUB_WEBHOOK_SECRET=your_webhook_secret
GITHUB_INSTALLATION_ID=your_installation_id
```

### 3. Private Key Faylını Yerləşdirmə

1. Yüklədiyiniz `.pem` faylını proyekt qovluğuna kopyalayın
2. Faylı `private-key.pem` adı ilə saxlayın
3. `.gitignore` faylına `private-key.pem` əlavə edin

## Webhook Handler Yaratma

### Node.js ilə Webhook Handler

`webhook-handler.js` faylı yaradın:

```javascript
const crypto = require('crypto');
const { Octokit } = require('@octokit/rest');
const { createAppAuth } = require('@octokit/auth-app');

// GitHub App konfiqurasiyası
const appId = process.env.GITHUB_APP_ID;
const privateKey = require('fs').readFileSync(process.env.GITHUB_PRIVATE_KEY_PATH, 'utf8');
const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

// Webhook signature yoxlama
function verifySignature(payload, signature) {
    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// Webhook handler
async function handleWebhook(req, res) {
    const signature = req.headers['x-hub-signature-256'];
    const payload = JSON.stringify(req.body);
    
    if (!verifySignature(payload, signature)) {
        return res.status(401).send('Unauthorized');
    }
    
    const event = req.headers['x-github-event'];
    
    switch (event) {
        case 'push':
            await handlePushEvent(req.body);
            break;
        case 'pull_request':
            await handlePullRequestEvent(req.body);
            break;
        default:
            console.log(`Unhandled event: ${event}`);
    }
    
    res.status(200).send('OK');
}

// Push event handler
async function handlePushEvent(payload) {
    console.log('Push event received:', payload.ref);
    
    if (payload.ref === 'refs/heads/main') {
        // Avtomatik deployment başlat
        await triggerDeployment(payload.repository);
    }
}

// Deployment trigger
async function triggerDeployment(repository) {
    const octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
            appId: appId,
            privateKey: privateKey,
            installationId: process.env.GITHUB_INSTALLATION_ID,
        },
    });
    
    // GitHub Actions workflow trigger
    await octokit.rest.actions.createWorkflowDispatch({
        owner: repository.owner.login,
        repo: repository.name,
        workflow_id: 'deploy.yml',
        ref: 'main'
    });
    
    console.log('Deployment triggered for:', repository.full_name);
}

module.exports = { handleWebhook };
```

## Server.js-ə Webhook Əlavə Etmə

`server.js` faylına webhook endpoint əlavə edin:

```javascript
const { handleWebhook } = require('./webhook-handler');

// Webhook endpoint
app.post('/webhook', express.raw({type: 'application/json'}), handleWebhook);
```

## Deployment Platformları ilə İnteqrasiya

### Vercel ilə İnteqrasiya

1. Vercel dashboard-da proyektinizi seçin
2. **Settings** > **Git** bölməsinə gedin
3. **Deploy Hooks** yaradın
4. Webhook URL-ni GitHub App-də istifadə edin

### Firebase ilə İnteqrasiya

1. Firebase Console-da proyektinizi seçin
2. **Hosting** bölməsinə gedin
3. GitHub repository-ni bağlayın
4. Avtomatik deployment aktivləşdirin

## Təhlükəsizlik Tövsiyələri

1. **Private Key-i təhlükəsiz saxlayın**:
   - Heç vaxt Git repository-yə commit etməyin
   - Environment variables istifadə edin
   - Production-da secure storage istifadə edin

2. **Webhook Secret istifadə edin**:
   - Güclü parol yaradın
   - Signature verification həmişə edin

3. **Minimum icazələr verin**:
   - Yalnız lazım olan icazələri verin
   - Müntəzəm olaraq icazələri yoxlayın

## Test və Debug

### Webhook Test Etmə

1. **ngrok** istifadə edərək local webhook test edin:
```bash
npm install -g ngrok
ngrok http 3000
```

2. GitHub App-də webhook URL-ni ngrok URL ilə əvəz edin

3. Repository-də test commit edin

### Log Monitoring

```javascript
// Webhook events log etmə
console.log('Webhook received:', {
    event: req.headers['x-github-event'],
    delivery: req.headers['x-github-delivery'],
    timestamp: new Date().toISOString()
});
```

## Troubleshooting

### Ümumi Problemlər:

1. **401 Unauthorized**:
   - Webhook secret yoxlayın
   - Signature verification düzgün işləyir?

2. **403 Forbidden**:
   - App icazələrini yoxlayın
   - Installation ID düzgündür?

3. **404 Not Found**:
   - Webhook URL düzgündür?
   - Endpoint mövcuddur?

### Debug Məsləhətləri:

1. GitHub App səhifəsində **Advanced** > **Recent Deliveries** bölməsini yoxlayın
2. Webhook response kodlarını izləyin
3. Server loglarını yoxlayın

## Nəticə

GitHub App yaratdıqdan sonra:

1. ✅ Avtomatik deployment aktivləşəcək
2. ✅ Real-time webhook events alacaqsınız
3. ✅ Təhlükəsiz authentication olacaq
4. ✅ GitHub Actions ilə CI/CD pipeline işləyəcək

Bu konfiqurasiya ilə proyektiniz tam avtomatik deployment sistemə sahib olacaq və hər commit-dən sonra avtomatik olaraq yenilənəcək.

## Əlavə Resurslar

- [GitHub Apps Documentation](https://docs.github.com/en/developers/apps)
- [Octokit.js Documentation](https://octokit.github.io/rest.js/)
- [Webhook Events](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads)
- [GitHub Actions](https://docs.github.com/en/actions)