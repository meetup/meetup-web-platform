import fetch from 'node-fetch';

// hello polyfills
global.URL = require('url').URL;
global.URLSearchParams = require('url').URLSearchParams;
global.fetch = fetch;
