const hostname = location.hostname;
const isLocal = ['localhost', '127.0.0.1', '::1', ''].includes(hostname);
const isNetlify = hostname.endsWith('.netlify.app');
const redirectUrl =
  isLocal || isNetlify ? './boot.html' : 'https://win12-online.github.io';
const redirectLink = document.getElementById(
  'redirect-link',
) as HTMLAnchorElement | null;

if (redirectLink) {
  redirectLink.href = redirectUrl;
  redirectLink.textContent = redirectUrl;
}

location.replace(redirectUrl);
