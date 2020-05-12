import { IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import { parse as parseQuery, ParsedUrlQuery } from 'querystring';
import { IMock, MockValue, MockFunctionValue } from './index';
import dispatch from './dispatch';

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function delay(value: MockValue, min: number, max?: number): MockFunctionValue {
  const ms = ((max && max > min) ? rand(min, max) : min);
  return function(req: IncomingMessage, res: ServerResponse) {
    setTimeout(() => {
      dispatch(value, req, res);
    }, ms);
  }
}

export function delays(mock: IMock, min: number, max?: number) {
  const results: Record<string, MockFunctionValue> = {};

  for (let key in mock) {
    results[key] = delay(mock[key], min, max);
  }

  return results;
}

function parseRequestData(data: string, type: string): ParsedUrlQuery {
  if (type.includes('json')) {
    return JSON.parse(data);
  }

  return parseQuery(data);
}

export function readyRequestData(
  req: IncomingMessage, 
  callback: (data: ParsedUrlQuery) => void,
  encoding: string = 'utf-8', 
) {
  let data = '';
  req.setEncoding(encoding);
  req.on('data', chunk => data += chunk)
  req.on('end', () => {
    callback(parseRequestData(data, `${req.headers['content-type']}`.toLowerCase()));
  });
}

export type ResourceAction = 'index' | 'create' | 'show' | 'update' | 'delete';

type ResourceOptions = {
  echo?: boolean;
  only?: ResourceAction[];
  except?: ResourceAction[];
  filter?: (records: any[], query: ParsedUrlQuery, req: IncomingMessage) => any;
  pagination?: (records: any[], query: ParsedUrlQuery) => any;
  validator?: (data: any, req: IncomingMessage, res: ServerResponse) => any;
  responder?: (req: IncomingMessage, res: ServerResponse, data: any, type: ResourceAction) => void;
};

function getResourceActions(options: ResourceOptions) {
  if (options.only) {
    return options.only;
  }

  const { except } = options;
  const actions: ResourceAction[] = ['index', 'create', 'show', 'update', 'delete'];

  if (except) {
    return actions.filter(action => !except.includes(action));
  }

  return actions;
}

function defaultPagination(records: any[], query: ParsedUrlQuery) {
  const { page } = query as any;

  if (!page) {
    return records;
  }

  const current = Math.max(1, page);
  const pageSize = Math.max(1, (query.pageSize ||  query.page_size || 15) as any);

  const start = (current - 1) * pageSize;
  const end = start + pageSize;

  return {
    data: records.slice(start, end),
    pagination: {
      current,
      pageSize,
      total: records.length,
    },
  };
}

function defaultFilter(records: any[], query: ParsedUrlQuery, req: IncomingMessage) {
  const data = records.filter(record => {
    for (let key in query) {
      if (Object.prototype.hasOwnProperty.call(record, key)
        && query[key] !== record[key]
      ) {
        return false;
      }
    }

    return true;
  });

  return data;
}

function defaultValidator(data: any) {
  return data;
}

export function defaultResponder(_: IncomingMessage, res: ServerResponse, data: any) {
  res.setHeader('Content-Type', 'application/json;charset=utf-8');
  res.write(JSON.stringify(data));
  res.end();
}

function getIdFromPath(url: string) {
  return parse(url)!.pathname.split('/').pop();
}

function getIdsFromPath(url: string) {
  const id = decodeURIComponent(getIdFromPath(url));

  if (id.includes(',')) {
    return id.split(',');
  }

  return [id];
}

export function resource(name: string, initialRecords: any[] = [], options: ResourceOptions = {}) {
  const uri = '/' + name.replace(/^\/|\/$/g, '');
  const actions = getResourceActions(options); 
  const { 
    echo, 
    filter = defaultFilter, 
    pagination = defaultPagination,
    validator = defaultValidator,
    responder = defaultResponder,
  } = options;
  
  const mock: Record<string, MockFunctionValue> = {};
  let records: any[] = initialRecords;

  if (actions.includes('create')) {
    mock[`POST ${uri}`] = (req, res) => {
      readyRequestData(req, data => {
        const record = validator(data, req, res);

        if (record === false) {
          return res.end();
        }

        if (!record.id) {
          record.id = records.reduce((id, c) => (c.id > id ? c.id + 1 : id), records.length + 1);
        }
        
        records.push(record);
        res.statusCode = 201;

        if (echo) {
          return responder(req, res, record, 'create');
        } 
        
        res.end();
      });
    }
  }

  if (actions.includes('update')) {
    mock[`PUT ${uri}/:id`] = (req, res) => {
      const id = getIdFromPath(req.url);
      const index = records.findIndex(d => String(d.id) === id);

      if (index === -1) {
        res.statusCode = 404;
        return res.end();
      }

      readyRequestData(req, data => {
        const record = validator(data, req, res);

        if (record === false) {
          return res.end();
        }
        
        records[index] = { 
          ...records[index],
          ...record,
        };
  
        res.statusCode = 201;

        if (echo) {
          return responder(req, res, records[index], 'update');
        }

        res.end();
      });  
    }
  }
 
  if (actions.includes('index')) {
    mock[`GET ${uri}`] = (req, res) => {
      const { query } = parse(req.url as string, true);
      const data = pagination(filter(records, query, req), query);

      res.statusCode = 200;
      responder(req, res, data, 'index');
    }
  }

  if (actions.includes('show')) {
    mock[`GET ${name}/:id`] = (req, res) => {
      const id = getIdFromPath(req.url);
      const record = records.find(d => String(d.id) === id);
    
      if (!record) {
        res.statusCode = 404;
        return res.end();
      }
  
      res.statusCode = 200;
      responder(req, res, record, 'show');
    }
  }
  
  if (actions.includes('delete')) {
    mock[`DELETE ${uri}/:id`] = (req, res) => {
      const ids = getIdsFromPath(req.url);
  
      records = records.filter(record => !ids.includes(String(record.id)));
  
      res.statusCode = 204;
      res.end();
    }
  }

  return mock;
}
