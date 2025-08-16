const crypto = require('crypto');
const { Octokit } = require('@octokit/rest');
const { createAppAuth } = require('@octokit/auth-app');
const fs = require('fs');

// GitHub App konfiqurasiyası
const appId = process.env.GITHUB_APP_ID;
const privateKeyPath = process.env.GITHUB_PRIVATE_KEY_PATH || './private-key.pem';
const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
const installationId = process.env.GITHUB_INSTALLATION_ID;

// Private key oxuma
function getPrivateKey() {
    try {
        return fs.readFileSync(privateKeyPath, 'utf8');
    } catch (error) {
        console.error('Private key oxuna bilmədi:', error.message);
        return null;
    }
}

// Webhook signature yoxlama
function verifySignature(payload, signature) {
    if (!webhookSecret) {
        console.warn('Webhook secret təyin edilməyib!');
        return false;
    }
    
    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// GitHub API client yaratma
function createGitHubClient() {
    const privateKey = getPrivateKey();
    if (!privateKey) {
        throw new Error('Private key tapılmadı');
    }
    
    return new Octokit({
        authStrategy: createAppAuth,
        auth: {
            appId: appId,
            privateKey: privateKey,
            installationId: installationId,
        },
    });
}

// Webhook handler
async function handleWebhook(req, res) {
    try {
        const signature = req.headers['x-hub-signature-256'];
        const event = req.headers['x-github-event'];
        const delivery = req.headers['x-github-delivery'];
        
        console.log('Webhook alındı:', {
            event: event,
            delivery: delivery,
            timestamp: new Date().toISOString()
        });
        
        // Payload string formatında alınır
        const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        
        // Signature yoxlama
        if (signature && !verifySignature(payload, signature)) {
            console.error('Webhook signature yoxlaması uğursuz!');
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        // Payload parse etmə
        const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        
        // Event-ə görə işləmə
        switch (event) {
            case 'push':
                await handlePushEvent(data);
                break;
            case 'pull_request':
                await handlePullRequestEvent(data);
                break;
            case 'issues':
                await handleIssuesEvent(data);
                break;
            case 'release':
                await handleReleaseEvent(data);
                break;
            default:
                console.log(`İşlənməyən event: ${event}`);
        }
        
        res.status(200).json({ message: 'Webhook uğurla işləndi' });
        
    } catch (error) {
        console.error('Webhook işləmə xətası:', error);
        res.status(500).json({ error: 'Daxili server xətası' });
    }
}

// Push event handler
async function handlePushEvent(payload) {
    console.log('Push event alındı:', {
        ref: payload.ref,
        repository: payload.repository.full_name,
        commits: payload.commits.length
    });
    
    // Main branch-a push olduqda deployment başlat
    if (payload.ref === 'refs/heads/main' || payload.ref === 'refs/heads/master') {
        console.log('Main branch-a push edildi, deployment başladılır...');
        await triggerDeployment(payload.repository, payload.ref);
    }
}

// Pull Request event handler
async function handlePullRequestEvent(payload) {
    console.log('Pull Request event alındı:', {
        action: payload.action,
        number: payload.number,
        title: payload.pull_request.title
    });
    
    // PR açıldıqda və ya yeniləndiyi zaman test deployment
    if (payload.action === 'opened' || payload.action === 'synchronize') {
        await triggerTestDeployment(payload.repository, payload.pull_request);
    }
}

// Issues event handler
async function handleIssuesEvent(payload) {
    console.log('Issues event alındı:', {
        action: payload.action,
        number: payload.issue.number,
        title: payload.issue.title
    });
    
    // Issue açıldıqda avtomatik label əlavə etmə
    if (payload.action === 'opened') {
        await addIssueLabels(payload.repository, payload.issue);
    }
}

// Release event handler
async function handleReleaseEvent(payload) {
    console.log('Release event alındı:', {
        action: payload.action,
        tag: payload.release.tag_name,
        name: payload.release.name
    });
    
    // Release yaradıldıqda production deployment
    if (payload.action === 'published') {
        await triggerProductionDeployment(payload.repository, payload.release);
    }
}

// Deployment trigger
async function triggerDeployment(repository, ref) {
    try {
        const octokit = createGitHubClient();
        
        // GitHub Actions workflow trigger
        await octokit.rest.actions.createWorkflowDispatch({
            owner: repository.owner.login,
            repo: repository.name,
            workflow_id: 'deploy.yml',
            ref: ref.replace('refs/heads/', '')
        });
        
        console.log('Deployment uğurla başladıldı:', repository.full_name);
        
    } catch (error) {
        console.error('Deployment başlatma xətası:', error.message);
    }
}

// Test deployment trigger
async function triggerTestDeployment(repository, pullRequest) {
    try {
        const octokit = createGitHubClient();
        
        // PR üçün test deployment
        await octokit.rest.actions.createWorkflowDispatch({
            owner: repository.owner.login,
            repo: repository.name,
            workflow_id: 'test-deploy.yml',
            ref: pullRequest.head.ref,
            inputs: {
                pr_number: pullRequest.number.toString(),
                pr_title: pullRequest.title
            }
        });
        
        console.log('Test deployment başladıldı PR #' + pullRequest.number);
        
    } catch (error) {
        console.error('Test deployment xətası:', error.message);
    }
}

// Production deployment trigger
async function triggerProductionDeployment(repository, release) {
    try {
        const octokit = createGitHubClient();
        
        // Production deployment
        await octokit.rest.actions.createWorkflowDispatch({
            owner: repository.owner.login,
            repo: repository.name,
            workflow_id: 'production-deploy.yml',
            ref: 'main',
            inputs: {
                release_tag: release.tag_name,
                release_name: release.name
            }
        });
        
        console.log('Production deployment başladıldı:', release.tag_name);
        
    } catch (error) {
        console.error('Production deployment xətası:', error.message);
    }
}

// Issue labels əlavə etmə
async function addIssueLabels(repository, issue) {
    try {
        const octokit = createGitHubClient();
        
        // Issue mətnində bug və ya feature sözləri varsa label əlavə et
        const labels = [];
        const issueText = (issue.title + ' ' + issue.body).toLowerCase();
        
        if (issueText.includes('bug') || issueText.includes('xəta')) {
            labels.push('bug');
        }
        
        if (issueText.includes('feature') || issueText.includes('yenilik')) {
            labels.push('enhancement');
        }
        
        if (issueText.includes('documentation') || issueText.includes('sənəd')) {
            labels.push('documentation');
        }
        
        if (labels.length > 0) {
            await octokit.rest.issues.addLabels({
                owner: repository.owner.login,
                repo: repository.name,
                issue_number: issue.number,
                labels: labels
            });
            
            console.log(`Issue #${issue.number}-ə label əlavə edildi:`, labels);
        }
        
    } catch (error) {
        console.error('Label əlavə etmə xətası:', error.message);
    }
}

// Webhook status yoxlama
function getWebhookStatus() {
    return {
        appId: appId ? 'Təyin edilib' : 'Təyin edilməyib',
        privateKey: getPrivateKey() ? 'Mövcuddur' : 'Tapılmadı',
        webhookSecret: webhookSecret ? 'Təyin edilib' : 'Təyin edilməyib',
        installationId: installationId ? 'Təyin edilib' : 'Təyin edilməyib'
    };
}

module.exports = {
    handleWebhook,
    getWebhookStatus,
    verifySignature
};