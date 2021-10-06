import { MockFunctionValue, ResourceOptions } from '../../types';
import { getKeyFromUrl } from '../getKeyFromUrl';
import parser from '../parser';

export default function update(
  name: string,
  { rowKey, validator, responder, errorHandler }: ResourceOptions,
): MockFunctionValue {
  return (req, res, store) => {
    const key = getKeyFromUrl(req.url!);
    const records = store.get<Record<string, unknown>[]>(name, []);
    const index = records.findIndex(record => String(record[rowKey]) === key);

    if (index === -1) {
      res.statusCode = 404;
      res.end();
    } else {
      parser<Record<string, unknown>>(req)
        .then(data => {
          const record = validator(data, req, records, 'update');

          Object.assign(records[index], record);
          store.put(name, records);

          res.statusCode = 201;
          responder(req, res, records[index], 'update');
        })
        .catch(error => errorHandler(req, res, error));
    }
  };
}
