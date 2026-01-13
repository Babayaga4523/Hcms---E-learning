export default function showToast(message, type = 'info', duration = 3500) {
  const existing = document.getElementById('wondr-toast-container');
  let container = existing;
  if (!existing) {
    container = document.createElement('div');
    container.id = 'wondr-toast-container';
    container.style.position = 'fixed';
    container.style.top = '1rem';
    container.style.right = '1rem';
    container.style.zIndex = 9999;
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '0.5rem';
    document.body.appendChild(container);
  }

  const el = document.createElement('div');
  el.className = 'wondr-toast';
  el.textContent = message;
  el.style.padding = '10px 14px';
  el.style.borderRadius = '8px';
  el.style.color = '#fff';
  el.style.fontWeight = '600';
  el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
  el.style.opacity = '0';
  el.style.transform = 'translateY(-6px)';
  el.style.transition = 'opacity 240ms ease, transform 240ms ease';

  switch (type) {
    case 'success':
      el.style.background = '#005E54';
      break;
    case 'error':
      el.style.background = '#e11d48';
      break;
    case 'warning':
      el.style.background = '#f59e0b';
      el.style.color = '#002824';
      break;
    default:
      el.style.background = '#374151';
  }

  container.appendChild(el);

  // Force reflow to trigger transition
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(-6px)';
    setTimeout(() => el.remove(), 260);
  }, duration);
}
