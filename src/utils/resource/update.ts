import { MockFunctionValue, ResourceOptions } from '../../types';
import { getKeyFromUrl } from '../getKeyFromUrl';
import parser from '../parser';

export default function update(
  name: string,
  { rowKey, validator, normalize }: ResourceOptions,
): MockFunctionValue {
  return async (req, res, store) => {
    const key = getKeyFromUrl(req.url!);
    const records = store.get<Record<string, unknown>[]>(name, []);
    const index = records.findIndex(record => String(record[rowKey]) === key);

    if (index === -1) {
      res.statusCode = 404;
      return res.end();
    }

    const data = await parser<Record<string, unknown>>(req);
    const record = await validator(data, req, records, 'update');

    Object.assign(records[index], record);
    store.put(name, records);

    res.statusCode = 201;

    return normalize(records[index], 'update');
  };
}
