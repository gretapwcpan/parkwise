const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Find and remove the ModuleScopePlugin
      const scopePlugin = webpackConfig.resolve.plugins.find(
          plugin => plugin.constructor.name === 'ModuleScopePlugin'
      );
      if (scopePlugin) {
          webpackConfig.resolve.plugins.splice(
              webpackConfig.resolve.plugins.indexOf(scopePlugin),
              1
          );
      }

      // Add a custom module resolution path to include the local node_modules
      webpackConfig.resolve.modules = [
          path.resolve(__dirname, 'node_modules'),
          'node_modules'
      ];
      
      // DISABLE REACT REFRESH COMPLETELY
      // Remove ReactRefreshWebpackPlugin
      webpackConfig.plugins = webpackConfig.plugins.filter(
        plugin => plugin.constructor.name !== 'ReactRefreshWebpackPlugin'
      );
      
      // Remove react-refresh from babel loader
      webpackConfig.module.rules.forEach(rule => {
        if (rule.oneOf) {
          rule.oneOf.forEach(loader => {
            if (loader.use && Array.isArray(loader.use)) {
              loader.use.forEach(use => {
                if (use.options && use.options.plugins) {
                  use.options.plugins = use.options.plugins.filter(
                    plugin => {
                      if (typeof plugin === 'string') {
                        return !plugin.includes('react-refresh');
                      }
                      if (Array.isArray(plugin) && plugin[0]) {
                        return !plugin[0].includes('react-refresh');
                      }
                      return true;
                    }
                  );
                }
              });
            }
          });
        }
      });

      return webpackConfig;
    },
  },
};
