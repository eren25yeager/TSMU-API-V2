// File: public/script.js (Safe Version)

document.addEventListener('DOMContentLoaded', function() {
    // --- التحقق من وجود جميع العناصر الأساسية ---
    const mainContent = document.getElementById('main-content');
    const codeInput = document.getElementById('code-input');
    const searchBtn = document.getElementById('search-btn');
    const loaderContainer = document.getElementById('loader-container');
    const resultsContainer = document.getElementById('results-container');
    const themeToggle = document.getElementById('theme-toggle');
    const canvas = document.getElementById('background-canvas');
    const tickerContent = document.querySelector('.news-ticker-content');
    const titleElement = document.getElementById('animated-title')?.querySelector('.text');

    // إذا كان أي عنصر أساسي مفقوداً، أوقف التنفيذ وأبلغ عن المشكلة
    if (!mainContent || !codeInput || !searchBtn || !loaderContainer || !resultsContainer || !themeToggle || !canvas || !tickerContent || !titleElement) {
        console.error("Initialization Error: One or more essential HTML elements are missing from the page.");
        return; // أوقف كل شيء
    }

    let currentMemberCode = null;
    const ctx = canvas.getContext('2d');
    let particles = [];

    // --- دالة الاتصال بالـ API ---
    async function handleSearch() {
        currentMemberCode = codeInput.value.trim();
        if (!currentMemberCode) {
            alert('Please enter a Member ID.');
            return;
        }
        
        loaderContainer.classList.add('visible');
        mainContent.style.display = 'none';
        resultsContainer.style.display = 'none';
        resultsContainer.innerHTML = '';

        console.log(`Attempting to fetch for code: ${currentMemberCode}`); // سجل تشخيصي للواجهة
        try {
            // هذا هو السطر الذي يجب أن يظهر في سجلات Vercel
            const response = await fetch(`/api/get-data?code=${encodeURIComponent(currentMemberCode)}`);
            
            // هذا السطر لن يتم الوصول إليه إذا فشل الاتصال
            const res = await response.json();

            if (!response.ok) {
                throw new Error(res.message || 'An unknown server error occurred.');
            }
            
            displayResults(res);

        } catch (error) {
            console.error("Fetch Error in Frontend:", error);
            displayError({ message: error.message });
        }
    }
    
    // --- بقية الدوال كما هي ---
    function resetToSearch() {
        resultsContainer.style.display = 'none';
        mainContent.style.display = 'block';
        codeInput.value = '';
        currentMemberCode = null;
    }

    function displayResults(res) {
        loaderContainer.classList.remove('visible');
        if (!res.found || !res.data) {
            alert(res.message || 'Member ID not found.');
            resetToSearch();
            return;
        }
        
        const member = res.data;
        let avatarContent;
        const photoUrl = member['DirectPhotoLink'];
        if (photoUrl && String(photoUrl).trim() !== '') {
            avatarContent = `<img src="${photoUrl}" alt="Member Photo">`;
        } else {
            const initial = member.Name ? member.Name.charAt(0).toUpperCase() : '?';
            avatarContent = `<div class="profile-avatar-placeholder">${initial}</div>`;
        }

        let percentage = parseFloat(member['%'] || 0).toFixed(2);
        let totalScore = parseInt(member.Total || 0);
        const maxTotalScore = 100; 

        let performanceHtml = '';
        const performanceKeys = ['Quality of the task', 'Quantity of the task', 'Attendence', 'Communication', 'Flexibility', 'Teamwork', 'Technical Knowledge', 'Bonus'];
        performanceKeys.forEach(key => {
            const value = member[key] || 'N/A';
            performanceHtml += `<tr><td>${key}</td><td>${value}</td></tr>`;
        });

        let adminHtml = '';
        const adminKeys = ['Freezing', 'Attention', 'Alarm'];
        adminKeys.forEach(key => {
            if (member[key] !== undefined && String(member[key]).trim() !== '') {
                adminHtml += `<tr><td>${key}</td><td>${member[key]}</td></tr>`;
            }
        });

        const commentText = (member.Comment && String(member.Comment).trim() !== '') 
            ? `<p>${member.Comment}</p>`
            : '<p class="no-comment">No comment provided.</p>';

        resultsContainer.innerHTML = `
            <div class="profile-card">
                <div class="profile-avatar">
                    <div class="profile-avatar-inner">${avatarContent}</div>
                </div>
                <div class="profile-info">
                    <h2>${member.Name || 'Unknown'}</h2>
                    <p>${member.Committee || 'No Committee'}</p>
                    <div class="profile-status-grid">
                        <div class="status-item"><div class="title">Appreciation</div><div class="value">${member.Appreciation || 'N/A'}</div></div>
                        <div class="status-item"><div class="title">Final Status</div><div class="value">${member.Status || 'N/A'}</div></div>
                    </div>
                </div>
            </div>
            <div class="evaluation-card">
                <div class="score-display">
                    <div class="score-card">
                        <div class="chart-container"><canvas id="totalScoreChart"></canvas><div class="chart-value">${totalScore}</div></div>
                        <div class="title">Total Score</div>
                    </div>
                    <div class="score-card">
                        <div class="chart-container"><canvas id="percentageChart"></canvas><div class="chart-value">${percentage}%</div></div>
                        <div class="title">Percentage</div>
                    </div>
                </div>
                <div class="details-section">
                    <div class="accordion-item"><div class="accordion-header"><span><i class="fas fa-tasks fa-fw" style="margin-right: 8px; color: var(--color-red);"></i> Performance Evaluation</span><i class="fas fa-chevron-down icon-right"></i></div><div class="accordion-content"><table class="details-table">${performanceHtml}</table></div></div>
                    ${adminHtml ? `<div class="accordion-item"><div class="accordion-header"><span><i class="fas fa-user-shield fa-fw" style="margin-right: 8px; color: var(--color-red);"></i> Administrative Status</span><i class="fas fa-chevron-down icon-right"></i></div><div class="accordion-content"><table class="details-table">${adminHtml}</table></div></div>` : ''}
                    <div class="accordion-item"><div class="accordion-header"><span><i class="fas fa-comment-dots fa-fw" style="margin-right: 8px; color: var(--color-red);"></i> Final Comment</span><i class="fas fa-chevron-down icon-right"></i></div><div class="accordion-content"><div class="comment-box">${commentText}</div></div></div>
                </div>
                <div class="card-actions">
                    <button id="new-search-btn" class="btn btn-new-search"><i class="fas fa-search"></i> New Search</button>
                    <button id="export-pdf-btn" class="btn btn-primary"><i class="fas fa-file-pdf"></i> Export PDF</button>
                    <a href="https://docs.google.com/forms/d/e/1FAIpQLSfh9MTlGCh4YNmFazSKapdDm_ISOLVIghNH2Tqu3_zrdxUBmQ/viewform?usp=header" target="_blank" class="btn btn-secondary"><i class="fas fa-exclamation-triangle"></i> Complaint</a>
                </div>
            </div>`;
        
        resultsContainer.style.display = 'block';
        createDoughnutChart('totalScoreChart', totalScore, maxTotalScore, document.documentElement.getAttribute('data-theme' ));
        createDoughnutChart('percentageChart', percentage, 100, document.documentElement.getAttribute('data-theme'));
        document.getElementById('new-search-btn').addEventListener('click', resetToSearch);
        document.getElementById('export-pdf-btn').addEventListener('click', handlePdfExport);
        document.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                header.classList.toggle('active');
                content.style.maxHeight = content.style.maxHeight ? null : content.scrollHeight + "px";
            });
        });
        if (photoUrl) setupImageModal(photoUrl);
    }

    function createDoughnutChart(canvasId, value, maxValue, theme) {
        const chartCtx = document.getElementById(canvasId)?.getContext('2d');
        if (!chartCtx) return;
        const remainingValue = maxValue - value;
        const chartColor = '#d92525';
        const trackColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        new Chart(chartCtx, {
            type: 'doughnut',
            data: { datasets: [{ data: [value, remainingValue], backgroundColor: [chartColor, trackColor], borderWidth: 0, borderRadius: 5 }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '80%', plugins: { legend: { display: false }, tooltip: { enabled: false } }, animation: { duration: 1500, easing: 'easeOutBounce' } }
        });
    }

    function setupImageModal(imageUrl) {
        const avatar = document.querySelector('.profile-avatar');
        const modal = document.getElementById('image-modal');
        const modalImg = document.getElementById('image-modal-content');
        const closeBtn = document.getElementById('image-modal-close');
        if (!avatar || !modal || !modalImg || !closeBtn) return;
        avatar.addEventListener('click', () => { modal.classList.add('visible'); modalImg.src = imageUrl; });
        const closeModal = () => modal.classList.remove('visible');
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    }

    function handlePdfExport() { alert("PDF export functionality is currently under development for this platform."); }
    function displayError(error) { loaderContainer.classList.remove('visible'); resetToSearch(); alert(`An error occurred: ${error.message}`); }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        themeToggle.innerHTML = theme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    }

    searchBtn.addEventListener('click', handleSearch);
    codeInput.addEventListener('keypress', (event) => { if (event.key === "Enter") searchBtn.click(); });
    themeToggle.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
    });

    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    tickerContent.innerHTML += tickerContent.innerHTML;
    let charIndex = 0;
    const fullTitle = "Tahya Misr Student Union";
    function typeWriter() {
        if (charIndex < fullTitle.length) {
            titleElement.textContent += fullTitle.charAt(charIndex);
            charIndex++;
            setTimeout(typeWriter, 100);
        } else {
            const cursor = document.querySelector('.header h1 .cursor');
            if (cursor) setTimeout(() => { cursor.style.display = 'none'; }, 1000);
        }
    }
    setTimeout(typeWriter, 500);

    function setupCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        createParticles();
    }

    function createParticles() {
        particles = [];
        let numParticles = window.innerWidth > 768 ? 100 : 30;
        for (let i = 0; i < numParticles; i++) {
            particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 1.5 + 0.5, speedX: Math.random() * 0.4 - 0.2, speedY: Math.random() * 0.4 - 0.2 });
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const currentTheme = document.documentElement.getAttribute('data-theme');
        ctx.fillStyle = (currentTheme === 'dark') ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)';
        particles.forEach(p => {
            p.x += p.speedX; p.y += p.speedY;
            if (p.x > canvas.width || p.x < 0) p.speedX *= -1;
            if (p.y > canvas.height || p.y < 0) p.speedY *= -1;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        });
        requestAnimationFrame(animateParticles);
    }

    window.addEventListener('resize', setupCanvas);
    setupCanvas();
    animateParticles();
});
