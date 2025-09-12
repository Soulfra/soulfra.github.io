// Portfolio Website JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Load project data
    loadProjects();
    loadSkills();
    
    // Setup event listeners
    setupThemeToggle();
    setupProjectFilters();
    setupProjectSearch();
    setupScrollEffects();
});

// Project data (loaded from GitHub API)
const projectsData = [
  {
    "createdAt": "2025-09-12T21:03:17Z",
    "description": "Demo application showcasing 3D graphics",
    "isPrivate": false,
    "name": "demo_game_development_3",
    "primaryLanguage": null,
    "repositoryTopics": null,
    "url": "https://github.com/Soulfra/demo_game_development_3"
  },
  {
    "createdAt": "2025-09-12T21:03:13Z",
    "description": "CLI tool for build built with javascript",
    "isPrivate": false,
    "name": "tool_web_development_2",
    "primaryLanguage": null,
    "repositoryTopics": [
      {
        "name": "javascript"
      },
      {
        "name": "tool"
      },
      {
        "name": "web-development"
      }
    ],
    "url": "https://github.com/Soulfra/tool_web_development_2"
  },
  {
    "createdAt": "2025-09-12T21:03:09Z",
    "description": "A flexible rust library for building modern web applications",
    "isPrivate": false,
    "name": "rust_web_development_1",
    "primaryLanguage": {
      "name": "JavaScript"
    },
    "repositoryTopics": [
      {
        "name": "library"
      },
      {
        "name": "rust"
      },
      {
        "name": "web-development"
      }
    ],
    "url": "https://github.com/Soulfra/rust_web_development_1"
  },
  {
    "createdAt": "2025-09-12T20:58:33Z",
    "description": "A robust typescript library for securing applications and data",
    "isPrivate": false,
    "name": "rust_cybersecurity_1",
    "primaryLanguage": {
      "name": "TypeScript"
    },
    "repositoryTopics": null,
    "url": "https://github.com/Soulfra/rust_cybersecurity_1"
  },
  {
    "createdAt": "2025-09-12T20:54:21Z",
    "description": "Complete GitHub portfolio generation system - Create 100+ repos like tom-doerr with puppet screen preview",
    "isPrivate": false,
    "name": "portfolio-generator",
    "primaryLanguage": {
      "name": "JavaScript"
    },
    "repositoryTopics": null,
    "url": "https://github.com/Soulfra/portfolio-generator"
  },
  {
    "createdAt": "2025-09-04T11:59:48Z",
    "description": "Build real websites using natural language - no coding required",
    "isPrivate": false,
    "name": "ai-website-builder",
    "primaryLanguage": {
      "name": "HTML"
    },
    "repositoryTopics": [
      {
        "name": "ai"
      },
      {
        "name": "natural-language"
      },
      {
        "name": "no-code"
      },
      {
        "name": "ollama"
      },
      {
        "name": "website-builder"
      },
      {
        "name": "anthropic"
      },
      {
        "name": "javascript"
      },
      {
        "name": "nodejs"
      },
      {
        "name": "openai"
      },
      {
        "name": "web-development"
      }
    ],
    "url": "https://github.com/Soulfra/ai-website-builder"
  },
  {
    "createdAt": "2025-06-27T20:35:13Z",
    "description": "Document Generator - Transform any document into a working MVP in under 30 minutes using AI-powered code generation, template matching, and automated deployment",
    "isPrivate": true,
    "name": "finishthisidea",
    "primaryLanguage": {
      "name": "TypeScript"
    },
    "repositoryTopics": [
      {
        "name": "ai"
      },
      {
        "name": "docker"
      },
      {
        "name": "document-generator"
      },
      {
        "name": "kubernetes"
      },
      {
        "name": "mvp"
      },
      {
        "name": "typescript"
      }
    ],
    "url": "https://github.com/Soulfra/finishthisidea"
  },
  {
    "createdAt": "2025-07-01T00:39:56Z",
    "description": "",
    "isPrivate": true,
    "name": "HowWasTheVibe2",
    "primaryLanguage": {
      "name": "TypeScript"
    },
    "repositoryTopics": null,
    "url": "https://github.com/Soulfra/HowWasTheVibe2"
  },
  {
    "createdAt": "2025-07-01T00:21:07Z",
    "description": "",
    "isPrivate": true,
    "name": "howwasthevibe",
    "primaryLanguage": null,
    "repositoryTopics": null,
    "url": "https://github.com/Soulfra/howwasthevibe"
  },
  {
    "createdAt": "2025-06-29T19:47:56Z",
    "description": "",
    "isPrivate": true,
    "name": "AI-OS-Ripping-Desktop",
    "primaryLanguage": {
      "name": "JavaScript"
    },
    "repositoryTopics": null,
    "url": "https://github.com/Soulfra/AI-OS-Ripping-Desktop"
  },
  {
    "createdAt": "2025-06-07T13:49:33Z",
    "description": "",
    "isPrivate": true,
    "name": "clarity-engine-kernel-slate",
    "primaryLanguage": {
      "name": "JavaScript"
    },
    "repositoryTopics": null,
    "url": "https://github.com/Soulfra/clarity-engine-kernel-slate"
  },
  {
    "createdAt": "2025-06-08T13:04:33Z",
    "description": "",
    "isPrivate": true,
    "name": "ai-kernel",
    "primaryLanguage": {
      "name": "JavaScript"
    },
    "repositoryTopics": null,
    "url": "https://github.com/Soulfra/ai-kernel"
  },
  {
    "createdAt": "2025-06-08T12:49:59Z",
    "description": "engine",
    "isPrivate": true,
    "name": "engine-documentation",
    "primaryLanguage": null,
    "repositoryTopics": null,
    "url": "https://github.com/Soulfra/engine-documentation"
  },
  {
    "createdAt": "2025-06-02T12:53:53Z",
    "description": "",
    "isPrivate": true,
    "name": "clarity-engine",
    "primaryLanguage": {
      "name": "JavaScript"
    },
    "repositoryTopics": null,
    "url": "https://github.com/Soulfra/clarity-engine"
  },
  {
    "createdAt": "2025-05-30T18:45:04Z",
    "description": "Rewrite your tone with confidence and clarity.",
    "isPrivate": true,
    "name": "cringeproof",
    "primaryLanguage": {
      "name": "HTML"
    },
    "repositoryTopics": null,
    "url": "https://github.com/Soulfra/cringeproof"
  },
  {
    "createdAt": "2025-05-31T15:31:20Z",
    "description": "Cringeproof rewrites your texts with confidence and clarity.",
    "isPrivate": true,
    "name": "cringeproof-app",
    "primaryLanguage": null,
    "repositoryTopics": null,
    "url": "https://github.com/Soulfra/cringeproof-app"
  },
  {
    "createdAt": "2025-05-10T12:54:06Z",
    "description": "",
    "isPrivate": true,
    "name": "calctl",
    "primaryLanguage": {
      "name": "JavaScript"
    },
    "repositoryTopics": null,
    "url": "https://github.com/Soulfra/calctl"
  }
];

function loadProjects() {
    const projectsGrid = document.getElementById('projects-grid');
    
    projectsData.forEach(repo => {
        if (repo.name === 'soulfra.github.io') return; // Skip portfolio repo
        
        const card = createProjectCard(repo);
        projectsGrid.appendChild(card);
    });
}

function createProjectCard(repo) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.dataset.language = repo.primaryLanguage?.name?.toLowerCase() || '';
    card.dataset.topics = (repo.repositoryTopics?.map(t => t.topic?.name) || []).join(' ').toLowerCase();
    
    const projectType = determineProjectType(repo);
    const iconColor = getLanguageColor(repo.primaryLanguage?.name);
    
    card.innerHTML = `
        <div class="project-header">
            <div class="project-icon" style="background: ${iconColor}">
                <i class="${getProjectIcon(projectType)}"></i>
            </div>
            <h3 class="project-title">${repo.name.replace(/_/g, ' ').replace(/-/g, ' ')}</h3>
        </div>
        
        <p class="project-description">
            ${repo.description || 'No description available'}
        </p>
        
        <div class="project-topics">
            ${(repo.repositoryTopics?.map(t => t.topic?.name) || []).map(topic => 
                `<span class="topic-tag">${topic}</span>`
            ).join('')}
            ${repo.primaryLanguage ? 
                `<span class="topic-tag">${repo.primaryLanguage.name}</span>` : ''
            }
        </div>
        
        <div class="project-links">
            <a href="${repo.url}" class="project-link primary" target="_blank">
                <i class="fab fa-github"></i> View Code
            </a>
            ${repo.name.includes('demo') || repo.name.includes('app') ? 
                `<a href="https://${repo.name}.netlify.app" class="project-link secondary" target="_blank">
                    <i class="fas fa-external-link-alt"></i> Live Demo
                </a>` : ''
            }
        </div>
    `;
    
    return card;
}

function determineProjectType(repo) {
    const name = repo.name.toLowerCase();
    const description = (repo.description || '').toLowerCase();
    const topics = (repo.repositoryTopics?.map(t => t.topic?.name) || []).join(' ').toLowerCase();
    
    if (name.includes('tool') || topics.includes('cli')) return 'tool';
    if (name.includes('demo') || topics.includes('demo')) return 'demo';
    if (name.includes('api') || topics.includes('api')) return 'api';
    if (name.includes('lib') || topics.includes('library')) return 'library';
    if (description.includes('tutorial') || topics.includes('tutorial')) return 'tutorial';
    
    return 'project';
}

function getProjectIcon(type) {
    const icons = {
        tool: 'fas fa-tools',
        demo: 'fas fa-play-circle',
        api: 'fas fa-server',
        library: 'fas fa-book',
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
        React: '#61DAFB'
    };
    return colors[language] || '#666';
}

function loadSkills() {
    const skillsGrid = document.getElementById('skills-grid');
    const languages = {};
    
    // Count languages from repositories
    projectsData.forEach(repo => {
        if (repo.primaryLanguage) {
            const lang = repo.primaryLanguage.name;
            languages[lang] = (languages[lang] || 0) + 1;
        }
    });
    
    // Create skill items
    Object.entries(languages).forEach(([lang, count]) => {
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
        React: 'fab fa-react'
    };
    return icons[language] || 'fas fa-code';
}

function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
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
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function setupProjectFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Filter projects
            const filter = btn.dataset.filter;
            projectCards.forEach(card => {
                if (filter === 'all') {
                    card.style.display = 'block';
                } else if (filter === 'ai') {
                    card.style.display = card.dataset.topics.includes('ai') || 
                                         card.dataset.topics.includes('ml') || 
                                         card.dataset.topics.includes('machine-learning') ? 'block' : 'none';
                } else if (filter === 'web') {
                    card.style.display = card.dataset.language.includes('javascript') || 
                                         card.dataset.language.includes('typescript') || 
                                         card.dataset.language.includes('html') ? 'block' : 'none';
                } else if (filter === 'tools') {
                    card.style.display = card.dataset.topics.includes('cli') || 
                                         card.querySelector('.project-title').textContent.toLowerCase().includes('tool') ? 'block' : 'none';
                } else if (filter === 'libraries') {
                    card.style.display = card.dataset.topics.includes('library') || 
                                         card.querySelector('.project-title').textContent.toLowerCase().includes('lib') ? 'block' : 'none';
                }
            });
        });
    });
}

function setupProjectSearch() {
    const searchInput = document.getElementById('project-search');
    const projectCards = document.querySelectorAll('.project-card');
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        
        projectCards.forEach(card => {
            const title = card.querySelector('.project-title').textContent.toLowerCase();
            const description = card.querySelector('.project-description').textContent.toLowerCase();
            const topics = card.dataset.topics;
            
            if (title.includes(query) || description.includes(query) || topics.includes(query)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

function setupScrollEffects() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
    
    // Update repo count with animation
    animateCounter('repo-count', 17);
}

function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
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