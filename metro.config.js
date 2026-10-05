const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  const { resolver } = config;

  config.resolver = {
    ...resolver,
    assetExts: [...new Set([...resolver.assetExts, 'glb', 'gltf'])],
    // Fiber uses require(), while our scenes and Three addons use import.
    // Resolve both to the same module so materials and renderers share Three.
    resolveRequest(context, moduleName, platform) {
      if (moduleName === 'three') return { type: 'sourceFile', filePath: path.join(path.dirname(require.resolve('three')), 'three.module.js') };
      return context.resolveRequest(context, moduleName, platform);
    },
  };

  return config;
})();
