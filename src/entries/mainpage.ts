import { resolveEdgeAddressInput } from '../scripts/edge-address';

const searchInput = document.querySelector<HTMLInputElement>('.input input');

interface ParentEdgeApp {
  rename?: (value: string) => void;
}

interface ParentAppsWindow extends Window {
  apps?: { edge?: ParentEdgeApp };
}

function renameAddress(value: string): void {
  try {
    const parentApps = (window.parent as ParentAppsWindow).apps;
    if (typeof parentApps?.edge?.rename === 'function') {
      parentApps.edge.rename(value);
    }
  } catch {}
}

function search(query: string): void {
  window.location.href =
    'https://bing.com/search?q=' + encodeURIComponent(query);
  renameAddress(query);
}

function navigate(value: string): void {
  const result = resolveEdgeAddressInput(value);
  if (result.type !== 'navigate') {
    search(value.trim());
    return;
  }
  window.location.href = result.url;
  renameAddress(result.url);
}

searchInput?.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  const value = searchInput.value.trim();
  if (!value) return;
  const result = resolveEdgeAddressInput(value);
  if (result.type === 'navigate') navigate(value);
  else search(value);
});
