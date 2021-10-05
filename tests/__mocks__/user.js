export default {
  'PUT/PATCH /api/users': { status: 201 },
  'post /api/users': 'success',
  'GET /api/users/:id': (req, res, store) => {
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    res.write(JSON.stringify({ id: 1, name: 'zhangsan' }));
    return res.end;
  },
};
