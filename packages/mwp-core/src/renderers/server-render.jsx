// @flow
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/first';

import IntlPolyfill from 'intl';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import StaticRouter from 'react-router-dom/StaticRouter';

import Dom from '../components/dom';
import { Forbidden, NotFound, Redirect } from 'mwp-router';
import PlatformApp from '../components/PlatformApp';

import { API_ROUTE_PATH } from '../plugins/api-proxy';
import { getServerCreateStore } from '../util/createStoreServer';
import { SERVER_RENDER } from '../actions/syncActionCreators';
import configure from '../actions/configActionCreators';

// Ensure global Intl for use with FormatJS
Intl.NumberFormat = IntlPolyfill.NumberFormat;
Intl.DateTimeFormat = IntlPolyfill.DateTimeFormat;

const DOCTYPE = '<!DOCTYPE html>';

/**
 * An async module that renders the full app markup for a particular URL/location
 * using [ReactDOMServer]{@link https://facebook.github.io/react/docs/top-level-api.html#reactdomserver}
 *
 * @module ServerRender
 */

function getHtml(el) {
	const htmlMarkup = ReactDOMServer.renderToString(el);
	return `${DOCTYPE}${htmlMarkup}`;
}

function getRedirect(context) {
	if (!context || !context.url) {
		return;
	}
	return {
		redirect: {
			url: context.url,
			permanent: context.permanent,
		},
	};
}

/**
 * Using the current route information and Redux store, render the app to an
 * HTML string and server response code.
 *
 * There are three parts to the render:
 *
 * 1. `appMarkup`, which corresponds to the markup that will be rendered
 * on the client by React. This string is built before the full markup because
 * it sets the data needed by other parts of the DOM, such as `<head>`.
 * 2. `htmlMarkup`, which wraps `appMarkup` with the remaining DOM markup.
 * 3. `doctype`, which is just the doctype element that is a sibling of `<html>`
 *
 * @param {Object} renderProps
 * @param {ReduxStore} store the store containing the initial state of the app
 * @return {Object} the statusCode and result used by Hapi's `reply` API
 *   {@link http://hapijs.com/api#replyerr-result}
 */
type RenderResult =
	| { result: string, statusCode: number }
	| { redirect: { url: string, permanent?: boolean } };
const getRouterRenderer = ({
	routes,
	store,
	location,
	baseUrl,
	clientFilename,
	assetPublicPath,
	scripts,
}): RenderResult => {
	// pre-render the app-specific markup, this is the string of markup that will
	// be managed by React on the client.
	//
	// **IMPORTANT**: this string is built separately from `<Dom />` because it
	// initializes page-specific state that `<Dom />` needs to render, e.g.
	// `<head>` contents
	const initialState = store.getState();
	let appMarkup;
	const staticContext: { url?: string, permanent?: boolean } = {};

	appMarkup = ReactDOMServer.renderToString(
		<StaticRouter
			basename={baseUrl}
			location={location}
			context={staticContext}
		>
			<PlatformApp store={store} routes={routes} />
		</StaticRouter>
	);

	// must _always_ call Redirect.rewind() to avoid memory leak
	const externalRedirect = getRedirect(Redirect.rewind());
	const internalRedirect = getRedirect(staticContext);
	const redirect = internalRedirect || externalRedirect;
	if (redirect) {
		return redirect;
	}

	// all the data for the full `<html>` element has been initialized by the app
	// so go ahead and assemble the full response body
	const result = getHtml(
		<Dom
			baseUrl={baseUrl}
			assetPublicPath={assetPublicPath}
			clientFilename={clientFilename}
			initialState={initialState}
			appMarkup={appMarkup}
			scripts={scripts}
		/>
	);

	// prioritized status code fallbacks
	const statusCode = Forbidden.rewind() || NotFound.rewind() || 200;

	return {
		statusCode,
		result,
	};
};

const makeRenderer$ = (renderConfig: {
	routes: Array<Object>,
	reducer: Reducer,
	assetPublicPath: string,
	middleware: Array<Function>,
	baseUrl: string,
	scripts: Array<string>,
	enableServiceWorker: boolean,
}) =>
	makeRenderer(
		renderConfig.routes,
		renderConfig.reducer,
		null,
		renderConfig.assetPublicPath,
		renderConfig.middleware,
		renderConfig.baseUrl,
		renderConfig.scripts,
		renderConfig.enableServiceWorker
	);

/**
 * Curry a function that takes a Hapi request and returns an observable
 * that will emit the rendered HTML
 *
 * The outer function takes app-specific information about the routes,
 * reducer, and optional additional middleware
 *
 * @param {Object} routes the React Router routes object
 * @param {Function} reducer the root Redux reducer for the app
 * @param {Function} middleware (optional) any app-specific middleware that
 *   should be applied to the store
 *
 * @return {Function}
 *
 * -- Returned Fn --
 * @param {Request} request The request to render - must already have an
 * `oauth_token` in `state`
 * @return {Observable}
 */
const makeRenderer = (
	routes: Array<Object>,
	reducer: Reducer,
	clientFilename: ?string,
	assetPublicPath: string,
	middleware: Array<Function> = [],
	baseUrl: string = '',
	scripts: Array<string>,
	enableServiceWorker: boolean
) => (request: Object) => {
	middleware = middleware || [];
	const {
		connection,
		headers,
		info,
		url,
		server: { app: { logger }, settings: { app: { supportedLangs } } },
		raw: { req },
	} = request;
	const requestLanguage = request.getLanguage();

	// request protocol might be different from original request that hit proxy
	// we want to use the proxy's protocol
	const requestProtocol =
		headers['x-forwarded-proto'] || connection.info.protocol;
	const host = `${requestProtocol}://${info.host}`;

	// create the store
	const initialState = {};
	const createStore = getServerCreateStore(
		routes,
		middleware,
		request,
		baseUrl
	);
	const store = createStore(reducer, initialState);

	// load initial config
	store.dispatch(
		configure({
			apiUrl: API_ROUTE_PATH,
			baseUrl: host,
			enableServiceWorker,
			requestLanguage,
			supportedLangs,
			initialNow: new Date().getTime(),
		})
	);
	// render skeleton if requested - the store is ready
	if ('skeleton' in request.query) {
		return Observable.of({
			result: getHtml(
				<Dom
					baseUrl={baseUrl}
					assetPublicPath={assetPublicPath}
					clientFilename={clientFilename}
					initialState={store.getState()}
					scripts={scripts}
				/>
			),
			statusCode: 200,
		});
	}

	// otherwise render using the API and React router
	const storeIsReady$ = Observable.create(obs => {
		obs.next(store.getState());
		return store.subscribe(() => obs.next(store.getState()));
	}).first(state => state.preRenderChecklist.every(isReady => isReady)); // take the first ready state

	const action = {
		type: SERVER_RENDER,
		payload: url,
	};
	logger.debug(
		{ type: 'dispatch', action, req },
		`Dispatching RENDER for ${request.url.href}`
	);
	store.dispatch(action);
	return storeIsReady$.map(() =>
		getRouterRenderer({
			routes,
			store,
			location: url,
			baseUrl,
			clientFilename,
			assetPublicPath,
			scripts,
		})
	);
};

export { makeRenderer$, makeRenderer };
export default makeRenderer;
