import { parse } from 'url';
import { MockFunctionValue, ResourceOptions } from '../../types';

export default function list(
  name: string,
  { initialData, filter, pagination, responder }: ResourceOptions,
): MockFunctionValue {
  return (req, res, store) => {
    const { query } = parse(req.url as string, true);
    const records = store.get(name, initialData);

    if (records === initialData) {
      store.put(name, initialData);
    }

    res.statusCode = 200;
    responder(req, res, pagination(filter(records, query, req), query), 'index');
  };
}
