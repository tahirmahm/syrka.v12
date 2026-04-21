document.getElementById('extract-btn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  const results = document.getElementById('results');

  status.textContent = 'Analyzing...';

  try {
    // Send message to content script to get data
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extract' });

    // Send data to backend
    const apiResponse = await fetch('http://localhost:3001/api/skills/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: JSON.stringify(response), type: response.type })
    });

    const data = await apiResponse.json();
    results.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    status.textContent = 'Analysis Complete';
  } catch (error) {
    status.textContent = 'Error: ' + error.message;
  }
});
