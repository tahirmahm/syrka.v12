(function() {
  if (window.hasSyrkaInjected) return;
  window.hasSyrkaInjected = true;

  // --- 1. Panel Injection (Shadow DOM) ---
  const host = document.createElement('div');
  host.id = 'syrka-extension-root';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    #syrka-panel-container {
      position: fixed;
      top: 0;
      right: -325px;
      width: 320px;
      height: 100vh;
      z-index: 2147483647;
      background: #111417;
      box-shadow: -5px 0 15px rgba(0,0,0,0.5);
      transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-left: 1px solid rgba(71, 71, 71, 0.15);
    }
    #syrka-panel-container.open {
      right: 0;
    }
    #syrka-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    .syrka-toggle-btn {
      position: fixed;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      background: #111417;
      color: white;
      border: 1px solid rgba(71, 71, 71, 0.15);
      border-right: none;
      padding: 12px 8px;
      cursor: pointer;
      z-index: 2147483646;
      font-family: 'Space Grotesk', sans-serif;
      letter-spacing: 0.1em;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      font-size: 10px;
      font-weight: 600;
    }
  `;
  shadow.appendChild(style);

  const container = document.createElement('div');
  container.id = 'syrka-panel-container';

  const iframe = document.createElement('iframe');
  iframe.id = 'syrka-iframe';
  iframe.src = chrome.runtime.getURL('panel.html');

  container.appendChild(iframe);
  shadow.appendChild(container);

  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'syrka-toggle-btn';
  toggleBtn.textContent = 'SYRKA INTELLIGENCE';
  toggleBtn.onclick = togglePanel;
  shadow.appendChild(toggleBtn);

  function togglePanel() {
    container.classList.toggle('open');
  }

  // --- 2. Page Type Detection ---
  function detectPageType() {
    const hostname = window.location.hostname;
    const url = window.location.href;

    if (hostname.includes('linkedin.com') && url.includes('/jobs/')) return 'job';
    if (hostname.includes('indeed.com')) return 'job';
    if (hostname.includes('glassdoor.com')) return 'job';
    if (hostname.includes('seek.com')) return 'job';
    if (url.includes('/jobs/')) return 'job';

    if (url.includes('/moodle/') || url.includes('/course/') || url.includes('/mod/')) return 'course';

    return 'none';
  }

  // --- 3. Data Extraction ---
  function extractJobData() {
    const tryExtract = (attempts) => {
      if (attempts <= 0) return fallbackExtract();

      const title =
        document.querySelector('.job-details-jobs-unified-top-card__job-title')?.innerText?.trim() ||
        document.querySelector('h1.t-24')?.innerText?.trim() ||
        document.querySelector('h1')?.innerText?.trim() ||
        'Unknown Role';

      const company =
        document.querySelector('.job-details-jobs-unified-top-card__company-name a')?.innerText?.trim() ||
        document.querySelector('.topcard__org-name-link')?.innerText?.trim() ||
        document.querySelector('[data-tracking-control-name="public_jobs_topcard-org-name"]')?.innerText?.trim() ||
        'Unknown Company';

      const salary =
        document.querySelector('.compensation__salary')?.innerText?.trim() ||
        document.querySelector('[class*="salary"]')?.innerText?.trim() ||
        'Not specified';

      const descriptionEl =
        document.querySelector('.jobs-description__content .jobs-box__html-content') ||
        document.querySelector('.jobs-description') ||
        document.querySelector('[class*="description"]');

      const description = descriptionEl?.innerText?.trim() || '';

      if (title === 'Unknown Role' && company === 'Unknown Company') {
        setTimeout(() => tryExtract(attempts - 1), 800);
        return;
      }

      const SKILL_KEYWORDS = [
        'Python','JavaScript','TypeScript','React','Node.js','SQL','Excel',
        'PowerPoint','leadership','communication','analysis','management',
        'research','strategy','economics','finance','data','machine learning',
        'AI','policy','stakeholder','project management','Tableau','Power BI',
        'Java','C++','AWS','Azure','GCP','Docker','Kubernetes','Figma',
        'marketing','sales','operations','consulting','investment','banking'
      ];

      const skills = SKILL_KEYWORDS.filter(s =>
        description.toLowerCase().includes(s.toLowerCase())
      );

      const skillMatchScore = Math.min(skills.length * 8, 40);
      const hasVisionRole = ['AI','data','analysis','policy','research','strategy']
        .some(k => title.toLowerCase().includes(k) || description.toLowerCase().includes(k));
      const visionScore = hasVisionRole ? 30 : 10;
      const totalScore = skillMatchScore + visionScore + 20;
      const grade = totalScore >= 85 ? 'A' : totalScore >= 70 ? 'B' :
                    totalScore >= 55 ? 'C' : totalScore >= 40 ? 'D' : 'F';

      window.syrkaJobData = { title, company, salary, skills, description, score: totalScore, grade };
      sendIntel({ type: 'job', data: window.syrkaJobData });
    };

    tryExtract(5);
  }

  function fallbackExtract() {
    window.syrkaJobData = {
      title: document.title.replace(' | LinkedIn', '').trim(),
      company: 'See page',
      salary: 'Not specified',
      skills: [],
      description: '',
      score: 0,
      grade: 'N/A'
    };
    sendIntel({ type: 'job', data: window.syrkaJobData });
  }

  function extractCourseData() {
    return {
      type: 'course',
      data: {
        courseName: document.querySelector('.page-header-headings h1')?.innerText || document.title,
        modules: Array.from(document.querySelectorAll('.sectionname')).map(el => el.innerText.trim()),
        assignments: Array.from(document.querySelectorAll('.modtype_assign')).map(el => ({
          name: el.querySelector('.instancename')?.innerText.replace('Assignment', '').trim(),
          dueDate: 'N/A'
        }))
      }
    };
  }

  function sendIntel(intel) {
    iframe.contentWindow.postMessage({ type: 'PAGE_INTEL', intel }, '*');
  }

  // --- 4. Communication ---
  window.addEventListener('message', (event) => {
    if (event.data.action === 'closePanel') {
      container.classList.remove('open');
    }
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'togglePanel') togglePanel();
  });

  iframe.onload = () => {
    const pageType = detectPageType();

    if (pageType === 'job') {
      setTimeout(extractJobData, 1200);
    } else if (pageType === 'course') {
      const intel = extractCourseData();
      sendIntel(intel);
    } else {
      sendIntel({ type: 'none', data: {} });
    }
  };

})();
