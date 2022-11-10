import { parse } from 'qs';
import { MockFunctionValue, ResourceOptions } from '../../types';

export default function list(
  name: string,
  { initialData, filter, pagination, normalize, takeKey }: ResourceOptions,
): MockFunctionValue {
  return (req, res, store) => {
    const query = parse(req.url!.split('?', 2)[1]);
    const records = store.get(name, initialData);
    const filtered = filter(records, query, req);

    if (records === initialData) {
      store.put(name, initialData);
    }

    res.statusCode = 200;

    return normalize(
      takeKey && takeKey in query && parseInt(query[takeKey] as string, 10) === 1
        ? filtered.shift()!
        : pagination(filtered, query),
      'index',
    );
  };
}
