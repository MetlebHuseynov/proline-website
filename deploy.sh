#!/bin/bash
# Hostinger Production Deployment Script
# Bu script Hostinger serverində istifadə ediləcək

echo "🚀 Old Bridge Production Deployment başladı..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    print_error "server.js faylı tapılmadı. Düzgün qovluqda olduğunuzdan əmin olun."
    exit 1
fi

print_status "Mövcud qovluq: $(pwd)"

# Backup current deployment (optional)
if [ -d "backup" ]; then
    print_status "Köhnə backup silinir..."
    rm -rf backup
fi

print_status "Cari deployment backup edilir..."
mkdir -p backup
cp -r public data backup/ 2>/dev/null || true

# Pull latest changes from Git (if using Git)
if [ -d ".git" ]; then
    print_status "Git repository yenilənir..."
    git pull origin main
    if [ $? -ne 0 ]; then
        print_warning "Git pull uğursuz oldu. Manuel yenilənmə tələb oluna bilər."
    fi
else
    print_warning "Git repository tapılmadı. Manuel file upload istifadə edilir."
fi

# Install/Update dependencies
print_status "Dependencies yenilənir..."
npm install --production
if [ $? -ne 0 ]; then
    print_error "npm install uğursuz oldu!"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env faylı tapılmadı!"
    print_warning "Zəhmət olmasa .env.production faylını .env olaraq kopyalayın və konfiqurasiya edin."
    if [ -f ".env.production" ]; then
        print_status ".env.production faylı .env olaraq kopyalanır..."
        cp .env.production .env
        print_warning "Zəhmət olmasa .env faylındakı MySQL məlumatlarını yeniləyin!"
    else
        exit 1
    fi
fi

# Create necessary directories
print_status "Lazım olan qovluqlar yaradılır..."
mkdir -p public/uploads
mkdir -p logs
mkdir -p backups

# Set proper permissions
print_status "File permissions təyin edilir..."
chmod 755 public
chmod 755 public/uploads
chmod 644 .env
chmod 755 logs
chmod 755 backups

# Check Node.js version
print_status "Node.js versiyası: $(node --version)"
print_status "NPM versiyası: $(npm --version)"

# Test database connection (optional)
print_status "Database bağlantısı test edilir..."
node -e "
const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

mysql.createConnection(config)
    .then(connection => {
        console.log('✅ MySQL bağlantısı uğurlu!');
        connection.end();
    })
    .catch(err => {
        console.log('❌ MySQL bağlantı xətası:', err.message);
        process.exit(1);
    });
" 2>/dev/null

if [ $? -ne 0 ]; then
    print_warning "Database bağlantısı test edilə bilmədi. .env faylındakı məlumatları yoxlayın."
fi

# Create a simple health check
print_status "Health check faylı yaradılır..."
cat > health-check.js << 'EOF'
const http = require('http');
const port = process.env.PORT || 3000;

const options = {
    hostname: 'localhost',
    port: port,
    path: '/',
    method: 'GET',
    timeout: 5000
};

const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
        console.log('✅ Server işləyir!');
        process.exit(0);
    } else {
        console.log('❌ Server cavab vermir:', res.statusCode);
        process.exit(1);
    }
});

req.on('error', (err) => {
    console.log('❌ Server bağlantı xətası:', err.message);
    process.exit(1);
});

req.on('timeout', () => {
    console.log('❌ Server timeout');
    req.destroy();
    process.exit(1);
});

req.end();
EOF

print_status "Deployment tamamlandı! 🎉"
print_status "Növbəti addımlar:"
echo "1. cPanel-də Node.js application-ı restart edin"
echo "2. Browser-də saytı yoxlayın"
echo "3. Admin panel-ə giriş edin"
echo "4. Database-də məlumatların olduğunu yoxlayın"
echo ""
print_status "Faydalı əmrlər:"
echo "- Server status: node health-check.js"
echo "- Logs: tail -f logs/app.log"
echo "- Database test: node -e \"require('./server.js')\""
echo ""
print_status "Deployment log: $(date) - Uğurlu" >> deployment.log

echo "✅ Deployment tamamlandı!"