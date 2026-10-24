export const server = 'http://win12server.freehk.svipss.top/';

export const pages: Record<string, string> = {
  'get-title': '',
};

export async function api(index: string, noBase = false): Promise<Response> {
  if (!noBase) index = 'https://api.github.com/' + index;
  const token = localStorage.getItem('token');
  if (!token) return fetch(index);
  const headers = new Headers();
  headers.append('Authorization', token);
  return fetch(index, { headers });
}
