module.exports = {
  'GET /api/currentUser': { id: 1, name: 'zhangsan' },
  'GET /api/error': () => {
    throw new Error('error');
  },
};
