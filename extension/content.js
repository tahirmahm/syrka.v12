(function() {
  if (window.hasSyrkaInjected) return;
  window.hasSyrkaInjected = true;

  // --- 1. Panel Injection (Shadow DOM) ---
  const host = document.createElement('div');
  host.id = 'syrka-extension-root';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  // Styles for the host and shadow
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

  // --- 2. Data Extraction ---

  function detectPageType() {
    const url = window.location.href;
    const hostname = window.location.hostname;

    // Moodle detection
    if (url.includes('/course/') || url.includes('/moodle/') ||
        url.includes('/mod/') || url.includes('moodle.') ||
        document.querySelector('.course-content') ||
        document.querySelector('#region-main .section')) {
      return 'moodle';
    }

    // Job site detection — hostname AND URL patterns
    if (hostname.includes('linkedin.com') ||
        hostname.includes('indeed.com') ||
        hostname.includes('glassdoor.com') ||
        hostname.includes('seek.com') ||
        hostname.includes('reed.co.uk') ||
        hostname.includes('totaljobs.com') ||
        url.includes('/jobs/') ||
        url.includes('/job/') ||
        url.includes('/careers/') ||
        document.querySelector('[class*="job-details"]') ||
        document.querySelector('[class*="jobsearch"]') ||
        document.querySelector('.job-view-layout')) {
      return 'job';
    }

    return 'none';
  }

  function extractJobData() {
    const url = window.location.href;

    const title =
      document.querySelector('.job-details-jobs-unified-top-card__job-title h1')?.innerText ||
      document.querySelector('.topcard__title')?.innerText ||
      document.querySelector('h1[class*="title"]')?.innerText ||
      document.querySelector('h1')?.innerText ||
      'Unknown Title';

    const company =
      document.querySelector('.job-details-jobs-unified-top-card__company-name')?.innerText ||
      document.querySelector('.topcard__org-name-link')?.innerText ||
      document.querySelector('[class*="company-name"]')?.innerText ||
      'Unknown Company';

    const description =
      document.querySelector('.jobs-description__content')?.innerText ||
      document.querySelector('.description__text')?.innerText ||
      document.querySelector('[class*="description"]')?.innerText ||
      document.body.innerText.substring(0, 2000);

    const skillKeywords = [
      'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'Excel',
      'PowerPoint', 'leadership', 'communication', 'analysis', 'management',
      'research', 'strategy', 'economics', 'finance', 'data', 'machine learning',
      'AI', 'policy', 'stakeholder', 'project management', 'Tableau'
    ];

    const skills = skillKeywords.filter(skill =>
      description.toLowerCase().includes(skill.toLowerCase())
    );

    return {
      title: title.trim(),
      company: company.trim(),
      salary: null,
      skills,
      description,
      workType: url.includes('remote') ? 'Remote' : 'Onsite'
    };
  }

  function extractIntel() {
    const pageType = detectPageType();

    if (pageType === 'moodle') {
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

    if (pageType === 'job') {
      return { type: 'job', data: extractJobData() };
    }

    return { type: 'none', data: {} };
  }

  // --- 3. Communication ---
  window.addEventListener('message', (event) => {
    if (event.data.action === 'closePanel') {
      container.classList.remove('open');
    }
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'togglePanel') togglePanel();
  });

  // Send intel to panel once it's loaded
  iframe.onload = () => {
    const intel = extractIntel();
    iframe.contentWindow.postMessage({ type: 'PAGE_INTEL', intel }, '*');
  };

})();
