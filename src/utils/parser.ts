import { IncomingMessage } from 'http';
import { parse as parseQuery } from 'querystring';

function parse(data: string, type: string): Record<string, unknown> | string {
  if (/[/+]json/i.test(type)) {
    return JSON.parse(data);
  }

  if (/x-www-form-urlencoded/i.test(type)) {
    return parseQuery(data);
  }

  return data;
}

export default function parser<T = Record<string, unknown> | string>(
  req: IncomingMessage,
  encoding = 'utf-8',
): Promise<T> {
  return new Promise((resolve, reject) => {
    let data = '';
    req
      .setEncoding(encoding)
      .on('data', chunk => (data += chunk))
      .on('end', () => resolve(parse(data, req.headers['content-type'] || '') as T))
      .on('error', reject);
  });
}
