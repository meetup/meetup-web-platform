// @flow
declare var Intl: Object;

declare type MatchMedia = {
	isAtSmallUp: boolean,
	isAtMediumUp: boolean,
	isAtLargeUp: boolean,
};

declare type AppContext = {
	apiUrl: string, // base API URL for queries
	baseUrl: string, // server host
	basename: string, // base path for routing - e.g. locale-specific base paths '/fr-FR/'
	enableServiceWorker: boolean,
	requestLanguage: string,
	supportedLangs: Array<string>,
	member:
		| {|
				id: number,
				status: number,
				timestamp: number,
				// board status, related to permissions on message boards https://github.com/meetup/meetup/blob/main/modules/base/src/main/java/com/meetup/base/util/MeetupStatus.java#L743-L752
				bs: number,
				// time zone
				tz: string,
				zip: number,
				country: string,
				city: string,
				state?: string,
				lat: number,
				lon: number,
				ql: boolean,
				scope?: string,
				// whether the member selected remember me or not
				rem?: number,
				// whether the member is an organizer or not
				org?: 1,
		  |}
		| {| id: 0 |},
	geo: GeoLocation,
	initialNow: number, // timestamp that React-Intl uses to initialize date strings on initial client render
	isQL: boolean,
	isProdApi: boolean, // whether the data is coming from Prod instead of Dev DB
	variants: mixed, // parsed X-Meetup-Variants header
	entryPath: string, // URL path that the user landed on (server-rendered path)
	media: MatchMedia,
	browserId: string, // from browser id cookie
	clientIp: string, // best guess at client IP address
	siftSessionId: string, // from Sift Science cookie
	isBot: boolean, // based on user agent, is this a bot?
};

declare type MWPState = {
	api: ApiState,
	flags?: FeatureFlags,
	config: AppContext,
};

declare type FeatureFlags = { [string]: boolean | string };

declare type Params = { [string]: string };

type RedirectResult = {|
	redirect: {
		url: string,
		permanent?: boolean,
	},
|};
type HTMLResult = {|
	statusCode: number,
	result: string,
|};
declare type RenderResult = RedirectResult | HTMLResult;

declare type LanguageRenderer = (
	request: HapiRequest,
	h: ?HapiResponseToolkit
) => Promise<RenderResult>;

declare type FluxStandardAction = {
	type: string,
	payload?: any,
	meta?: any,
	error?: boolean,
};

declare type QueryListParam = {|
	dynamicRef: string, // dynamic ref that will be kept forever
	merge?: {
		idTest: (Object, Object) => boolean, // test for same object identity
		sort?: (Object, Object) => number, // test for order
		isReverse?: boolean,
	},
|};
// API query structure
declare type Query = {
	ref: string,
	endpoint: string,
	list?: QueryListParam,
	params?: Params,
	type?: string,
	mockResponse?: () => any,
	meta?: {
		flags?: Array<string>,
		method?: 'get' | 'post' | 'delete' | 'patch' | 'put',
		noCache?: boolean,
		metaRequestHeaders?: Array<string>,
		variants?: {
			[string]: string | Array<string>,
		},
	},
};

declare type QueryResponse = {
	ref: string,
	value: Object | Array<Object>,
	type?: string,
	flags?: Array<string>,
	meta?: Object,
	query?: Query,
	error?: string,
};

declare type QueryFunction = (
	location: { [string]: mixed },
	state: MWPState
) => Query;

type BasePlatformRoute = {|
	path?: string,
	exact?: boolean,
	strict?: boolean,
	query?: QueryFunction | Array<QueryFunction>,
	indexRoute?: PlatformRoute,
	routes?: Array<PlatformRoute>,
|};

type AsyncPlatformRoute = {|
	...BasePlatformRoute,
	getComponent: () => Promise<React$ComponentType<*>>,
|};

type StaticPlatformRoute = {|
	...BasePlatformRoute,
	component: React$ComponentType<*>,
|};

declare type PlatformRoute = AsyncPlatformRoute | StaticPlatformRoute;

declare type GeoLocation = {
	country?: string,
	region?: string,
	city?: string,
	latlon?: Array<number>,
};

// See https://docs.launchdarkly.com/docs/node-sdk-reference#section-users
declare type LaunchDarklyUser$CustomAttributes = {
	RequestCountry?: string,
	RequestRegion?: string,
	[string]:
		| string
		| boolean
		| number
		| Array<string>
		| Array<boolean>
		| Array<number>,
};

declare type LaunchDarklyUser = {|
	key: string,
	ip?: string,
	firstName?: string,
	lastName?: string,
	country?: string,
	email?: string,
	avatar?: string,
	name?: string,
	anonymous?: boolean,
	custom?: LaunchDarklyUser$CustomAttributes,
|};

declare type ActivityInfo = {
	viewName?: string,
	subViewName?: string,
	standardized_url?: string,
	standardized_referer?: string,
};
