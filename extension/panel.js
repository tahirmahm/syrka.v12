const state = {
  type: null,
  data: null,
  profile: null
};

async function loadUserProfile() {
  const { syrka_token } = await chrome.storage.local.get(['syrka_token']);
  if (!syrka_token) return null;
  try {
    const res = await fetch('https://syrka.co/api/extension/profile', {
      headers: { 'Authorization': `Bearer ${syrka_token}` }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

function renderProfileBanner(profile) {
  const banner = document.getElementById('profile-banner');
  if (!banner) return;

  if (!profile || !profile.authenticated) {
    banner.innerHTML = `
      <div style="padding:10px 14px;border-bottom:1px solid rgba(71,71,71,0.15);
                  display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:9px;color:#484F58;letter-spacing:1px;text-transform:uppercase;">
          Not signed in
        </span>
        <a href="https://syrka.co/saudi/student" target="_blank"
           style="font-size:9px;color:#C9D1D9;text-decoration:none;letter-spacing:0.5px;">
          SIGN IN &rarr;
        </a>
      </div>
    `;
    return;
  }

  const signal = profile.weeklySignal;
  const gaps = profile.topMissingSkills || [];

  banner.innerHTML = `
    <div style="padding:10px 14px;border-bottom:1px solid rgba(71,71,71,0.15);background:#1D2023;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-size:11px;font-weight:700;color:#fff;font-family:'Space Grotesk',sans-serif;">
          ${signal?.week_focus || 'Your Syrka Profile'}
        </span>
        <span style="font-size:18px;font-weight:700;color:#fff;font-family:'Space Grotesk',sans-serif;">
          ${profile.orchestrationScore}<span style="font-size:9px;color:#484F58;">/100</span>
        </span>
      </div>
      ${signal?.skill_to_drop_everything_for ? `
        <div style="font-size:9px;color:#484F58;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px;">
          FOCUS THIS WEEK
        </div>
        <div style="font-size:10px;color:#C9D1D9;">
          ${signal.skill_to_drop_everything_for}
        </div>
      ` : ''}
      ${gaps.length > 0 ? `
        <div style="font-size:9px;color:#484F58;letter-spacing:1px;text-transform:uppercase;margin-top:8px;margin-bottom:4px;">
          YOUR TOP GAPS
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">
          ${gaps.map(s => `<span style="font-size:9px;color:#F85149;background:#2D1116;padding:2px 6px;border:1px solid #3D1C1C;">&nearr; ${s}</span>`).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

// Load profile on panel open
loadUserProfile().then(profile => {
  state.profile = profile;
  renderProfileBanner(profile);
});

window.addEventListener('message', (event) => {
  if (event.data.type === 'PAGE_INTEL') {
    updateUI(event.data.intel);
  }
  if (event.data.type === 'SYRKA_AUTH') {
    loadUserProfile().then(profile => {
      state.profile = profile;
      renderProfileBanner(profile);
    });
  }
});

function updateUI(intel) {
  state.type = intel.type;
  state.data = intel.data;

  document.getElementById('loading').classList.add('hidden');
  document.getElementById('page-badge').textContent = intel.type.toUpperCase();

  if (intel.type === 'course') {
    showCourse(intel.data);
  } else if (intel.type === 'job') {
    showJob(intel.data);
  } else {
    document.getElementById('no-intel').classList.remove('hidden');
  }
}

async function showCourse(data) {
  const section = document.getElementById('course-section');
  section.classList.remove('hidden');

  document.getElementById('course-name').textContent = data.courseName;

  // Show sync status
  const { syrka_token } = await chrome.storage.local.get(['syrka_token']);
  const syncIndicator = document.createElement('div');
  syncIndicator.style.cssText = 'font-size:9px;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;';
  if (syrka_token) {
    syncIndicator.innerHTML = '<span style="color:#3FB950;">&#9679; Synced to Syrka</span>';
  } else {
    syncIndicator.innerHTML = '<span style="color:#484F58;">&#9675; Sign in to sync</span>';
  }
  section.insertBefore(syncIndicator, section.querySelector('#course-info'));

  const moduleList = document.getElementById('module-list');
  moduleList.innerHTML = '';
  data.modules.forEach(mod => {
    const li = document.createElement('li');
    li.textContent = mod;
    moduleList.appendChild(li);
  });

  const assignmentList = document.getElementById('assignment-list');
  assignmentList.innerHTML = '';
  data.assignments.forEach(asn => {
    const li = document.createElement('li');
    li.textContent = `${asn.name} (${asn.dueDate})`;
    assignmentList.appendChild(li);
  });

  window.syrkaCourseData = { courseName: data.courseName, modules: data.modules };
}

function showJob(data) {
  const section = document.getElementById('job-section');
  section.classList.remove('hidden');

  document.getElementById('job-title').textContent = data.title;
  document.getElementById('job-company').textContent = data.company;
  document.getElementById('job-salary').textContent = data.salary || 'Not specified';

  const skillsContainer = document.getElementById('job-skills');
  skillsContainer.innerHTML = '';
  (data.skills || []).forEach(skill => {
    const pill = document.createElement('span');
    pill.className = 'pill';
    pill.textContent = skill;
    skillsContainer.appendChild(pill);
  });

  const badge = document.getElementById('score-badge');
  if (data.grade) {
    badge.textContent = data.grade;
  }
}

// Close panel
document.getElementById('close-btn').addEventListener('click', () => {
  window.parent.postMessage({ action: 'closePanel' }, '*');
});

// Analyse Skills Gap — inline, no fetch
document.getElementById('analyse-skills-btn').addEventListener('click', () => {
  const btn = document.getElementById('analyse-skills-btn');
  btn.disabled = true;
  btn.textContent = 'Analysing...';

  const courseName = state.data?.courseName || window.syrkaCourseData?.courseName || 'Unknown Course';
  const modules = state.data?.modules || window.syrkaCourseData?.modules || [];

  const SKILL_MAP = {
    'programming': 'Python / JavaScript',
    'software': 'Software Engineering',
    'database': 'SQL & Data Management',
    'network': 'Network Architecture',
    'security': 'Cybersecurity',
    'web': 'Web Development',
    'data': 'Data Analysis',
    'machine learning': 'Machine Learning',
    'artificial intelligence': 'AI Systems',
    'cloud': 'Cloud Computing',
    'project': 'Project Management',
    'business': 'Business Analysis',
    'design': 'UX/UI Design',
    'math': 'Applied Mathematics',
    'statistic': 'Statistical Analysis',
    'research': 'Research Methodology',
    'progress': 'Progress Tracking',
    'intervention': 'Strategic Intervention',
    'debate': 'Critical Argumentation'
  };

  const VISION_SKILLS = [
    'AI Systems', 'Data Analysis', 'Cloud Computing', 'Cybersecurity',
    'Machine Learning', 'Digital Transformation', 'Policy Design',
    'Impact Assessment', 'Systems Thinking'
  ];

  const extractedSkills = [];
  const lowerModules = modules.map(m => m.toLowerCase()).join(' ');
  const lowerCourse = courseName.toLowerCase();
  const combined = lowerCourse + ' ' + lowerModules;

  for (const [keyword, skill] of Object.entries(SKILL_MAP)) {
    if (combined.includes(keyword) && !extractedSkills.includes(skill)) {
      extractedSkills.push(skill);
    }
  }

  const gaps = VISION_SKILLS.filter(vs => !extractedSkills.includes(vs));

  // Store for Syrka link
  window.syrkaCourseData = { ...window.syrkaCourseData, extractedSkills, gaps };

  // Build session recommendations
  const recommendations = [];
  for (const mod of modules) {
    if (recommendations.length >= 3) break;
    const modLower = mod.toLowerCase();
    for (const gap of gaps) {
      if (recommendations.length >= 3) break;
      const gapKeywords = gap.toLowerCase().split(' ');
      const hasRelevance = gapKeywords.some(k => modLower.includes(k)) ||
        Object.entries(SKILL_MAP).some(([kw, sk]) => sk !== gap && modLower.includes(kw));
      if (hasRelevance) {
        recommendations.push({ module: mod, gap });
        break;
      }
    }
  }

  // Build results HTML
  const courseParams = new URLSearchParams({
    course: encodeURIComponent(courseName),
    skills: encodeURIComponent(extractedSkills.join(',')),
    gaps: encodeURIComponent(gaps.join(',')),
    source: 'moodle-extension'
  });
  const syrkaUrl = `https://syrka.co/saudi/student?${courseParams.toString()}`;

  let html = `
    <div style="margin-top: 12px;">
      <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #919191; margin-bottom: 8px;">
        COURSE SKILLS DETECTED
      </p>
      <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 16px;">
        ${extractedSkills.map(s => `<span style="font-size: 10px; padding: 2px 8px; background: #272A2D; color: #C6C6C6; border: 1px solid rgba(71,71,71,0.3);">${s}</span>`).join('')}
        ${extractedSkills.length === 0 ? '<span style="font-size: 11px; color: #666;">No skills detected from modules</span>' : ''}
      </div>

      <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #919191; margin-bottom: 8px;">
        SKILL GAPS (vs Vision 2030)
      </p>
      <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 16px;">
        ${gaps.slice(0, 6).map(g => `<span style="font-size: 10px; padding: 2px 8px; border: 1px solid rgba(244,67,54,0.4); color: #F44336;">${g}</span>`).join('')}
      </div>`;

  if (recommendations.length > 0) {
    html += `
      <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #919191; margin-bottom: 8px;">
        SESSION RECOMMENDATIONS
      </p>
      <div style="margin-bottom: 16px;">
        ${recommendations.map(r =>
          `<div style="font-size: 11px; color: #C9D1D9; padding: 4px 0; border-bottom: 1px solid rgba(71,71,71,0.15);">→ ${r.module} — develop ${r.gap}</div>`
        ).join('')}
      </div>`;
  }

  html += `
      <a href="${syrkaUrl}" target="_blank"
         style="display: block; text-align: center; padding: 10px; background: #FFFFFF; color: #111417;
                font-size: 11px; font-weight: 600; letter-spacing: 0.15em; text-decoration: none;
                text-transform: uppercase; margin-top: 8px; cursor: pointer;">
        OPEN IN SYRKA →
      </a>
    </div>`;

  const container = document.getElementById('course-section');
  let resultsDiv = document.getElementById('skills-analysis-results');
  if (!resultsDiv) {
    resultsDiv = document.createElement('div');
    resultsDiv.id = 'skills-analysis-results';
    container.appendChild(resultsDiv);
  }
  resultsDiv.innerHTML = html;

  btn.textContent = 'Analysis Complete';
});

// Evolve to AI-Native — inline, no fetch
document.getElementById('evolve-course-btn').addEventListener('click', () => {
  const btn = document.getElementById('evolve-course-btn');
  btn.disabled = true;
  btn.textContent = 'Not available offline';
  setTimeout(() => {
    btn.disabled = false;
    btn.textContent = 'Evolve to AI-Native';
  }, 2000);
});

// Add to Syrka Pipeline — sync to server, fall back to local
document.getElementById('add-pipeline-btn').addEventListener('click', async () => {
  const btn = document.getElementById('add-pipeline-btn');
  btn.disabled = true;
  btn.textContent = 'Syncing...';
  const jobData = state.data || {};

  let serverResponse = null;
  const { syrka_token } = await chrome.storage.local.get(['syrka_token']);
  if (syrka_token) {
    try {
      const res = await fetch('https://syrka.co/api/extension/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${syrka_token}`
        },
        body: JSON.stringify({
          type: 'job',
          data: {
            ...jobData,
            description: (jobData.description || '').substring(0, 2000),
            sourceUrl: window.location.href
          }
        })
      });
      serverResponse = await res.json();
    } catch {}
  }

  // Always save locally too
  const stored = await chrome.storage.local.get(['syrka_pipeline']);
  const pipelineArr = Array.isArray(stored.syrka_pipeline) ? stored.syrka_pipeline : [];
  pipelineArr.push({
    title: jobData.title,
    company: jobData.company,
    skills: jobData.skills,
    score: jobData.score,
    grade: jobData.grade,
    addedAt: new Date().toISOString(),
    sourceUrl: window.location.href,
    synced: !!serverResponse?.success
  });
  await chrome.storage.local.set({ syrka_pipeline: pipelineArr });

  btn.textContent = serverResponse?.success ? '✓ SYNCED TO SYRKA' : '✓ SAVED LOCALLY';

  // Show rejection pattern warning if returned
  if (serverResponse?.rejectionPatternWarning) {
    const { skills } = serverResponse.rejectionPatternWarning;
    const warningDiv = document.createElement('div');
    warningDiv.innerHTML = `
      <div style="padding:10px 14px;background:#2D1116;border-top:1px solid #3D1C1C;margin-top:8px;">
        <div style="font-size:9px;color:#F85149;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">
          &#9888; REJECTION PATTERN DETECTED
        </div>
        <div style="font-size:10px;color:#C9D1D9;margin-bottom:6px;">
          Your past rejections flagged these gaps. Work on these before applying:
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">
          ${skills.map(s => `<span style="font-size:9px;color:#F85149;background:#2D1116;padding:2px 6px;border:1px solid #3D1C1C;">${s}</span>`).join('')}
        </div>
      </div>
    `;
    document.getElementById('job-section').appendChild(warningDiv);
  }
});

// Generate Application — open Syrka student page with params, no fetch
document.getElementById('gen-app-btn').addEventListener('click', () => {
  const jobData = state.data || {};
  const params = new URLSearchParams({
    jobTitle: encodeURIComponent(jobData.title || ''),
    company: encodeURIComponent(jobData.company || ''),
    skills: encodeURIComponent((jobData.skills || []).join(',')),
    source: 'extension'
  });
  const url = `https://syrka.co/saudi/student?${params.toString()}`;
  window.open(url, '_blank');
});

// Outcome Logger toggle
document.getElementById('log-outcome-toggle').addEventListener('click', () => {
  const logger = document.getElementById('syrka-outcome-logger');
  if (logger.classList.contains('hidden')) {
    logger.classList.remove('hidden');
    logger.innerHTML = `
      <div style="padding:12px 14px;border-top:1px solid rgba(71,71,71,0.15);">
        <div style="font-size:9px;color:#484F58;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">
          LOG OUTCOME
        </div>
        <select id="syrka-outcome-status" style="width:100%;background:#1D2023;color:#fff;border:1px solid rgba(71,71,71,0.3);padding:6px 8px;font-size:11px;margin-bottom:6px;">
          <option value="applied">Applied</option>
          <option value="viewed">Viewed by recruiter</option>
          <option value="phone_screen">Phone screen</option>
          <option value="interview">Interview</option>
          <option value="offer">Offer received</option>
          <option value="rejected">Rejected</option>
          <option value="ghosted">Ghosted</option>
        </select>
        <input id="syrka-missing-skills" type="text" placeholder="Skills they asked about (comma-separated)"
               style="width:100%;background:#1D2023;color:#fff;border:1px solid rgba(71,71,71,0.3);padding:6px 8px;font-size:11px;margin-bottom:6px;box-sizing:border-box;"/>
        <button id="syrka-log-outcome" style="width:100%;background:#fff;color:#111417;padding:8px;font-size:10px;font-weight:700;border:none;cursor:pointer;letter-spacing:1px;text-transform:uppercase;">
          LOG TO SYRKA
        </button>
      </div>
    `;
    document.getElementById('syrka-log-outcome').addEventListener('click', submitOutcome);
  } else {
    logger.classList.add('hidden');
    logger.innerHTML = '';
  }
});

async function submitOutcome() {
  const status = document.getElementById('syrka-outcome-status').value;
  const missingRaw = document.getElementById('syrka-missing-skills').value;
  const skillsTheyAskedAbout = missingRaw.split(',').map(s => s.trim()).filter(Boolean);

  const { syrka_token, syrka_user_id } = await chrome.storage.local.get(['syrka_token', 'syrka_user_id']);

  if (!syrka_token) {
    document.getElementById('syrka-outcome-logger').innerHTML = `
      <div style="padding:12px 14px;text-align:center;">
        <a href="https://syrka.co/saudi/student" target="_blank"
           style="font-size:10px;color:#C9D1D9;text-decoration:none;">Sign in to Syrka first &rarr;</a>
      </div>
    `;
    return;
  }

  const btn = document.getElementById('syrka-log-outcome');
  btn.disabled = true;
  btn.textContent = 'Logging...';

  try {
    const res = await fetch('https://syrka.co/api/students/outcomes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${syrka_token}`
      },
      body: JSON.stringify({
        userId: syrka_user_id,
        jobTitle: window.syrkaJobData?.title || 'Unknown',
        company: window.syrkaJobData?.company || 'Unknown',
        status,
        skillsTheyAskedAbout,
        skillsILacked: skillsTheyAskedAbout
      })
    });

    const result = await res.json();

    if (result.learningSignal) {
      const signal = result.learningSignal;
      document.getElementById('syrka-outcome-logger').innerHTML = `
        <div style="padding:12px 14px;background:#0D2215;border-top:1px solid #1C3526;">
          <div style="font-size:9px;color:#3FB950;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">
            &#10003; LEARNING SIGNAL GENERATED
          </div>
          <div style="font-size:11px;font-weight:700;color:#fff;margin-bottom:4px;">
            ${signal.priority_skill_to_learn || 'Focus updated'}
          </div>
          <div style="font-size:10px;color:#C9D1D9;margin-bottom:6px;">
            ${signal.why || ''}
          </div>
          <div style="font-size:9px;color:#484F58;">
            ${signal.estimated_days_to_competency ? signal.estimated_days_to_competency + ' days to competency' : ''}
          </div>
        </div>
      `;
    } else {
      document.getElementById('syrka-outcome-logger').innerHTML = `
        <div style="padding:12px 14px;background:#0D2215;border-top:1px solid #1C3526;">
          <div style="font-size:9px;color:#3FB950;letter-spacing:1px;text-transform:uppercase;">
            &#10003; OUTCOME LOGGED
          </div>
        </div>
      `;
    }
  } catch {
    btn.textContent = 'Failed — try again';
    btn.disabled = false;
  }
}
