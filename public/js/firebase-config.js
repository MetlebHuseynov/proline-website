// Firebase konfiqurasiyası
const firebaseConfig = {
    // Bu məlumatları Firebase Console-dan alın
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebase-i başlat
firebase.initializeApp(firebaseConfig);

// Firestore referansı
const db = firebase.firestore();

// Real-time məlumat yeniləmə funksiyaları
class FirebaseManager {
    constructor() {
        this.db = db;
    }

    // Məhsulları real-time yüklə
    loadProductsRealtime(callback) {
        return this.db.collection('products')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                const products = [];
                snapshot.forEach((doc) => {
                    products.push({ id: doc.id, ...doc.data() });
                });
                callback(products);
            });
    }

    // Brendləri real-time yüklə
    loadBrandsRealtime(callback) {
        return this.db.collection('brands')
            .orderBy('name', 'asc')
            .onSnapshot((snapshot) => {
                const brands = [];
                snapshot.forEach((doc) => {
                    brands.push({ id: doc.id, ...doc.data() });
                });
                callback(brands);
            });
    }

    // Kateqoriyaları real-time yüklə
    loadCategoriesRealtime(callback) {
        return this.db.collection('categories')
            .orderBy('name', 'asc')
            .onSnapshot((snapshot) => {
                const categories = [];
                snapshot.forEach((doc) => {
                    categories.push({ id: doc.id, ...doc.data() });
                });
                callback(categories);
            });
    }

    // Seçilmiş məhsulları real-time yüklə
    loadFeaturedProductsRealtime(callback) {
        return this.db.collection('featured-products')
            .orderBy('order', 'asc')
            .onSnapshot((snapshot) => {
                const featuredProducts = [];
                snapshot.forEach((doc) => {
                    featuredProducts.push({ id: doc.id, ...doc.data() });
                });
                callback(featuredProducts);
            });
    }

    // Məhsul əlavə et
    async addProduct(productData) {
        try {
            const docRef = await this.db.collection('products').add({
                ...productData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Məhsul əlavə edildi:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Məhsul əlavə edilərkən xəta:', error);
            throw error;
        }
    }

    // Məhsul yenilə
    async updateProduct(productId, productData) {
        try {
            await this.db.collection('products').doc(productId).update({
                ...productData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Məhsul yeniləndi:', productId);
        } catch (error) {
            console.error('Məhsul yenilənərkən xəta:', error);
            throw error;
        }
    }

    // Məhsul sil
    async deleteProduct(productId) {
        try {
            await this.db.collection('products').doc(productId).delete();
            console.log('Məhsul silindi:', productId);
        } catch (error) {
            console.error('Məhsul silinərkən xəta:', error);
            throw error;
        }
    }

    // Əlaqə mesajı göndər
    async sendContactMessage(messageData) {
        try {
            const docRef = await this.db.collection('contacts').add({
                ...messageData,
                status: 'new',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Əlaqə mesajı göndərildi:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Əlaqə mesajı göndərilərkən xəta:', error);
            throw error;
        }
    }
}

// Global Firebase Manager
const firebaseManager = new FirebaseManager();

// Səhifə yüklənəndə real-time dinləyiciləri başlat
document.addEventListener('DOMContentLoaded', function() {
    // Əgər məhsullar səhifəsindəyiksə
    if (window.location.pathname.includes('products.html') || window.location.pathname === '/') {
        firebaseManager.loadProductsRealtime((products) => {
            console.log('Məhsullar real-time yeniləndi:', products.length);
            // Məhsulları səhifədə göstər
            if (typeof displayProducts === 'function') {
                displayProducts(products);
            }
        });
    }

    // Əgər brendlər səhifəsindəyiksə
    if (window.location.pathname.includes('brands.html')) {
        firebaseManager.loadBrandsRealtime((brands) => {
            console.log('Brendlər real-time yeniləndi:', brands.length);
            // Brendləri səhifədə göstər
            if (typeof displayBrands === 'function') {
                displayBrands(brands);
            }
        });
    }
});

// Offline dəstəyi
db.enablePersistence()
    .then(() => {
        console.log('Firebase offline dəstəyi aktivləşdirildi');
    })
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.log('Çoxlu tab açıq olduğu üçün offline dəstəyi aktivləşdirilə bilmədi');
        } else if (err.code == 'unimplemented') {
            console.log('Brauzer offline dəstəyini dəstəkləmir');
        }
    });