import { MockFunctionValue, ResourceOptions } from '../../types';
import create from './create';
import list from './list';
import remove from './remove';
import show from './show';
import update from './update';

const validator = ((data, _, __, type) =>
  type === 'delete'
    ? undefined
    : (data as Record<string, unknown>)) as ResourceOptions['validator'];

const filter: ResourceOptions['filter'] = (data, query) => {
  const keys = Object.keys(query);
  return data.filter(row =>
    keys.every(key => !Object.prototype.hasOwnProperty.call(row, key) || query[key] === row[key]),
  );
};

const pagination: ResourceOptions['pagination'] = (data, query) => {
  if (!Object.prototype.hasOwnProperty.call(query, 'page')) {
    return data;
  }

  const current = Math.max(1, Number(query.page));
  const pageSize = Math.max(1, Number(query.pageSize || query.page_size || 15));

  const start = (current - 1) * pageSize;
  const end = start + pageSize;

  return {
    data: data.slice(start, end),
    pagination: {
      current,
      pageSize,
      total: data.length,
    },
  };
};

const normalize: ResourceOptions['normalize'] = data => data;

export default function resource<T = Record<string, unknown>>(
  name: string,
  options: Partial<ResourceOptions<T>> = {},
): Record<string, MockFunctionValue> {
  const { only: actions = ['index', 'create', 'show', 'update', 'delete'], except = [] } = options;
  const mergedOptions = {
    rowKey: 'id',
    initialData: [],
    validator,
    filter,
    pagination,
    normalize,
    ...options,
  } as ResourceOptions;

  const uri = `/${name.replace(/^\/|\/$/g, '')}`;
  const mock: Record<string, MockFunctionValue> = {};

  if (actions.includes('create') && !except.includes('create')) {
    mock[`POST ${uri}`] = create(uri, mergedOptions);
  }

  if (actions.includes('update') && !except.includes('update')) {
    mock[`PUT ${uri}/:id`] = update(uri, mergedOptions);
  }

  if (actions.includes('index') && !except.includes('index')) {
    mock[`GET ${uri}`] = list(uri, mergedOptions);
  }

  if (actions.includes('show') && !except.includes('show')) {
    mock[`GET ${name}/:id`] = show(uri, mergedOptions);
  }

  if (actions.includes('delete') && !except.includes('delete')) {
    mock[`DELETE ${uri}/:id`] = remove(uri, mergedOptions);
  }

  return mock;
}
