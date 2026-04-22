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
  ingestData();
});

document.getElementById('evolve-course-btn').addEventListener('click', async () => {
  const btn = document.getElementById('evolve-course-btn');
  btn.disabled = true;
  btn.textContent = 'Evolving...';

  try {
    const response = await fetch('http://localhost:3000/api/extension/evolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseName: state.data.courseName,
        modules: state.data.modules
      })
    });

    const result = await response.json();
    if (result.success) {
      const evo = result.evolution;
      document.getElementById('evolution-display').classList.remove('hidden');

      const readingList = document.getElementById('reading-list');
      readingList.innerHTML = '';
      evo.readingList.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        readingList.appendChild(li);
      });

      document.getElementById('evo-assignment').textContent = evo.assignment;
      document.getElementById('evo-path').textContent = evo.adaptivePath;
    } else {
      alert('Evolution failed: ' + (result.error || 'Unknown error'));
    }
  } catch (err) {
    console.error('Evolution error:', err);
    alert('Failed to connect to evolution API.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Evolve to AI-Native';
  }
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
