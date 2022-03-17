import { MockFunctionValue, ResourceOptions } from '../../types';
import { getKeysFromUrl } from '../getKeyFromUrl';

export default function remove(
  name: string,
  { rowKey, validator }: ResourceOptions,
): MockFunctionValue {
  return async (req, res, store) => {
    const keys = getKeysFromUrl(req.url!);
    const records = store.get<Record<string, unknown>[]>(name, []);

    await validator(keys, req, records, 'delete');

    store.put(
      name,
      records.filter(record => !keys.includes(String(record[rowKey]))),
    );

    res.statusCode = 204;
    res.end();
  };
}
