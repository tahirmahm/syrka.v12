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

document.getElementById('analyse-skills-btn').addEventListener('click', () => {
  analyseSkillsGap();
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

function analyseSkillsGap() {
  const btn = document.getElementById('analyse-skills-btn');
  btn.textContent = 'ANALYSING...';
  btn.disabled = true;
  btn.style.opacity = '0.5';

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
  };

  const VISION_SKILLS = [
    'Economic Analysis', 'Policy Evaluation', 'Data Analysis',
    'Statistical Thinking', 'Public Administration', 'Research Methods',
    'Project Management', 'Analytical Reasoning'
  ];

  const modules = (state.data && state.data.modules) || [];
  const extractedSet = new Set();
  modules.forEach(mod => {
    const lower = mod.toLowerCase();
    Object.keys(SKILL_MAP).forEach(key => {
      if (lower.includes(key)) {
        SKILL_MAP[key].forEach(skill => extractedSet.add(skill));
      }
    });
  });
  const extractedSkills = Array.from(extractedSet);

  const aligned = VISION_SKILLS.filter(s => extractedSet.has(s));
  const gaps = VISION_SKILLS.filter(s => !extractedSet.has(s));

  setTimeout(() => {
    const section = document.getElementById('course-section');
    const heading = section.querySelector('h3');
    const courseInfo = document.getElementById('course-info');

    courseInfo.innerHTML = '';
    btn.remove();

    heading.textContent = 'SKILLS ANALYSIS';

    // Extracted Skills
    const skillsLabel = document.createElement('p');
    skillsLabel.className = 'label';
    skillsLabel.textContent = 'EXTRACTED SKILLS';
    courseInfo.appendChild(skillsLabel);

    const skillsPills = document.createElement('div');
    skillsPills.className = 'pills';
    skillsPills.style.marginBottom = '20px';
    if (extractedSkills.length === 0) {
      const none = document.createElement('p');
      none.className = 'small';
      none.textContent = 'No skills matched from modules.';
      courseInfo.appendChild(none);
    } else {
      extractedSkills.forEach(skill => {
        const pill = document.createElement('span');
        pill.className = 'pill';
        pill.textContent = skill;
        skillsPills.appendChild(pill);
      });
    }
    courseInfo.appendChild(skillsPills);

    // Vision Alignment
    const alignLabel = document.createElement('p');
    alignLabel.className = 'label';
    alignLabel.textContent = 'VISION ALIGNMENT';
    courseInfo.appendChild(alignLabel);

    const alignList = document.createElement('div');
    alignList.style.margin = '8px 0 20px 0';
    VISION_SKILLS.forEach(skill => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:4px 0;font-size:13px;';
      const isAligned = aligned.includes(skill);
      const icon = document.createElement('span');
      icon.textContent = isAligned ? '✓' : '—';
      icon.style.cssText = `color:${isAligned ? '#FFFFFF' : '#474747'};font-weight:700;width:16px;`;
      const name = document.createElement('span');
      name.textContent = skill;
      name.style.color = isAligned ? '#E1E2E6' : '#919191';
      row.appendChild(icon);
      row.appendChild(name);
      alignList.appendChild(row);
    });
    courseInfo.appendChild(alignList);

    // Skill Gaps
    const gapLabel = document.createElement('p');
    gapLabel.className = 'label';
    gapLabel.textContent = 'SKILL GAPS';
    courseInfo.appendChild(gapLabel);

    const gapPills = document.createElement('div');
    gapPills.className = 'pills';
    gapPills.style.marginBottom = '24px';
    if (gaps.length === 0) {
      const full = document.createElement('p');
      full.className = 'small';
      full.textContent = 'Full Vision coverage from this course.';
      courseInfo.appendChild(full);
    } else {
      gaps.forEach(skill => {
        const pill = document.createElement('span');
        pill.className = 'pill';
        pill.style.cssText = 'border-color:rgba(255,180,171,0.4);color:#FFB4AB;';
        pill.textContent = skill;
        gapPills.appendChild(pill);
      });
    }
    courseInfo.appendChild(gapPills);

    // Open in Syrka button
    const openBtn = document.createElement('button');
    openBtn.className = 'primary-btn';
    openBtn.textContent = 'Open in Syrka';
    openBtn.style.width = '100%';
    openBtn.addEventListener('click', () => {
      window.open('https://syrka.co/saudi/student', '_blank');
    });
    courseInfo.appendChild(openBtn);
  }, 1500);
}

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
