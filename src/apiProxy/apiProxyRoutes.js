import Joi from 'joi';
import { getApiProxyRouteHandler } from './apiProxyHandler';

const validApiPayloadSchema = Joi.object({
	queries: Joi.string().required(), // should be rison.encode_array-encoded
	metadata: Joi.string(),
	logout: Joi.any(),
});

const getApiProxyRoutes = (path, apiProxyFn$) => {
	/**
	 * This handler converts the application-supplied queries into external API
	 * calls, and converts the API call responses into a standard format that
	 * the application expects.
	 *
	 * @returns Array query responses, which are in the format defined
	 *   by `apiAdapter.apiResponseToQueryResponse`
	 */
	const routeBase = {
		path,
		handler: getApiProxyRouteHandler(apiProxyFn$),
		config: {
			plugins: {
				'electrode-csrf-jwt': {
					enabled: true,
				}
			},
			state: {
				failAction: 'ignore',  // ignore cookie validation, just accept
			},
		},
	};
	const apiGetRoute = {
		...routeBase,
		method: ['GET', 'DELETE', 'PATCH'],
		config: {
			...routeBase.config,
			validate: {
				query: validApiPayloadSchema
			},
		},
	};
	const apiPostRoute = {
		...routeBase,
		method: 'POST',
		config: {
			...routeBase.config,
			validate: {
				payload: validApiPayloadSchema
			},
		},
	};

	return [apiGetRoute, apiPostRoute];
};

export default getApiProxyRoutes;

