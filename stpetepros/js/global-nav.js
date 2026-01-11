/**
 * StPetePros Global Keyboard Navigation
 * Works across entire site - index, profiles, signup, etc.
 */

(function() {
    'use strict';

    // Keyboard shortcuts configuration
    const shortcuts = {
        'h': { action: 'home', description: 'Go to Home/Directory' },
        's': { action: 'signup', description: 'Signup Page' },
        'l': { action: 'login', description: 'Login / Dashboard' },
        '/': { action: 'search', description: 'Search (coming soon)' },
        '?': { action: 'help', description: 'Show Keyboard Shortcuts' },
        'Escape': { action: 'back', description: 'Go Back' }
    };

    // Professional navigation (if on profile page)
    let professionalIds = [];
    let currentProId = 0;
    let currentIndex = -1;

    // Detect if on professional profile page
    const proMatch = window.location.pathname.match(/professional-(\d+)\.html/);
    if (proMatch) {
        currentProId = parseInt(proMatch[1]);
        // Get actual professional IDs from export script (skips gaps like 17-25)
        professionalIds = window.PROFESSIONAL_IDS || [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,26];
        currentIndex = professionalIds.indexOf(currentProId);
    }

    // Global keyboard event handler
    document.addEventListener('keydown', (e) => {
        // Don't trigger if typing in input/textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        const key = e.key;

        // Home
        if (key === 'h' || key === 'H') {
            e.preventDefault();
            window.location.href = 'index.html';
            return;
        }

        // Signup
        if (key === 's' || key === 'S') {
            e.preventDefault();
            window.location.href = 'signup.html';
            return;
        }

        // Login/Dashboard
        if (key === 'l' || key === 'L') {
            e.preventDefault();
            // Check if logged in (via auth-bridge.js)
            if (window.soulfraAuth && window.soulfraAuth.loggedIn) {
                // Redirect to Flask dashboard
                window.location.href = 'http://localhost:5001/dashboard';
            } else {
                // Show login modal or redirect
                showLoginPrompt();
            }
            return;
        }

        // Search (future)
        if (key === '/') {
            e.preventDefault();
            alert('Search coming soon! Press Escape to close.');
            return;
        }

        // Help modal
        if (key === '?') {
            e.preventDefault();
            showKeyboardHelp();
            return;
        }

        // Escape - context-aware back
        if (key === 'Escape') {
            e.preventDefault();
            // Close modals first
            const modal = document.querySelector('.keyboard-help-modal');
            if (modal) {
                modal.remove();
                return;
            }
            // Go back to index if on profile page
            if (currentProId > 0) {
                window.location.href = 'index.html';
            } else {
                window.history.back();
            }
            return;
        }

        // Professional navigation (only on profile pages)
        if (currentProId > 0 && currentIndex >= 0) {
            // Arrow Left - Previous professional (skip gaps)
            if (key === 'ArrowLeft') {
                e.preventDefault();
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : professionalIds.length - 1;
                const prevId = professionalIds[prevIndex];
                window.location.href = `professional-${prevId}.html`;
                return;
            }

            // Arrow Right - Next professional (skip gaps)
            if (key === 'ArrowRight') {
                e.preventDefault();
                const nextIndex = currentIndex < professionalIds.length - 1 ? currentIndex + 1 : 0;
                const nextId = professionalIds[nextIndex];
                window.location.href = `professional-${nextId}.html`;
                return;
            }

            // Number keys 1-9 - Jump to professional (by position, not ID)
            if (key >= '1' && key <= '9') {
                e.preventDefault();
                const targetIndex = parseInt(key) - 1;
                if (targetIndex < professionalIds.length) {
                    const targetId = professionalIds[targetIndex];
                    window.location.href = `professional-${targetId}.html`;
                }
                return;
            }

            // 0 - Back to directory
            if (key === '0') {
                e.preventDefault();
                window.location.href = 'index.html';
                return;
            }
        }
    });

    // Show login prompt
    function showLoginPrompt() {
        const modal = createModal(`
            <h2>Login to StPetePros</h2>
            <p>Login is only available when Flask backend is running.</p>
            <p><strong>For now:</strong> This is a static demo.</p>
            <p><strong>Future:</strong> QR code login, user dashboard, saved favorites.</p>
            <button onclick="this.closest('.keyboard-help-modal').remove()">Close</button>
        `);
        document.body.appendChild(modal);
    }

    // Show keyboard shortcuts help
    function showKeyboardHelp() {
        let helpHTML = '<h2>⌨️ Keyboard Shortcuts</h2><ul style="list-style: none; padding: 0;">';

        // Global shortcuts
        helpHTML += '<li style="padding: 10px; background: #f8f9fa; margin: 5px 0; border-radius: 5px;"><strong>H</strong> - Home/Directory</li>';
        helpHTML += '<li style="padding: 10px; background: #f8f9fa; margin: 5px 0; border-radius: 5px;"><strong>S</strong> - Signup Page</li>';
        helpHTML += '<li style="padding: 10px; background: #f8f9fa; margin: 5px 0; border-radius: 5px;"><strong>L</strong> - Login/Dashboard</li>';
        helpHTML += '<li style="padding: 10px; background: #f8f9fa; margin: 5px 0; border-radius: 5px;"><strong>Escape</strong> - Go Back</li>';
        helpHTML += '<li style="padding: 10px; background: #f8f9fa; margin: 5px 0; border-radius: 5px;"><strong>?</strong> - Show This Help</li>';

        // Profile-specific shortcuts
        if (currentProId > 0) {
            helpHTML += '<hr style="margin: 15px 0;">';
            helpHTML += '<li style="padding: 10px; background: #e8f5e9; margin: 5px 0; border-radius: 5px;"><strong>← →</strong> - Previous/Next Professional</li>';
            helpHTML += '<li style="padding: 10px; background: #e8f5e9; margin: 5px 0; border-radius: 5px;"><strong>1-9</strong> - Jump to Professional #</li>';
            helpHTML += '<li style="padding: 10px; background: #e8f5e9; margin: 5px 0; border-radius: 5px;"><strong>0</strong> - Back to Directory</li>';
        }

        helpHTML += '</ul>';
        helpHTML += '<button style="margin-top: 20px; padding: 10px 30px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;" onclick="this.closest(\'.keyboard-help-modal\').remove()">Got It!</button>';

        const modal = createModal(helpHTML);
        document.body.appendChild(modal);
    }

    // Create modal helper
    function createModal(content) {
        const modal = document.createElement('div');
        modal.className = 'keyboard-help-modal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 20px;
            box-shadow: 0 10px 50px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        `;
        modal.innerHTML = content;

        // Backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
        `;
        backdrop.onclick = () => {
            modal.remove();
            backdrop.remove();
        };
        document.body.appendChild(backdrop);

        // Auto-remove backdrop when modal is removed
        const observer = new MutationObserver(() => {
            if (!document.body.contains(modal)) {
                backdrop.remove();
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        return modal;
    }

    // Show hint on first load (only once per session)
    if (!sessionStorage.getItem('stpetepros-keyboard-hint-shown')) {
        window.addEventListener('load', () => {
            const hint = document.createElement('div');
            hint.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(102, 126, 234, 0.95);
                color: white;
                padding: 15px 25px;
                border-radius: 50px;
                font-size: 14px;
                font-weight: 600;
                box-shadow: 0 5px 20px rgba(0,0,0,0.3);
                z-index: 9000;
                animation: slideIn 0.5s ease-out;
            `;
            hint.innerHTML = '⌨️ Press <strong>?</strong> for keyboard shortcuts';

            // Add slide-in animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);

            document.body.appendChild(hint);

            // Auto-hide after 5 seconds
            setTimeout(() => {
                hint.style.animation = 'slideIn 0.5s ease-out reverse';
                setTimeout(() => hint.remove(), 500);
            }, 5000);

            sessionStorage.setItem('stpetepros-keyboard-hint-shown', 'true');
        });
    }

    // Add mobile navigation buttons (for touch screens)
    if (currentProId > 0 && currentIndex >= 0) {
        window.addEventListener('load', () => {
            const navBar = document.createElement('div');
            navBar.style.cssText = `
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: rgba(102, 126, 234, 0.95);
                backdrop-filter: blur(10px);
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 -5px 20px rgba(0,0,0,0.3);
                z-index: 9500;
                gap: 10px;
            `;

            // Previous button
            const prevBtn = document.createElement('button');
            prevBtn.innerHTML = '← Prev';
            prevBtn.style.cssText = `
                background: white;
                color: #667eea;
                border: none;
                padding: 12px 24px;
                border-radius: 50px;
                font-weight: 600;
                font-size: 16px;
                cursor: pointer;
                flex: 1;
                max-width: 120px;
            `;
            prevBtn.onclick = () => {
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : professionalIds.length - 1;
                window.location.href = `professional-${professionalIds[prevIndex]}.html`;
            };

            // Home button
            const homeBtn = document.createElement('button');
            homeBtn.innerHTML = '🏠 Home';
            homeBtn.style.cssText = `
                background: rgba(255,255,255,0.3);
                color: white;
                border: 2px solid white;
                padding: 12px 24px;
                border-radius: 50px;
                font-weight: 600;
                font-size: 16px;
                cursor: pointer;
                flex: 1;
                max-width: 120px;
            `;
            homeBtn.onclick = () => {
                window.location.href = 'index.html';
            };

            // Next button
            const nextBtn = document.createElement('button');
            nextBtn.innerHTML = 'Next →';
            nextBtn.style.cssText = `
                background: white;
                color: #667eea;
                border: none;
                padding: 12px 24px;
                border-radius: 50px;
                font-weight: 600;
                font-size: 16px;
                cursor: pointer;
                flex: 1;
                max-width: 120px;
            `;
            nextBtn.onclick = () => {
                const nextIndex = currentIndex < professionalIds.length - 1 ? currentIndex + 1 : 0;
                window.location.href = `professional-${professionalIds[nextIndex]}.html`;
            };

            navBar.appendChild(prevBtn);
            navBar.appendChild(homeBtn);
            navBar.appendChild(nextBtn);
            document.body.appendChild(navBar);

            // Add padding to body so content doesn't hide under nav bar
            document.body.style.paddingBottom = '80px';
        });
    }

})();
