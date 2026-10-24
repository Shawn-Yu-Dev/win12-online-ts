const root = document.documentElement;
const savedColor = localStorage.getItem('panic-color');
if (savedColor) root.style.setProperty('--panic-color', savedColor);

const complete = document.getElementById('complete');
const stopCode = document.getElementById('stopcode');

function updateComplete(): number {
  const value = Number.parseInt(complete?.textContent || '0', 10) + 1;
  if (complete) complete.textContent = String(value);
  return value;
}

function advance(): void {
  const value = Number.parseInt(complete?.textContent || '0', 10);
  if (value >= 100) {
    root.style.filter = 'brightness(0)';
    window.setTimeout(() => location.reload(), 2000);
    return;
  }
  const delay = value < 20 ? 300 : value < 60 ? 200 : value < 80 ? 100 : 50;
  window.setTimeout(() => {
    updateComplete();
    advance();
  }, delay);
}

const code = new URLSearchParams(location.search).get('code');
if (code && stopCode) stopCode.textContent = code;
advance();
