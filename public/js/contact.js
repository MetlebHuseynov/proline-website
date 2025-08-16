// DOM Elements
const contactForm = document.getElementById('contact-form');
const faqItems = document.querySelectorAll('.faq-item');

// Utility functions
function showAlert(message, type = 'danger') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.querySelector('.container').prepend(alertDiv);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 300);
    }, 5000);
}

// Handle contact form submission
contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(contactForm);
    const contactData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        subject: formData.get('subject'),
        message: formData.get('message')
    };
    
    // Validate form data
    if (!contactData.name || !contactData.email || !contactData.message) {
        showAlert('Zəhmət olmasa bütün tələb olunan sahələri doldurun.');
        return;
    }
    
    // In a real application, you would send this data to the server
    // For now, we'll just show a success message
    console.log('Contact form submitted:', contactData);
    
    // Show success message
    showAlert('Mesajınız uğurla göndərildi. Tezliklə sizinlə əlaqə saxlayacağıq.', 'success');
    
    // Reset form
    contactForm.reset();
});

// Initialize Google Maps (placeholder)
function initMap() {
    // In a real application, you would initialize Google Maps here
    // For now, we'll just show a placeholder message
    const mapContainer = document.getElementById('map');
    mapContainer.innerHTML = `
        <div class="bg-light p-5 text-center">
            <h4>Xəritə Yer Tutucusu</h4>
            <p>Real tətbiqdə burada bizim yerləşdiyimiz yeri göstərən Google Xəritəsi göstəriləcək.</p>
        </div>
    `;
}

// Toggle FAQ items
faqItems.forEach(item => {
    const header = item.querySelector('.faq-header');
    const content = item.querySelector('.faq-content');
    
    header.addEventListener('click', () => {
        // Toggle active class
        item.classList.toggle('active');
        
        // Toggle content visibility
        if (item.classList.contains('active')) {
            content.style.maxHeight = content.scrollHeight + 'px';
        } else {
            content.style.maxHeight = '0';
        }
    });
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize map
    initMap();
    
    // Set initial state for first FAQ item
    if (faqItems.length > 0) {
        const firstItem = faqItems[0];
        const firstContent = firstItem.querySelector('.faq-content');
        
        firstItem.classList.add('active');
        firstContent.style.maxHeight = firstContent.scrollHeight + 'px';
    }
});