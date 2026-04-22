// Initial state
const state = {
  type: null,
  data: null,
  studentId: 'demo-student-id' // Placeholder
};

// Listen for data from content script
window.addEventListener('message', (event) => {
  if (event.data.type === 'PAGE_INTEL') {
    updateUI(event.data.intel);
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

function showCourse(data) {
  window.syrkaPageData = { courseName: data.courseName, modules: data.modules || [] };

  const section = document.getElementById('course-section');
  section.classList.remove('hidden');

  document.getElementById('course-name').textContent = data.courseName;

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
}

function showJob(data) {
  const section = document.getElementById('job-section');
  section.classList.remove('hidden');

  document.getElementById('job-title').textContent = data.title;
  document.getElementById('job-company').textContent = data.company;
  document.getElementById('job-salary').textContent = data.salary || 'Not specified';

  const skillsContainer = document.getElementById('job-skills');
  skillsContainer.innerHTML = '';
  data.skills.forEach(skill => {
    const pill = document.createElement('span');
    pill.className = 'pill';
    pill.textContent = skill;
    skillsContainer.appendChild(pill);
  });

  // Calculate Score
  const userPrefs = {
    expectedSalary: 100000,
    skills: ['React', 'TypeScript', 'Node.js', 'Next.js'],
    targetSeniority: 'Senior',
    preferredCompanySize: 'Large',
    preferredWorkType: 'Remote'
  };

  if (typeof calculateScore !== 'undefined') {
    const numericScore = calculateScore(data, userPrefs);
    const grade = getGrade(numericScore);
    const badge = document.getElementById('score-badge');
    badge.textContent = grade;
    state.data.score = grade;
  }
}

// Event Listeners for buttons
document.getElementById('close-btn').addEventListener('click', () => {
  window.parent.postMessage({ action: 'closePanel' }, '*');
});

document.getElementById('analyse-skills-btn').addEventListener('click', function() {
  const btn = this;
  btn.textContent = 'ANALYSING...';
  btn.disabled = true;
  btn.style.opacity = '0.5';

  const modules = window.syrkaPageData?.modules || [];
  const courseName = window.syrkaPageData?.courseName || 'This Course';

  const SKILL_MAP = {
    'introduction': ['Critical Thinking', 'Academic Research'],
    'economics': ['Economic Analysis', 'Data Interpretation', 'Policy Evaluation'],
    'policy': ['Policy Analysis', 'Regulatory Knowledge', 'Public Administration'],
    'resources': ['Information Literacy', 'Self-directed Learning'],
    'lecture': ['Analytical Reasoning', 'Academic Writing'],
    'seminar': ['Public Speaking', 'Debate', 'Argumentation'],
    'test': ['Examination Technique', 'Time Management'],
    'data': ['Data Analysis', 'Statistical Thinking'],
    'research': ['Research Methods', 'Academic Writing'],
    'management': ['Project Management', 'Organisational Skills'],
    'progress': ['Systems Thinking', 'Interdisciplinary Analysis'],
    'intervention': ['Policy Design', 'Impact Assessment'],
    'debate': ['Argumentation', 'Public Speaking', 'Critical Thinking'],
  };

  const VISION_SKILLS = [
    'Economic Analysis', 'Policy Evaluation', 'Data Analysis',
    'Statistical Thinking', 'Public Administration', 'Research Methods',
    'Project Management', 'Analytical Reasoning', 'Policy Design',
    'Impact Assessment', 'Systems Thinking'
  ];

  const extractedSkills = new Set();
  modules.forEach(mod => {
    const lower = mod.toLowerCase();
    Object.entries(SKILL_MAP).forEach(([key, skills]) => {
      if (lower.includes(key)) skills.forEach(s => extractedSkills.add(s));
    });
  });
  const courseNameLower = courseName.toLowerCase();
  Object.entries(SKILL_MAP).forEach(([key, skills]) => {
    if (courseNameLower.includes(key)) skills.forEach(s => extractedSkills.add(s));
  });

  const skillsArray = Array.from(extractedSkills);
  const aligned = skillsArray.filter(s => VISION_SKILLS.includes(s));
  const gaps = VISION_SKILLS.filter(s => !extractedSkills.has(s));

  setTimeout(() => {
    const panelBody = document.getElementById('course-info');
    btn.remove();

    const section = document.getElementById('course-section');
    const heading = section.querySelector('h3');
    heading.textContent = 'SKILLS ANALYSIS';

    panelBody.innerHTML = `
      <div style="padding:0;font-family:'Space Grotesk',sans-serif;">

        <div style="margin-bottom:16px;">
          <div style="font-size:9px;letter-spacing:1.5px;text-transform:uppercase;
                      color:#484F58;margin-bottom:8px;">EXTRACTED SKILLS</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${skillsArray.length > 0
              ? skillsArray.map(s => `
                <span style="background:#1D2023;border:1px solid rgba(71,71,71,0.3);
                             padding:3px 8px;font-size:10px;color:#fff;">${s}</span>
              `).join('')
              : '<span style="font-size:11px;color:#484F58;">No skills mapped from module names</span>'
            }
          </div>
        </div>

        <div style="margin-bottom:16px;">
          <div style="font-size:9px;letter-spacing:1.5px;text-transform:uppercase;
                      color:#484F58;margin-bottom:8px;">VISION ALIGNMENT</div>
          ${aligned.length > 0
            ? aligned.map(s => `
              <div style="display:flex;align-items:center;gap:8px;
                          padding:5px 0;border-bottom:1px solid rgba(71,71,71,0.15);
                          font-size:11px;color:#fff;">
                <span style="color:#3FB950;">&#10003;</span> ${s}
              </div>
            `).join('')
            : '<div style="font-size:11px;color:#484F58;">No direct Vision alignment found</div>'
          }
        </div>

        <div style="margin-bottom:20px;">
          <div style="font-size:9px;letter-spacing:1.5px;text-transform:uppercase;
                      color:#484F58;margin-bottom:8px;">SKILL GAPS</div>
          ${gaps.length > 0
            ? gaps.slice(0, 5).map(s => `
              <div style="display:flex;align-items:center;gap:8px;
                          padding:5px 0;border-bottom:1px solid rgba(71,71,71,0.15);
                          font-size:11px;color:#F85149;">
                &#8599; ${s}
              </div>
            `).join('')
            : '<div style="font-size:11px;color:#3FB950;">Full Vision coverage from this course.</div>'
          }
        </div>

        <a href="https://syrka.co/saudi/student" target="_blank"
           style="display:block;background:#fff;color:#111417;text-align:center;
                  padding:10px;font-size:11px;font-weight:700;letter-spacing:1px;
                  text-transform:uppercase;text-decoration:none;cursor:pointer;">
          OPEN IN SYRKA &rarr;
        </a>
      </div>
    `;
  }, 1500);
});

document.getElementById('add-pipeline-btn').addEventListener('click', () => {
  ingestData();
});

document.getElementById('gen-app-btn').addEventListener('click', () => {
  const params = new URLSearchParams({
    jobTitle: state.data.title,
    company: state.data.company,
    description: state.data.description
  });
  window.open(`https://syrka.co/student?${params.toString()}`, '_blank');
});


async function ingestData() {
  const API_ENDPOINT = 'http://localhost:3000/api/extension/ingest'; // Should be configurable

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: state.type,
        country: 'uk', // Default for now
        data: state.data,
        studentId: state.studentId
      })
    });

    const result = await response.json();
    if (result.success) {
      alert('Data successfully added to Syrka!');
    } else {
      alert('Error: ' + (result.error || 'Failed to ingest data'));
    }
  } catch (err) {
    console.error('Ingest failed:', err);
    alert('Failed to connect to Syrka backend. Is it running?');
  }
}
