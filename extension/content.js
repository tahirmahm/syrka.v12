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
  function extractIntel() {
    const url = window.location.href;

    // Moodle Detection
    if (url.includes('/moodle/') || url.includes('/course/') || url.includes('/mod/')) {
      return {
        type: 'course',
        data: {
          courseName: document.querySelector('.page-header-headings h1')?.innerText || document.title,
          modules: Array.from(document.querySelectorAll('.sectionname')).map(el => el.innerText.trim()),
          assignments: Array.from(document.querySelectorAll('.modtype_assign')).map(el => ({
            name: el.querySelector('.instancename')?.innerText.replace('Assignment', '').trim(),
            dueDate: 'N/A' // Harder to get from list view, but could be scraped if present
          }))
        }
      };
    }

    // Job Detection
    const jobPatterns = ['linkedin.com/jobs', 'indeed.com', 'glassdoor.com', 'seek.com', '/jobs/'];
    if (jobPatterns.some(p => url.includes(p))) {
      // Very basic generic extraction, should be tailored per site in real use
      return {
        type: 'job',
        data: {
          title: document.querySelector('h1')?.innerText || 'Unknown Role',
          company: document.querySelector('.job-details-company-name')?.innerText ||
                   document.querySelector('[class*="company"]')?.innerText || 'Unknown Company',
          salary: null, // Scraper specific needed
          skills: Array.from(document.body.innerText.matchAll(/[A-Z][a-z]+ (Engineer|Developer|Manager|Analyst)/g)).map(m => m[0]).slice(0, 5),
          description: document.body.innerText.substring(0, 1000),
          workType: url.includes('remote') ? 'Remote' : 'Onsite'
        }
      };
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
