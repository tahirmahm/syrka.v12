function extractJobData() {
  const title = document.querySelector('h1')?.textContent || '';
  const description = document.querySelector('.job-description')?.textContent || document.body.innerText;
  return { title, description, type: 'job' };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractJob') {
    const data = extractJobData();
    sendResponse(data);
  }
});
