// @flow
declare var Intl: Object;

declare type NonNull = string | number | boolean | {} | [];
declare type Params = { [string]: string | number };

declare type FluxStandardAction = {
	type: string,
	payload?: any,
	meta?: any,
	error?: boolean,
};

declare type Reducer = (state: ?Object, action: FluxStandardAction) => Object;
// Selector is paramaterized by its output type
declare type Selector<T> = (state: ?Object) => T;

// API query structure
declare type Query = {
	ref: string,
	endpoint: string,
	params?: Params,
	type?: string,
	meta?: {
		flags?: Array<string>,
		method?: string,
	},
};

declare type QueryResponseValue = Object | Array<Object>;
declare type QueryResponse = {
	ref: string,
	value: QueryResponseValue,
	type?: string,
	flags?: Array<string>,
	meta?: Object,
};

declare type QueryFunction = (location: { [string]: mixed }) => Query;

declare type PlatformRoute = {
	component: ReactClass<*>,
	getNestedRoutes?: () => Promise<Array<PlatformRoute>>,
	getIndexRoute?: () => Promise<PlatformRoute>,
	path?: string,
	exact?: boolean,
	strict?: boolean,
	query?: QueryFunction | Array<QueryFunction>,
	indexRoute?: PlatformRoute,
	routes?: Array<PlatformRoute>,
};

declare type CookieOpts = {
	path?: string,
	isHttpOnly?: boolean,
	isSecure?: boolean,
	encoding?: string,
};

declare type Match = {
	params: Params,
	isExact: boolean,
	path: string,
	url: string,
};

declare type MatchedRoute = { route: PlatformRoute, match: Match };
declare type MatchPathOptions = {
	path: string,
	exact?: boolean,
	strict?: boolean,
};

declare module 'react-router-dom/matchPath' {
	declare function matchPath(
		pathname: string,
		options: MatchPathOptions
	): null | Match;
	declare module.exports: typeof matchPath;
}

declare type LocationShape = {
	pathname?: string,
	search?: string,
	hash?: string,
	state?: any,
};

declare class RouterRedirect extends React$Component {
	props: {
		to: string | LocationShape,
		push?: boolean,
	},
}
declare module 'react-router-dom/Redirect' {
	declare export default typeof RouterRedirect
}
