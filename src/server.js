import './util/globals';

import fs from 'fs';
import Http2 from 'spdy'; // eventually this will be a native node module

import appConfig from './util/config';
import getPlugins from './plugins';
import getRoutes from './routes';

import { configureEnv, server } from './util/serverUtils';

/**
 * @module server
 */

/**
 * The start function applies the rendering function to the correct application
 * route and combines the provided routes and plugins with the base routes
 * and plugins
 *
 * @param {Object} renderRequestMap A mapping of localeCodes to functions that emit
 *   the rendered HTML for the locale-specific request
 * @param {Array} routes additional routes for the app - cannot include a
 *   wildcard route
 * @param {Array} plugins additional plugins for the server, usually to support
 *   features in the additional routes
 * @return {Promise} the Promise returned by Hapi's `server.connection` method
 */
export default function start(
	renderRequestMap,
	{ routes = [], plugins = [], platform_agent = 'consumer_name' }
) {
	// source maps make for better stack traces
	// we might not want this in production if it makes anything slower
	require('source-map-support').install();

	configureEnv(appConfig);

	const baseRoutes = getRoutes(renderRequestMap);
	const finalRoutes = [...routes, ...baseRoutes];

	const connection = {
		host: '0.0.0.0',
		port: appConfig.app_server.port,
		routes: {
			plugins: {
				'electrode-csrf-jwt': {
					enabled: false,
				},
			},
		},
	};

	if (appConfig.app_server.protocol === 'https') {
		const listener = Http2.createServer({
			key: fs.readFileSync(appConfig.app_server.key_file),
			cert: fs.readFileSync(appConfig.app_server.crt_file),
		});

		connection.listener = listener;
		connection.tls = true;
	}

	const finalPlugins = [...plugins, ...getPlugins()];

	return server(
		finalRoutes,
		connection,
		finalPlugins,
		platform_agent,
		appConfig
	);
}
