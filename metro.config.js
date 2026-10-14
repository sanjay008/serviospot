const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const nested = path.resolve(__dirname, 'serviospot2');
const escaped = nested.replace(/[/\\]/g, '[/\\\\]');
config.resolver.blockList = [new RegExp(`^${escaped}[/\\\\].*$`)];

module.exports = config;
