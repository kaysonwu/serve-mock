import { MockFunctionValue, ResourceOptions } from '../../types';
import parser from '../parser';

export default function create(
  name: string,
  { rowKey, validator, responder, errorHandler }: ResourceOptions,
): MockFunctionValue {
  return (req, res, store) => {
    parser<Record<string, unknown>>(req)
      .then(data => {
        const records = store.get<Record<string, unknown>[]>(name, []);
        const record = validator(data, req, records, 'create');

        if (!Object.prototype.hasOwnProperty.call(record, rowKey) || !record[rowKey]) {
          record[rowKey] = records.reduce(
            (key, row) => (key !== Number(row[rowKey]) ? key : (row[rowKey] as number) + 1),
            records.length + 1,
          );
        }

        records.push(record);
        store.put(name, records);

        res.statusCode = 201;
        responder(req, res, record, 'create');
      })
      .catch(error => errorHandler(req, res, error));
  };
}
