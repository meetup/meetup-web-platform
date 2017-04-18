import fs from 'fs';
import Hapi from 'hapi';
import uuid from 'uuid';

import track from './tracking';
import clickTrackingReader from './clickTrackingReader';
import config from './util/config';

/**
 * determine whether a nested object of values contains a string that contains
 * `.dev.meetup.`
 * @param {String|Object} value string or nested object with
 * values that could be URL strings
 * @return {Boolean} whether the `value` contains a 'dev' URL string
 */
export const isDev = config.get('env') === 'development';

export function onRequestExtension(request, reply) {
	request.id = uuid.v4();

	console.log(JSON.stringify({
		message: `Incoming request ${request.method.toUpperCase()} ${request.url.href}`,
		type: 'request',
		direction: 'in',
		info: {
			url: request.url,
			method: request.method,
			headers: request.headers,
			id: request.id,
			referrer: request.info.referrer,
			remoteAddress: request.info.remoteAddress,
		}
	}));

	return reply.continue();
}

export function onPreHandlerExtension(request, reply) {
	clickTrackingReader(request, reply);
	return reply.continue();
}

export function onResponse(request) {
	logResponse(request);
	if (request.app.upload) {
		fs.unlink(request.app.upload, err => {
			if (err) {
				console.error(JSON.stringify({
					message: 'Could not delete uploaded file',
					info: request.app.upload,
				}));
			}
		});
	}
}

export function logResponse(request) {
	const {
		headers,
		id,
		info,
		method,
		response,
		url,
	} = request;

	if (response.isBoom) {
		// response is an Error object
		console.error(JSON.stringify({
			message: `Internal error ${response.message} ${url.pathname}`,
			info: {
				error: response.stack,
				headers,
				id,
				method,
				url,
			},
		}));
		return;
	}

	const log = response.statusCode >= 400 && console.error ||
		response.statusCode >= 300 && console.warn ||
		console.log;

	log(JSON.stringify({
		message: `Outgoing response ${method.toUpperCase()} ${url.pathname} ${response.statusCode}`,
		type: 'response',
		direction: 'out',
		info: {
			headers: response.headers,
			id,
			method,
			referrer: info.referrer,
			remoteAddress: info.remoteAddress,
			time: info.responded - info.received,
			url,
		}
	}));

	return;
}

/**
 * Use server.ext to add functions to request/server extension points
 * @see {@link https://hapijs.com/api#request-lifecycle}
 * @param {Object} server Hapi server
 * @return {Object} Hapi server
 */
export function registerExtensionEvents(server) {
	server.ext([{
		type: 'onRequest',
		method: onRequestExtension,
	}, {
		type: 'onPreHandler',
		method: onPreHandlerExtension,
	}]);
	server.on('response', onResponse);
	return server;
}

/**
 * server-starting function
 */
export function server(routes, connection, plugins, platform_agent) {
	const server = new Hapi.Server();


	// store runtime state
	// https://hapijs.com/api#serverapp
	server.app = {
		isDevConfig: isDev,  // indicates dev API or prod API
		...config.getProperties()
	};
	server.decorate('reply', 'track', track(platform_agent));

	const appConnection = server.connection(connection);
	return appConnection
		.register(plugins)
		.then(() => registerExtensionEvents(server))
		.then(() => server.auth.strategy('default', 'oauth', true))
		.then(() => server.log(['start'], `${plugins.length} plugins registered, assigning routes...`))
		.then(() => appConnection.route(routes))
		.then(() => server.log(['start'], `${routes.length} routes assigned, starting server...`))
		.then(() => server.start())
		.then(() => server.log(['start'], `Dev server is listening at ${server.info.uri}`))
		.then(() => server);
}

