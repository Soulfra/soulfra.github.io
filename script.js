// Fixed Portfolio Website JavaScript - Dynamic Loading
document.addEventListener('DOMContentLoaded', function() {
    // Load projects dynamically
    loadProjectsDynamically();
    loadSkills();
    
    // Setup event listeners
    setupThemeToggle();
    setupProjectFilters();
    setupProjectSearch();
    setupScrollEffects();
});

let allRepositories = [];

async function loadProjectsDynamically() {
    console.log('🔄 Loading repositories dynamically...');
    
    try {
        // Load from projects.json (updated with real data)
        const response = await fetch('./projects.json');
        const data = await response.json();
        
        allRepositories = data.repositories;
        
        console.log(`✅ Loaded ${allRepositories.length} repositories`);
        
        // Update stats
        updateStats(data);
        
        // Create project cards
        createAllProjectCards();
        
    } catch (error) {
        console.error('❌ Failed to load repositories:', error);
        
        // Fallback: Show placeholder message
        const projectsGrid = document.getElementById('projects-grid');
        if (projectsGrid) {
            projectsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                    <h3>Loading repositories...</h3>
                    <p>If this message persists, please visit <a href="https://github.com/Soulfra">GitHub directly</a></p>
                </div>
            `;
        }
    }
}

function updateStats(data) {
    // Update repository count
    const repoCountEl = document.getElementById('repo-count');
    if (repoCountEl) {
        animateCounter('repo-count', data.total_repositories);
    }
    
    // Update other stats
    const languageCount = Object.keys(data.languages || {}).length;
    const statsElements = document.querySelectorAll('.stat-number');
    
    if (statsElements.length >= 2) {
        statsElements[1].textContent = languageCount;
    }
}

function createAllProjectCards() {
    const projectsGrid = document.getElementById('projects-grid');
    if (!projectsGrid) return;
    
    // Clear existing content
    projectsGrid.innerHTML = '';
    
    // Sort repositories by creation date (newest first)
    const sortedRepos = allRepositories
        .filter(repo => repo.name !== 'soulfra.github.io') // Skip portfolio repo itself
        .sort((a, b) => new Date(b.created) - new Date(a.created));
    
    console.log(`📋 Creating cards for ${sortedRepos.length} repositories`);
    
    sortedRepos.forEach((repo, index) => {
        const card = createProjectCard(repo, index);
        projectsGrid.appendChild(card);
    });
    
    console.log(`✅ Created ${sortedRepos.length} project cards`);
}

function createProjectCard(repo, index) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.dataset.language = repo.language?.toLowerCase() || '';
    
    const topics = repo.topics || [];
    card.dataset.topics = topics.join(' ').toLowerCase();
    
    const projectType = determineProjectType(repo);
    const iconColor = getLanguageColor(repo.language);
    
    // Create status indicator for private repos
    const statusBadge = repo.is_private ? 
        '<span class="private-badge">Private</span>' : 
        '<span class="public-badge">Public</span>';
    
    // Create star count if available
    const starCount = repo.stargazerCount ? 
        `<span class="star-count">⭐ ${repo.stargazerCount}</span>` : '';
    
    card.innerHTML = `
        <div class="project-header">
            <div class="project-icon" style="background: ${iconColor}">
                <i class="${getProjectIcon(projectType)}"></i>
            </div>
            <h3 class="project-title">${formatRepoName(repo.name)}</h3>
            ${statusBadge}
        </div>
        
        <p class="project-description">
            ${repo.description || 'Professional software project with modern architecture and best practices'}
        </p>
        
        <div class="project-topics">
            ${topics.map(topic => 
                `<span class="topic-tag">${topic}</span>`
            ).join('')}
            ${repo.language ? 
                `<span class="topic-tag primary">${repo.language}</span>` : ''
            }
        </div>
        
        <div class="project-meta">
            <span class="created-date">Created: ${formatDate(repo.created)}</span>
            ${starCount}
        </div>
        
        <div class="project-links">
            <a href="${repo.url}" class="project-link primary" target="_blank">
                <i class="fab fa-github"></i> View Code
            </a>
            ${shouldShowDemo(repo) ? 
                `<a href="${generateDemoUrl(repo)}" class="project-link secondary" target="_blank">
                    <i class="fas fa-external-link-alt"></i> Live Demo
                </a>` : ''
            }
        </div>
    `;
    
    // Add entrance animation
    card.style.animationDelay = `${Math.min(index * 0.1, 2)}s`;
    
    return card;
}

function formatRepoName(name) {
    return name
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
    });
}

function shouldShowDemo(repo) {
    const name = repo.name.toLowerCase();
    const desc = (repo.description || '').toLowerCase();
    
    return name.includes('demo') || 
           name.includes('app') || 
           name.includes('web') ||
           desc.includes('demo') ||
           repo.language === 'HTML';
}

function generateDemoUrl(repo) {
    const repoName = repo.name;
    
    // Try GitHub Pages first
    return `https://soulfra.github.io/${repoName}`;
}

function determineProjectType(repo) {
    const name = repo.name.toLowerCase();
    const description = (repo.description || '').toLowerCase();
    const topics = (repo.topics || []).join(' ').toLowerCase();
    
    if (name.includes('tool') || name.includes('cli') || topics.includes('tool')) return 'tool';
    if (name.includes('demo') || topics.includes('demo')) return 'demo';
    if (name.includes('api') || topics.includes('api')) return 'api';
    if (name.includes('lib') || topics.includes('library')) return 'library';
    if (name.includes('ai') || name.includes('ml') || topics.includes('ai')) return 'ai';
    if (description.includes('tutorial') || topics.includes('tutorial')) return 'tutorial';
    
    return 'project';
}

function getProjectIcon(type) {
    const icons = {
        tool: 'fas fa-tools',
        demo: 'fas fa-play-circle',
        api: 'fas fa-server',
        library: 'fas fa-book',
        ai: 'fas fa-robot',
        tutorial: 'fas fa-graduation-cap',
        project: 'fas fa-code'
    };
    return icons[type] || 'fas fa-code';
}

function getLanguageColor(language) {
    const colors = {
        JavaScript: '#f1e05a',
        TypeScript: '#2b7489',
        Python: '#3572A5',
        Rust: '#dea584',
        Go: '#00ADD8',
        Java: '#b07219',
        'C++': '#f34b7d',
        HTML: '#e34c26',
        CSS: '#563d7c',
        Vue: '#4FC08D',
        React: '#61DAFB',
        PHP: '#777bb4',
        Ruby: '#701516',
        Swift: '#ffac45',
        Kotlin: '#f18e33'
    };
    return colors[language] || '#666';
}

function loadSkills() {
    const skillsGrid = document.getElementById('skills-grid');
    if (!skillsGrid) return;
    
    const languages = {};
    
    // Count languages from all repositories
    allRepositories.forEach(repo => {
        if (repo.language && !repo.is_private) { // Only count public repos for skills
            languages[repo.language] = (languages[repo.language] || 0) + 1;
        }
    });
    
    // Sort by usage count
    const sortedLanguages = Object.entries(languages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12); // Show top 12 languages
    
    // Create skill items
    sortedLanguages.forEach(([lang, count]) => {
        const skill = document.createElement('div');
        skill.className = 'skill-item';
        skill.innerHTML = `
            <div class="skill-icon" style="color: ${getLanguageColor(lang)}">
                <i class="${getLanguageIcon(lang)}"></i>
            </div>
            <div class="skill-name">${lang}</div>
            <div class="skill-count">${count} projects</div>
        `;
        skillsGrid.appendChild(skill);
    });
}

function getLanguageIcon(language) {
    const icons = {
        JavaScript: 'fab fa-js',
        TypeScript: 'fab fa-js',
        Python: 'fab fa-python',
        Rust: 'fab fa-rust',
        Go: 'fab fa-golang',
        Java: 'fab fa-java',
        HTML: 'fab fa-html5',
        CSS: 'fab fa-css3-alt',
        Vue: 'fab fa-vuejs',
        React: 'fab fa-react',
        PHP: 'fab fa-php',
        Ruby: 'fas fa-gem',
        Swift: 'fab fa-swift'
    };
    return icons[language] || 'fas fa-code';
}

function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
    
    themeToggle.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#theme-toggle i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function setupProjectFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Filter projects
            filterProjects(btn.dataset.filter);
        });
    });
}

function filterProjects(filter) {
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        let shouldShow = false;
        
        if (filter === 'all') {
            shouldShow = true;
        } else if (filter === 'ai') {
            shouldShow = card.dataset.topics.includes('ai') || 
                        card.dataset.topics.includes('ml') || 
                        card.dataset.topics.includes('machine-learning') ||
                        card.querySelector('.project-title').textContent.toLowerCase().includes('ai');
        } else if (filter === 'web') {
            shouldShow = card.dataset.language.includes('javascript') || 
                        card.dataset.language.includes('typescript') || 
                        card.dataset.language.includes('html') ||
                        card.dataset.topics.includes('web');
        } else if (filter === 'tools') {
            shouldShow = card.dataset.topics.includes('tool') || 
                        card.querySelector('.project-title').textContent.toLowerCase().includes('tool');
        } else if (filter === 'libraries') {
            shouldShow = card.dataset.topics.includes('library') || 
                        card.querySelector('.project-title').textContent.toLowerCase().includes('lib');
        }
        
        card.style.display = shouldShow ? 'block' : 'none';
    });
    
    // Update counts
    const visibleCount = document.querySelectorAll('.project-card[style="display: block"], .project-card:not([style*="display: none"])').length;
    console.log(`📊 Filtered to ${visibleCount} projects`);
}

function setupProjectSearch() {
    const searchInput = document.getElementById('project-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const projectCards = document.querySelectorAll('.project-card');
        
        projectCards.forEach(card => {
            const title = card.querySelector('.project-title').textContent.toLowerCase();
            const description = card.querySelector('.project-description').textContent.toLowerCase();
            const topics = card.dataset.topics;
            const language = card.dataset.language;
            
            const matches = title.includes(query) || 
                          description.includes(query) || 
                          topics.includes(query) ||
                          language.includes(query);
            
            card.style.display = matches ? 'block' : 'none';
        });
        
        // Update search results count
        const visibleCount = document.querySelectorAll('.project-card[style="display: block"], .project-card:not([style*="display: none"])').length;
        console.log(`🔍 Search results: ${visibleCount} projects`);
    });
}

function setupScrollEffects() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}

function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const duration = 2000;
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = Math.floor(progress * targetValue);
        
        element.textContent = currentValue;
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
}

// Initialize console message
console.log('🎨 Portfolio website loaded successfully!');
console.log('📊 Features: Dynamic loading, search, filtering, themes');
console.log('🔗 GitHub: https://github.com/Soulfra');