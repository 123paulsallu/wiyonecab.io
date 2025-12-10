const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Prefer CommonJS `main` entry so Metro can resolve packages that ship ESM `module` fields
// that Metro can't handle. This helps packages like @supabase/auth-js which provide
// both `main` and `module` builds.
config.resolver = config.resolver || {};
config.resolver.resolverMainFields = ['main', 'module'];

module.exports = config;
