(function() {
  const host = document.createElement('div');
  host.id = 'syrka-sidebar-container';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });
  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('sidebar/sidebar.html');
  iframe.style.cssText = `
    position: fixed;
    top: 0;
    right: -400px;
    width: 400px;
    height: 100vh;
    border: none;
    z-index: 2147483647;
    transition: right 0.3s ease-out;
    background: #0D1117;
    box-shadow: -5px 0 15px rgba(0,0,0,0.5);
  `;

  const toggleBtn = document.createElement('button');
  toggleBtn.textContent = 'S';
  toggleBtn.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 2147483647;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #C9A84C;
    color: white;
    border: none;
    cursor: pointer;
    font-weight: bold;
  `;

  let isOpen = false;
  toggleBtn.onclick = () => {
    isOpen = !isOpen;
    iframe.style.right = isOpen ? '0' : '-400px';
  };

  shadow.appendChild(toggleBtn);
  shadow.appendChild(iframe);
})();
