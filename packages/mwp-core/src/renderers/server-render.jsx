// @flow
import type { Reducer } from 'redux';
import React from 'react';
import Helmet from 'react-helmet';
import { renderToStringWithData } from 'react-apollo';
import MobileDetect from 'mobile-detect';
import isBot from 'isbot';

import { API_ROUTE_PATH } from 'mwp-api-proxy-plugin';
import { Forbidden, NotFound, Redirect, SERVER_RENDER } from 'mwp-router';
import { getFindMatches, resolveAllRoutes } from 'mwp-router/lib/util';
import { getServerCreateStore } from 'mwp-store/lib/server';
import Dom from 'mwp-app-render/lib/components/Dom';
import getClient from 'mwp-app-render/lib/util/getClient';
import ServerApp from 'mwp-app-render/lib/components/ServerApp';
import { parseMemberCookie } from 'mwp-core/lib/util/cookieUtils';
import { getRemoteGeoLocation } from 'mwp-core/lib/util/requestUtils';

import {
	getVariants,
	parseBrowserIdCookie,
	parseSiftSessionCookie,
	parsePreferredTimeZoneCookie,
} from '../util/cookieUtils';
import getRedirect from '../util/getRedirect';

const DOCTYPE = '<!DOCTYPE html>';

/**
 * An async module that renders the full app markup for a particular URL/location
 * using [ReactDOMServer]{@link https://facebook.github.io/react/docs/top-level-api.html#reactdomserver}
 *
 * @module ServerRender
 */

function getHtml(el) {
	// const htmlMarkup = ReactDOMServer.renderToString(el);
	// return `${DOCTYPE}${htmlMarkup}`;
	return renderToStringWithData(el).then(htmlMarkup => {
		return `${DOCTYPE}${htmlMarkup}`;
	});
}

/*
 * A helper to collect react-side-effect data from all components in the
 * application that utilize side effects
 *
 * Any component class that uses react-side-effect should be 'rewound' in this
 * function to prevent memory leaks and invalid state carrying over into other
 * requests
 */
const resolveSideEffects = () => ({
	head: Helmet.rewind(),
	redirect: Redirect.rewind(),
	forbidden: Forbidden.rewind(),
	notFound: NotFound.rewind(),
});

/**
 * Get media from X-UA-Device header set by Fastly which parses the user agent string
 */
const getMedia = (userAgent: string, userAgentDevice: string) => {
	const isAtSmallUp = true;
	let isMobile = true;
	let isTablet = false;

	if (userAgentDevice) {
		isMobile =
			userAgentDevice === 'smartphone' ||
			userAgentDevice === 'mobilebot' ||
			userAgentDevice === 'mobile';
		isTablet = userAgentDevice === 'tablet';
	} else {
		const mobileDetect = new MobileDetect(userAgent);
		isMobile = Boolean(mobileDetect.phone());
		isTablet = Boolean(mobileDetect.tablet());
	}

	return {
		isAtSmallUp,
		isAtMediumUp: isTablet || !isMobile,
		isAtLargeUp: !isMobile && !isTablet,
	};
};

// get initial server-rendered app metadata that can be consumed by the application
// from mwp-app-render/src/components/AppContext.Consumer
const getAppContext = (request: HapiRequest, enableServiceWorker: boolean) => {
	const { url, headers, info, server, state } = request;
	// request protocol and host might be different from original request that hit proxy
	// we want to use the proxy's protocol and host
	const requestProtocol = headers['x-forwarded-proto'] || server.info.protocol;
	const domain: string =
		headers['x-forwarded-host'] || headers['x-meetup-host'] || info.host;
	const clientIp =
		request.query.__set_geoip ||
		headers['fastly-client-ip'] ||
		info.remoteAddress;
	const host = `${requestProtocol}://${domain}`;
	const userAgent = headers['user-agent'];
	const userAgentDevice = headers['x-ua-device'] || ''; // set by fastly
	const requestLanguage = request.getLanguage();

	return {
		apiUrl: API_ROUTE_PATH,
		baseUrl: host,
		basename: requestLanguage === 'en-US' ? '' : `/${requestLanguage}`, // basename is the 'base path' for the application - usually a localeCode
		enableServiceWorker,
		requestLanguage,
		supportedLangs: server.settings.app.supportedLangs,
		initialNow: new Date().getTime(),
		isProdApi: server.settings.app.api.isProd,
		isQL: parseMemberCookie(state).ql === 'true',
		memberId: parseMemberCookie(state).id, // deprecated, use member.id
		// the member cookie is not structured the same way as the member object returned from /member/self
		// be careful relying on it to have the same properties downstream
		member: parseMemberCookie(state),
		geo: getRemoteGeoLocation(request),
		variants: getVariants(state),
		entryPath: url.pathname, // the path that the user entered the app on
		media: getMedia(userAgent, userAgentDevice),
		browserId: parseBrowserIdCookie(state),
		clientIp,
		siftSessionId: parseSiftSessionCookie(state),
		isBot: isBot(request.headers['user-agent']),
		preferredTimeZone: parsePreferredTimeZoneCookie(state),
	};
};

/**
 * Using the current route information and Redux store, render the app to an
 * HTML string and server response code, with optional cookies to write
 */

const getRouterRenderer = async ({
	request,
	h,
	appContext,
	routes,
	store,
	scripts,
	cssLinks,
	client,
}): Promise<RenderResult> => {
	// pre-render the app-specific markup, this is the string of markup that will
	// be managed by React on the client.
	//
	// **IMPORTANT**: this string is built separately from `<Dom />` because it
	// initializes page-specific state that `<Dom />` needs to render, e.g.
	// `<head>` contents
	const initialState = store.getState();
	let appMarkup;
	const routerContext: {
		url?: string,
		permanent?: boolean,
	} = {};

	try {
		appMarkup = await renderToStringWithData(
			<ServerApp
				client={client}
				request={request}
				h={h}
				appContext={appContext}
				routerContext={routerContext}
				store={store}
				routes={routes}
			/>
		);
	} catch (err) {
		// cleanup all react-side-effect components to prevent error/memory leaks
		resolveSideEffects();
		// now we can re-throw and let the caller handle the error
		throw err;
	}

	const sideEffects = resolveSideEffects();

	const externalRedirect = getRedirect(sideEffects.redirect);
	const internalRedirect = getRedirect(routerContext);
	const redirect = internalRedirect || externalRedirect;

	if (redirect) {
		return redirect;
	}

	// cssLinks can be an Array or a Function that returns an array
	if (typeof cssLinks === 'function') {
		// invoke function and provide initialState
		cssLinks = cssLinks(initialState);
	}

	// all the data for the full `<html>` element has been initialized by the app
	// so go ahead and assemble the full response body
	const result = await getHtml(
		<Dom
			head={sideEffects.head}
			initialState={initialState}
			appContext={appContext}
			appMarkup={appMarkup}
			scripts={scripts}
			cssLinks={cssLinks}
		/>
	);

	// prioritized status code fallbacks
	const statusCode = sideEffects.forbidden || sideEffects.notFound || 200;

	return {
		statusCode,
		result,
	};
};

/**
 * Curry a function that takes a Hapi request and returns a Promise
 * that will emit the rendered HTML
 *
 * The outer function takes app-specific information about the routes,
 * reducer, and optional additional middleware
 */
const makeRenderer = (renderConfig: {
	routes: Array<Object>,
	reducer: Reducer<MWPState, FluxStandardAction>,
	middleware: Array<Function>,
	scripts: Array<string>,
	enableServiceWorker: boolean,
	cssLinks: ?(Array<string> | (MWPState => Array<string>)),
}) => {
	const {
		routes,
		reducer,
		middleware,
		scripts,
		cssLinks,
		enableServiceWorker,
	} = renderConfig;
	// set up a Promise that emits the resolved routes - this single Promise will
	// be reused for all subsequent requests, so we're not resolving the routes repeatedly
	// hooray performance
	const routesPromise = resolveAllRoutes(routes);
	return (request: HapiRequest, h: HapiResponseToolkit): Promise<RenderResult> => {
		if (!scripts.length) {
			throw new Error('No client script assets specified');
		}

		const client = getClient(true);
		const appContext = getAppContext(request, enableServiceWorker);

		// create the store with populated `config`
		const initializeStore = resolvedRoutes => {
			const createStore = getServerCreateStore(
				getFindMatches(resolvedRoutes, appContext.basename),
				middleware || [],
				request
			);
			const initialState = { config: appContext };
			return Promise.resolve(createStore(reducer, initialState));
		};

		const populateStore = store =>
			new Promise(resolve => {
				// dispatch SERVER_RENDER to kick off API middleware
				const { pathname, search, hash } = request.url;
				const location = { pathname, search, hash };
				store.dispatch({ type: SERVER_RENDER, payload: location });

				resolve(store);
			});

		return routesPromise.then(resolvedRoutes =>
			initializeStore(resolvedRoutes).then(store => {
				return populateStore(store).then(store => {
					return getRouterRenderer({
						request,
						h,
						appContext,
						routes: resolvedRoutes,
						store,
						scripts,
						cssLinks,
						client,
					});
				});
			})
		);
	};
};

export default makeRenderer;
