// Social links configuration
const socialLinks = [
    { url: 'https://www.youtube.com/@astromnesis', icon: 'fa-youtube', label: 'YouTube' },
    { url: 'http://www.instagram.com/astromnesis', icon: 'fa-instagram', label: 'Instagram' },
    { url: 'https://www.tiktok.com/@astromnesis', icon: 'fa-tiktok', label: 'TikTok' },
    { url: 'https://www.twitch.tv/astromnesis', icon: 'fa-twitch', label: 'Twitch' }
];

// Function to generate social links HTML
function generateSocialLinks() {
    return socialLinks.map(link => 
        `<a href="${link.url}" target="_blank" class="social-icon"><i class="fab ${link.icon}"></i></a>`
    ).join('');
}

// Inject social links into header and footer
document.addEventListener('DOMContentLoaded', function() {
    const headerSocial = document.querySelector('.header-social');
    const footerSocial = document.querySelector('.footer-social');
    
    if (headerSocial) headerSocial.innerHTML = generateSocialLinks();
    if (footerSocial) footerSocial.innerHTML = generateSocialLinks();
});

// Rest of your existing code...
const languageToggle = document.getElementById('languageToggle');
const languageMenu = document.getElementById('languageMenu');

if (languageToggle && languageMenu) {
    languageToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        languageMenu.classList.toggle('active');
    });

    document.addEventListener('click', () => {
        languageMenu.classList.remove('active');
    });
}

const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navLinks = document.getElementById('navLinks');

if (mobileMenuToggle && navLinks) {
    mobileMenuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = mobileMenuToggle.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const icon = mobileMenuToggle.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        });
    });
}

let lastScrollTop = 0;
window.addEventListener('scroll', function() {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (Math.abs(scrollTop - lastScrollTop) > 5) {
        lastScrollTop = scrollTop;
    }
}, { passive: true });