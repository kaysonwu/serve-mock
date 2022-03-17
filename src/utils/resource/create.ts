import { MockFunctionValue, ResourceOptions } from '../../types';
import parser from '../parser';

export default function create(
  name: string,
  { rowKey, validator, normalize }: ResourceOptions,
): MockFunctionValue {
  return async (req, res, store) => {
    const data = await parser<Record<string, unknown>>(req);
    const records = store.get<Record<string, unknown>[]>(name, []);
    const record = await validator(data, req, records, 'create');

    if (!Object.prototype.hasOwnProperty.call(record, rowKey) || !record[rowKey]) {
      record[rowKey] = records.reduce(
        (key, row) => (key !== Number(row[rowKey]) ? key : (row[rowKey] as number) + 1),
        records.length + 1,
      );
    }

    records.push(record);
    store.put(name, records);

    res.statusCode = 201;

    return normalize(record, 'create');
  };
}
