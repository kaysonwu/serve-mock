export default function requireModule<T = unknown>(filename: string, fresh?: boolean): T {
  if (fresh) {
    delete require.cache[require.resolve(filename)];
  }

  // eslint-disable-next-line import/no-dynamic-require, global-require, @typescript-eslint/no-var-requires
  const module = require(filename);

  // eslint-disable-next-line no-underscore-dangle
  if (module && module.__esModule) {
    return module.default;
  }

  return module;
}
