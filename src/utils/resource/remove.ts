import { MockFunctionValue, ResourceOptions } from '../../interface';
import { getKeysFromUrl } from '../getKeyFromUrl';

export default function remove(
  name: string,
  { rowKey, validator, errorHandler }: ResourceOptions,
): MockFunctionValue {
  return (req, res, store) => {
    try {
      const keys = getKeysFromUrl(req.url!);
      const records = store.get<Record<string, unknown>[]>(name, []);

      validator(keys, req, records, 'delete');

      store.put(
        name,
        records.filter(record => !keys.includes(String(record[rowKey]))),
      );
      res.statusCode = 204;
      res.end();
    } catch (error) {
      errorHandler(req, res, error as Error);
    }
  };
}
