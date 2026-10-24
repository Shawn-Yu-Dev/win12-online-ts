import { resolveEntryRedirect } from '../core/redirect';

const redirectUrl = resolveEntryRedirect(location.search);
const redirectLink = document.getElementById(
  'redirect-link',
) as HTMLAnchorElement | null;

if (redirectLink) {
  redirectLink.href = redirectUrl;
  redirectLink.textContent = redirectUrl;
}

location.replace(redirectUrl);
