// @flow

/**
 * Utilities for interacting with the Router and getting location data
 * @module routeUtils
 */

export const addComponentToRoute = (route: PlatformRoute) => (
	component: React$ComponentType<*>
): StaticPlatformRoute => {
	if (!route.getComponent) {
		return Object.freeze({ component, ...route });
	}
	// eslint-disable-next-line no-unused-vars
	const { getComponent, ...noGetCompRoute } = route;
	return Object.freeze({ component, ...noGetCompRoute });
};

// resolve the `component` property
const resolveComponent = (route: PlatformRoute): Promise<React$ComponentType<*>> => {
	if (route.getComponent) {
		return route.getComponent();
	}

	return Promise.resolve(route.component);
};

/*
 * Resolve the current route and all children
 *
 * *Note* DO NOT USE THIS IN THE BROWSER - it will eagerly resolve all async
 * components
 */
export const resolveRoute = (route: PlatformRoute): Promise<StaticPlatformRoute> =>
	Promise.all([
		resolveComponent(route),
		// $FlowFixMe - Flow doesn't realize the returned promise will be unwrapped
		resolveAllRoutes(route.routes || []),
		route.indexRoute ? resolveRoute(route.indexRoute) : Promise.resolve(null),
	]).then(
		([
			component: React$ComponentType<*>,
			routes: Array<StaticPlatformRoute>,
			indexRoute: ?StaticPlatformRoute,
		]): StaticPlatformRoute => {
			if (indexRoute) {
				return Object.freeze({
					...addComponentToRoute(route)(component),
					indexRoute,
					routes,
				});
			}
			return Object.freeze({
				...addComponentToRoute(route)(component),
				routes,
			});
		}
	);

export const resolveAllRoutes = (
	routes: Array<PlatformRoute>
): Promise<Array<StaticPlatformRoute>> => Promise.all(routes.map(resolveRoute));
