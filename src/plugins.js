import CsrfPlugin from 'electrode-csrf-jwt';
import Good from 'good';
import requestAuthPlugin from './plugins/requestAuthPlugin';

/**
 * Hapi plugins for the dev server
 *
 * @module ServerPlugins
 */

export function getCsrfPlugin() {
	return {
		register: CsrfPlugin.register,
		options: {
			secret: 'shhhhh',
			expiresIn: 60 * 60,  // seconds
		}
	};
}

/**
 * Provides Hapi process monitoring and console logging
 *
 * @see {@link https://github.com/hapijs/good}
 */
export function getConsoleLogPlugin() {
	return {
		register: Good,
		options: {
			ops: false,  // no ops reporting (for now)
			reporters: {
				console: [
					{  // filter events with good-squeeze
						module: 'good-squeeze',
						name: 'Squeeze',
						args: [{
							error: '*',
							response: '*',
							request: '*',
							log: '*',
						}]
					}, {  // format with good-console
						module: 'good-console',
						args: [{
							format: 'YYYY-MM-DD HH:mm:ss.SSS',
						}]
					},
					'stdout'  // pipe to stdout
				]
			}
		}
	};
}

/**
 * configure and return the plugin that will allow requests to get anonymous
 * oauth tokens to communicate with the API
 */
export function getRequestAuthPlugin(options) {
	return {
		register: requestAuthPlugin,
		options,
	};
}

export default function getPlugins(config) {
	return [
		getCsrfPlugin(),
		getConsoleLogPlugin(),
		getRequestAuthPlugin(config),
	];
}

