import { MockFunctionValue, ResourceOptions } from '../../types';
import { getKeyFromUrl } from '../getKeyFromUrl';

export default function show(
  name: string,
  { rowKey, normalize }: ResourceOptions,
): MockFunctionValue {
  return (req, res, store) => {
    const key = getKeyFromUrl(req.url!);
    const record = store
      .get<Record<string, unknown>[]>(name, [])
      .find(row => String(row[rowKey]) === key);

    if (!record) {
      res.statusCode = 404;
      return res.end();
    }

    res.statusCode = 200;

    return normalize(record, 'show');
  };
}
