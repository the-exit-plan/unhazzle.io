// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking on a link
    const navLinkItems = document.querySelectorAll('.nav-links a');
    navLinkItems.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        });
    });
});

// Theme toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.querySelector('.theme-toggle');
    const themeIcon = document.querySelector('.theme-icon');
    
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Update icon based on current theme
    function updateThemeIcon(theme) {
        if (theme === 'dark') {
            themeIcon.textContent = '☀️';
        } else {
            themeIcon.textContent = '🌙';
        }
    }
    
    updateThemeIcon(savedTheme);
    
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
            
            // Add a subtle animation effect
            themeToggle.style.transform = 'scale(0.95)';
            setTimeout(() => {
                themeToggle.style.transform = 'scale(1)';
            }, 150);
        });
    }
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Header scroll effect
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    const currentTheme = document.documentElement.getAttribute('data-theme');
    
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Form submission handling
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.querySelector('.contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);
            
            // Basic validation
            if (!data.name || !data.email || !data.message) {
                showNotification('Please fill in all required fields.', 'error');
                return;
            }
            
            if (!isValidEmail(data.email)) {
                showNotification('Please enter a valid email address.', 'error');
                return;
            }
            
            // Simulate form submission
            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            
            submitButton.textContent = 'Sending...';
            submitButton.disabled = true;
            
            // Simulate API call
            setTimeout(() => {
                showNotification('Thank you for your message! We\'ll get back to you soon.', 'success');
                contactForm.reset();
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }, 2000);
        });
    }
});

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" aria-label="Close notification">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#2563eb'};
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        max-width: 400px;
        transform: translateX(100%);
        transition: transform 0.3s ease-in-out;
    `;
    
    notification.querySelector('.notification-content').style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
    `;
    
    notification.querySelector('.notification-close').style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Close functionality
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Intersection Observer for animations
if ('IntersectionObserver' in window) {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.feature-card, .about-content, .stats').forEach(el => {
        observer.observe(el);
    });
}

// Add animation styles
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    .feature-card,
    .about-content,
    .stats {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s ease-out, transform 0.6s ease-out;
    }
    
    .feature-card.animate-in,
    .about-content.animate-in,
    .stats.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .header.scrolled {
        background-color: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(10px);
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }
    
    [data-theme="dark"] .header.scrolled {
        background-color: rgba(15, 23, 42, 0.98);
        box-shadow: 0 1px 3px 0 rgba(255, 255, 255, 0.1);
    }
    
    @media (max-width: 768px) {
        .nav-links {
            position: fixed;
            top: 80px;
            left: 0;
            right: 0;
            background: var(--bg-primary);
            flex-direction: column;
            padding: 20px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            transform: translateY(-100%);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease-in-out;
            border: 1px solid var(--border-color);
        }
        
        [data-theme="dark"] .nav-links {
            box-shadow: 0 4px 6px -1px rgba(255, 255, 255, 0.1);
        }
        
        .nav-links.active {
            transform: translateY(0);
            opacity: 1;
            visibility: visible;
            display: flex;
        }
        
        .mobile-menu-toggle.active span:nth-child(1) {
            transform: rotate(45deg) translate(5px, 5px);
        }
        
        .mobile-menu-toggle.active span:nth-child(2) {
            opacity: 0;
        }
        
        .mobile-menu-toggle.active span:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -6px);
        }
    }
`;
document.head.appendChild(animationStyles);

// Performance optimization: Lazy load images
document.addEventListener('DOMContentLoaded', function() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
});

// Keyboard navigation improvements
document.addEventListener('keydown', function(e) {
    // Escape key closes mobile menu
    if (e.key === 'Escape') {
        const navLinks = document.querySelector('.nav-links');
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        if (navLinks && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        }
    }
});

// Add loading states and error handling for any future API calls
window.addEventListener('online', function() {
    showNotification('Connection restored', 'success');
});

window.addEventListener('offline', function() {
    showNotification('Connection lost. Some features may not work.', 'error');
});

// Infrastructure Canvas Cost Modal
document.addEventListener('DOMContentLoaded', function() {
    const applyChangesBtn = document.querySelector('.canvas-btn.apply-changes');
    
    if (applyChangesBtn) {
        applyChangesBtn.addEventListener('click', function() {
            showCostEstimationModal();
        });
    }
});

function showCostEstimationModal() {
    // Remove existing modal if any
    const existingModal = document.querySelector('.cost-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Calculate estimated costs for resources
    const resources = [
        {
            name: 'web-app',
            type: 'Next.js Application',
            specs: '0.5 CPU, 512Mi Memory',
            monthlyCost: 15.00,
            hourlyCost: 0.021
        },
        {
            name: 'postgres-db',
            type: 'PostgreSQL Database',
            specs: 'Small (1GB RAM, 10GB Storage)',
            monthlyCost: 25.00,
            hourlyCost: 0.035
        },
        {
            name: 'redis-cache',
            type: 'Redis Cache',
            specs: 'Small (256MB Memory)',
            monthlyCost: 8.00,
            hourlyCost: 0.011
        }
    ];
    
    const totalMonthlyCost = resources.reduce((sum, resource) => sum + resource.monthlyCost, 0);
    const totalHourlyCost = resources.reduce((sum, resource) => sum + resource.hourlyCost, 0);
    
    // Create modal HTML
    const modalHTML = `
        <div class="cost-modal">
            <div class="cost-modal-overlay"></div>
            <div class="cost-modal-content">
                <div class="cost-modal-header">
                    <h2>💰 Deployment Cost Estimation</h2>
                    <button class="cost-modal-close" aria-label="Close modal">&times;</button>
                </div>
                <div class="cost-modal-body">
                    <div class="cost-summary">
                        <div class="cost-total">
                            <div class="cost-amount">
                                <span class="currency">€</span>
                                <span class="amount">${totalMonthlyCost.toFixed(2)}</span>
                                <span class="period">/month</span>
                            </div>
                            <div class="cost-breakdown">
                                <small>≈ €${totalHourlyCost.toFixed(3)}/hour • Estimated costs for dev environment</small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="resources-breakdown">
                        <h3>Resource Breakdown</h3>
                        <div class="resources-list">
                            ${resources.map(resource => `
                                <div class="resource-cost-item">
                                    <div class="resource-info">
                                        <div class="resource-name">${resource.name}</div>
                                        <div class="resource-type">${resource.type}</div>
                                        <div class="resource-specs">${resource.specs}</div>
                                    </div>
                                    <div class="resource-price">
                                        <div class="monthly-cost">€${resource.monthlyCost.toFixed(2)}/mo</div>
                                        <div class="hourly-cost">€${resource.hourlyCost.toFixed(3)}/hr</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="cost-notes">
                        <div class="cost-note">
                            <span class="note-icon">ℹ️</span>
                            <span>Costs shown are estimates for the <strong>dev</strong> environment. Production resources may vary.</span>
                        </div>
                        <div class="cost-note">
                            <span class="note-icon">🇪🇺</span>
                            <span>All resources deployed in EU regions. GDPR compliant by default.</span>
                        </div>
                        <div class="cost-note">
                            <span class="note-icon">⏱️</span>
                            <span>You only pay for actual usage. Stop resources anytime to reduce costs.</span>
                        </div>
                    </div>
                </div>
                <div class="cost-modal-footer">
                    <button class="btn-secondary cancel-deploy">Cancel</button>
                    <button class="btn-primary confirm-deploy">Deploy Resources</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add modal styles
    addCostModalStyles();
    
    // Add event listeners
    setupCostModalEvents();
    
    // Animate modal in
    const modal = document.querySelector('.cost-modal');
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
}

function addCostModalStyles() {
    if (document.querySelector('#cost-modal-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'cost-modal-styles';
    styles.textContent = `
        .cost-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10000;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
        }
        
        .cost-modal.active {
            opacity: 1;
            visibility: visible;
        }
        
        .cost-modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
        }
        
        .cost-modal-content {
            position: relative;
            background: var(--bg-primary);
            margin: 2rem auto;
            max-width: 600px;
            width: 90%;
            border-radius: 16px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            border: 1px solid var(--border-color);
            max-height: 90vh;
            overflow-y: auto;
            transform: translateY(20px) scale(0.95);
            transition: transform 0.3s ease-out;
        }
        
        .cost-modal.active .cost-modal-content {
            transform: translateY(0) scale(1);
        }
        
        .cost-modal-header {
            padding: 1.5rem 2rem;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .cost-modal-header h2 {
            margin: 0;
            color: var(--text-primary);
            font-size: 1.5rem;
            font-weight: 600;
        }
        
        .cost-modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: var(--text-tertiary);
            cursor: pointer;
            padding: 0.25rem;
            border-radius: 4px;
            transition: color 0.2s ease, background 0.2s ease;
        }
        
        .cost-modal-close:hover {
            color: var(--text-primary);
            background: var(--bg-tertiary);
        }
        
        .cost-modal-body {
            padding: 2rem;
        }
        
        .cost-summary {
            text-align: center;
            margin-bottom: 2rem;
            padding: 1.5rem;
            background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
            border-radius: 12px;
            color: white;
        }
        
        .cost-total .cost-amount {
            display: flex;
            align-items: baseline;
            justify-content: center;
            gap: 0.25rem;
            margin-bottom: 0.5rem;
        }
        
        .currency {
            font-size: 1.5rem;
            font-weight: 500;
        }
        
        .amount {
            font-size: 3rem;
            font-weight: 700;
        }
        
        .period {
            font-size: 1.25rem;
            font-weight: 500;
            opacity: 0.9;
        }
        
        .cost-breakdown {
            opacity: 0.9;
            font-size: 0.9rem;
        }
        
        .resources-breakdown {
            margin-bottom: 1.5rem;
        }
        
        .resources-breakdown h3 {
            margin: 0 0 1rem 0;
            color: var(--text-primary);
            font-size: 1.25rem;
            font-weight: 600;
        }
        
        .resources-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .resource-cost-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            background: var(--bg-secondary);
            border-radius: 8px;
            border: 1px solid var(--border-color);
        }
        
        .resource-info {
            flex: 1;
        }
        
        .resource-name {
            font-weight: 600;
            color: var(--text-primary);
            font-size: 1rem;
            margin-bottom: 0.25rem;
        }
        
        .resource-type {
            color: var(--text-secondary);
            font-size: 0.9rem;
            margin-bottom: 0.25rem;
        }
        
        .resource-specs {
            color: var(--text-tertiary);
            font-size: 0.8rem;
        }
        
        .resource-price {
            text-align: right;
            margin-left: 1rem;
        }
        
        .monthly-cost {
            font-weight: 600;
            color: var(--primary-color);
            font-size: 1rem;
        }
        
        .hourly-cost {
            color: var(--text-tertiary);
            font-size: 0.8rem;
        }
        
        .cost-notes {
            background: var(--bg-secondary);
            border-radius: 8px;
            padding: 1.25rem;
            border: 1px solid var(--border-color);
        }
        
        .cost-note {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            margin-bottom: 0.75rem;
            font-size: 0.9rem;
            color: var(--text-secondary);
            line-height: 1.4;
        }
        
        .cost-note:last-child {
            margin-bottom: 0;
        }
        
        .note-icon {
            font-size: 1rem;
            flex-shrink: 0;
            margin-top: 0.1rem;
        }
        
        .cost-modal-footer {
            padding: 1.5rem 2rem;
            border-top: 1px solid var(--border-color);
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
        }
        
        .btn-secondary, .btn-primary {
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;
            font-size: 0.9rem;
        }
        
        .btn-secondary {
            background: var(--bg-tertiary);
            color: var(--text-secondary);
            border: 1px solid var(--border-color);
        }
        
        .btn-secondary:hover {
            background: var(--bg-secondary);
            color: var(--text-primary);
        }
        
        .btn-primary {
            background: var(--primary-color);
            color: white;
        }
        
        .btn-primary:hover {
            background: var(--primary-dark);
            transform: translateY(-1px);
        }
        
        @media (max-width: 768px) {
            .cost-modal-content {
                margin: 1rem;
                width: calc(100% - 2rem);
            }
            
            .cost-modal-header,
            .cost-modal-body,
            .cost-modal-footer {
                padding: 1.5rem;
            }
            
            .resource-cost-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.75rem;
            }
            
            .resource-price {
                margin-left: 0;
                text-align: left;
            }
            
            .cost-modal-footer {
                flex-direction: column-reverse;
            }
            
            .btn-secondary, .btn-primary {
                width: 100%;
                justify-content: center;
            }
        }
    `;
    
    document.head.appendChild(styles);
}

function setupCostModalEvents() {
    const modal = document.querySelector('.cost-modal');
    const overlay = document.querySelector('.cost-modal-overlay');
    const closeBtn = document.querySelector('.cost-modal-close');
    const cancelBtn = document.querySelector('.cancel-deploy');
    const deployBtn = document.querySelector('.confirm-deploy');
    
    function closeCostModal() {
        modal.classList.remove('active');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 300);
    }
    
    // Close modal events
    overlay.addEventListener('click', closeCostModal);
    closeBtn.addEventListener('click', closeCostModal);
    cancelBtn.addEventListener('click', closeCostModal);
    
    // Escape key to close
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeCostModal();
        }
    });
    
    // Deploy confirmation
    deployBtn.addEventListener('click', function() {
        deployBtn.textContent = 'Deploying...';
        deployBtn.disabled = true;
        
        // Simulate deployment process
        setTimeout(() => {
            closeCostModal();
            showNotification('🚀 Deployment started! Resources are being provisioned in EU region.', 'success');
            
            // Update apply button text
            const applyBtn = document.querySelector('.canvas-btn.apply-changes');
            if (applyBtn) {
                applyBtn.textContent = 'Deploying...';
                applyBtn.disabled = true;
                
                setTimeout(() => {
                    applyBtn.textContent = 'Applied ✓';
                    applyBtn.style.background = 'var(--success-color)';
                    
                    setTimeout(() => {
                        applyBtn.textContent = 'Apply Changes';
                        applyBtn.disabled = false;
                        applyBtn.style.background = '';
                    }, 3000);
                }, 2000);
            }
        }, 1500);
    });
}

console.log('🚀 Unhazzle website loaded successfully!');
