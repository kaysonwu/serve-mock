export default function requireModule(filename: string, fresh?: boolean) {
  if (fresh) {
    delete require.cache[require.resolve(filename)];
  }

  const module = require(filename);

  if (module && module.__esModule) {
    return module.default;
  }

  return module;
}
