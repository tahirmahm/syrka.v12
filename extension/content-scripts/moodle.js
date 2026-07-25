// This script would normally be compiled from TypeScript
console.log('Syrka Content Script Loaded');

function extractMoodleData() {
  const courseName = document.querySelector('.page-header-headings h1')?.textContent || '';
  const modules = Array.from(document.querySelectorAll('.section .instancename')).map(el => el.textContent);
  return { courseName, modules, type: 'moodle' };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extract') {
    const data = window.location.href.includes('moodle') ? extractMoodleData() : {};
    sendResponse(data);
  }
});
