import { parse } from 'url';

export function getKeyFromUrl(url: string): string {
  return parse(url)!.pathname!.split('/').pop()!;
}

export function getKeysFromUrl(url: string): string[] {
  const id = decodeURIComponent(getKeyFromUrl(url));

  if (id.includes(',')) {
    return id.split(',');
  }

  return [id];
}
