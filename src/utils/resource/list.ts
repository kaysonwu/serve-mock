import { parse } from 'qs';
import { MockFunctionValue, ResourceOptions } from '../../types';

export default function list(
  name: string,
  { initialData, filter, pagination, normalize }: ResourceOptions,
): MockFunctionValue {
  return (req, res, store) => {
    const query = parse(req.url!.split('?', 2)[1]);
    const records = store.get(name, initialData);

    if (records === initialData) {
      store.put(name, initialData);
    }

    res.statusCode = 200;

    return normalize(pagination(filter(records, query, req), query), 'index');
  };
}
