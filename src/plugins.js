import Inert from 'inert';
import pino from 'pino';
import HapiPino from 'hapi-pino';
import CsrfPlugin from 'electrode-csrf-jwt';
import config from 'mwp-cli/src/config';

import logger from './util/logger';
import requestAuthPlugin from './plugins/requestAuthPlugin';
import activityPlugin from './plugins/tracking/activity';
import serviceWorkerPlugin from './plugins/service-worker';

/**
 * Hapi plugins for the dev server
 *
 * @module ServerPlugins
 */

export function setCsrfCookies(request, reply) {
	const csrfHeader = (request.response.headers || {})['x-csrf-jwt'];
	if (csrfHeader) {
		reply.state('x-csrf-jwt-header', csrfHeader);
	}
	return reply.continue();
}

/**
 * The CSRF plugin we use - 'electrode-csrf-jwt' compares a cookie token to a
 * header token in non-GET requests. By default, it will set the cookie token
 * itself ('x-csrf-jwt'), and supply the corresponding header token in a custom
 * header (also 'x-csrf-jwt'). However, we update this flow to also supply the
 * header token as a cookie ('x-csrf-jwt-header') so that it syncs across
 * browser tabs.
 *
 * In order to ensure that both cookie values have parallel settings, this
 * function calls `server.state` for both cookie names before registering the
 * plugin.
 *
 * @return {Object} the { register } object for a `server.register` call.
 */
export function getCsrfPlugin() {
	const register = (server, options, next) => {
		const cookieOptions = {
			path: '/',
			isSecure: server.settings.app.isProd,
		};

		options.secret = server.settings.app.csrf_secret;

		server.state(
			'x-csrf-jwt', // set by plugin
			{ ...cookieOptions, isHttpOnly: true } // no client-side interaction needed
		);

		server.state(
			'x-csrf-jwt-header', // set by onPreResponse
			{ ...cookieOptions, isHttpOnly: false } // the client must read this cookie and return as a custom header
		);

		const registration = CsrfPlugin.register(server, options, next);
		server.ext('onPreResponse', setCsrfCookies); // this extension must be registered _after_ plugin is registered

		return registration;
	};

	register.attributes = CsrfPlugin.register.attributes;

	return {
		register,
	};
}

/**
 * configure and return the plugin that
 * allows requests to get anonymous oauth tokens
 * to communicate with the API
 */
export function getRequestAuthPlugin() {
	return {
		register: requestAuthPlugin,
	};
}

export function getLogger(
	options = { logEvents: ['onPostStart', 'onPostStop', 'response'] }
) {
	const onRequestError = (request, err) => {
		console.error(
			JSON.stringify({
				err,
				res: pino.stdSerializers.asResValue(request.raw.res),
				message: `500 Internal server error: ${err.message}`,
			})
		);
	};
	const register = (server, options, next) => {
		server.on('request-error', onRequestError);
		return HapiPino(server, options, next);
	};

	options.instance = logger;
	return {
		register,
		options,
	};
}

function getActivityTrackingPlugin({ agent, isProd }) {
	return {
		register: activityPlugin,
		options: {
			agent,
			isProd,
		},
	};
}

function getServiceWorkerPlugin() {
	return {
		register: serviceWorkerPlugin,
	};
}

export default function getPlugins() {
	const { package: { agent }, env: { properties: { isProd } } } = config;
	return [
		getLogger(),
		getCsrfPlugin(),
		getRequestAuthPlugin(),
		getActivityTrackingPlugin({ agent, isProd }),
		getServiceWorkerPlugin(),
		Inert,
	];
}
