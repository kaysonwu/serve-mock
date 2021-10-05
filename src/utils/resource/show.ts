import { MockFunctionValue, ResourceOptions } from '../../interface';
import { getKeyFromUrl } from '../getKeyFromUrl';

export default function show(
  name: string,
  { rowKey, responder }: ResourceOptions,
): MockFunctionValue {
  return (req, res, store) => {
    const key = getKeyFromUrl(req.url!);
    const record = store
      .get<Record<string, unknown>[]>(name, [])
      .find(row => String(row[rowKey]) === key);

    if (!record) {
      res.statusCode = 404;
      res.end();
    } else {
      res.statusCode = 200;
      responder(req, res, record, 'show');
    }
  };
}
