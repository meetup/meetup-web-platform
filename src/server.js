import https from 'https';

import './util/globals';
import config from './util/config';
import getPlugins from './plugins';
import getRoutes from './routes';

import { server } from './util/serverUtils';

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
	{ routes=[], plugins=[], platform_agent='consumer_name' }
) {
	// source maps make for better stack traces - might slow down prod?
	require('source-map-support').install();

	// When using .dev.meetup endpoints, ignore self-signed SSL cert
	https.globalAgent.options.rejectUnauthorized = config.get('isProd');

	const baseRoutes = getRoutes(renderRequestMap);
	const finalRoutes = [ ...routes, ...baseRoutes ];

	const connection = {
		host: '0.0.0.0',
		port: config.get('dev_server.port'),
		routes: {
			plugins: {
				'electrode-csrf-jwt': {
					enabled: false,
				}
			}
		}
	};

	const finalPlugins = [ ...plugins, ...getPlugins() ];

	return server(
		finalRoutes,
		connection,
		finalPlugins,
		platform_agent
	);
}

