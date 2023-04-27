import { getServer } from 'mwp-test-utils';

import {
	mockQuery,
	MOCK_RENDERPROPS,
	MOCK_RENDERPROPS_UTF8,
} from 'meetup-web-mocks/lib/app';

import {
	createCookieJar,
	makeExternalApiRequest,
	buildRequestArgs,
	getAuthHeaders,
	getExternalRequestOpts,
	getLanguageHeader,
	getClientIpHeader,
	getTrackingHeaders,
	parseMultipart,
	API_META_HEADER,
	COOKIE_BLACKLIST,
} from './send';

import { API_PROXY_PLUGIN_NAME } from '../config';

jest.mock('mwp-config', () => {
	const config = jest.requireActual('mwp-config');
	config.package = { agent: 'TEST_AGENT ' };
	return config;
});

const MOCK_HAPI_REQUEST = {
	auth: {
		credentials: { memberCookie: 'foo member', csrfToken: 'bar token' },
	},
	id: 'mock-uuid-1234',
	method: 'get',
	headers: {},
	query: {},
	state: {},
	plugins: {
		[API_PROXY_PLUGIN_NAME]: {
			uploads: [],
		},
	},
	getLanguage: () => 'en-US',
};

describe('getAuthHeaders', () => {
	it('sets MEETUP_CSRF', () => {
		const authHeaders = getAuthHeaders({
			server: { settings: { app: { api: {} } } },
			auth: {
				credentials: {
					memberCookie: 'foo member',
					csrfToken: 'bar token',
				},
			},
		});
		const cookies = authHeaders.cookie.split('; ').reduce((cookies, pair) => {
			const [name, ...value] = pair.split('=');
			return {
				...cookies,
				[name]: value.join('='),
			};
		}, {});

		expect(cookies['MEETUP_CSRF_DEV']).not.toBeUndefined();
		expect(authHeaders['csrf-token']).toEqual(cookies['MEETUP_CSRF_DEV']);
	});
	it('does not forward blacklisted cookies', () => {
		const authHeaders = getAuthHeaders({
			server: { settings: { app: { api: {} } } },
			auth: {
				credentials: {
					memberCookie: 'foo member',
					csrfToken: 'bar token',
				},
			},
			state: {
				okayCookie: 'wunderbar',
				...COOKIE_BLACKLIST.reduce(
					(acc, name) => ({ ...acc, [name]: 'do not forward' }),
					{}
				),
			},
		});

		COOKIE_BLACKLIST.forEach(name => {
			expect(authHeaders.cookie.includes(name)).toBe(false);
		});
		expect(authHeaders.cookie.includes('okayCookie')).toBe(true);
	});
});

describe('getClientIpHeader', () => {
	it('returns a x-meetup-client-ip header when a fastly-client-ip header is set', () => {
		const clientIpHeader = {
			'X-Meetup-Client-Ip': '127.0.0.1',
		};
		const request = {
			headers: {
				'fastly-client-ip': '127.0.0.1',
			},
			query: {},
		};
		expect(getClientIpHeader(request)).toEqual(clientIpHeader);
	});
	it('returns a x-meetup-client-ip header when __set_geoip header is set', () => {
		const clientIpHeader = {
			'X-Meetup-Client-Ip': '127.0.0.2',
		};
		const request = {
			query: {
				__set_geoip: '127.0.0.2',
			},
			headers: {},
		};
		expect(getClientIpHeader(request)).toEqual(clientIpHeader);
	});

	it('Does not set the header if fastly-client-ip or query param is not set', () => {
		const request = {
			headers: {},
			query: {},
		};
		expect(getClientIpHeader(request)).toEqual({});
	});
});

describe('getTrackingHeaders', () => {
	it('returns a x-meetup-external-track and x-meetup-external-track-url header when the _xtd query param exists', () => {
		const externalTrackHeaders = {
			'X-Meetup-External-Track': 'helloIAmRandom',
			'X-Meetup-External-Track-Url':
				'https://www.meetup.com/cool-meetup/events/123?foo=bar',
		};
		const request = {
			query: { _xtd: 'helloIAmRandom' },
			url: {
				href: 'https://meetup.com/cool-meetup/events/123?foo=bar',
				origin: 'https://meetup.com',
				protocol: 'https:',
				username: '',
				password: '',
				host: 'meetup.com',
				hostname: 'meetup.com',
				port: '',
				pathname: '/cool-meetup/events/123',
				search: '?foo=bar',
				searchParams: { a: 'b' },
				hash: '',
			},
			headers: {
				'x-forwarded-proto': 'https',
				'x-meetup-host': 'www.meetup.com',
			},
		};
		expect(getTrackingHeaders(request)).toEqual(externalTrackHeaders);
	});

	it('Does not set the header if query param is not set', () => {
		const request = {
			query: {},
			headers: {
				'x-forwarded-proto': 'https',
				'x-meetup-host': 'www.meetup.com',
			},
		};
		expect(getTrackingHeaders(request)).toEqual({});
	});
});

describe('getLanguageHeader', () => {
	it('returns accept-language containing request.getLanguage()', () => {
		const requestLang = 'fr-FR';
		const request = {
			headers: {},
			getLanguage: () => requestLang,
		};
		expect(getLanguageHeader(request)).toEqual(requestLang);
	});
	it('prepends parsed MEMBER_LANGUAGE cookie on existing accepts-langauge', () => {
		const headerLang = 'foo';
		const requestLang = 'fr-FR';
		const request = {
			headers: { 'accept-language': headerLang },
			getLanguage: () => requestLang,
		};
		expect(getLanguageHeader(request)).toEqual(`fr-FR,${headerLang}`);
	});
	it('returns existing accepts-langauge unmodified when no language cookie', () => {
		const headerLang = 'foo';
		const request = {
			headers: { 'accept-language': headerLang },
			getLanguage: () => {},
		};
		expect(getLanguageHeader(request)).toEqual(headerLang);
	});
});

describe('buildRequestArgs', () => {
	const testQueryResults = mockQuery(MOCK_RENDERPROPS);
	const url = 'http://example.com';
	const options = {
		url,
		headers: {
			authorization: 'Bearer testtoken',
		},
		mode: 'no-cors',
	};

	it('Converts an api config to arguments for a node-request call', () => {
		let method = 'get';
		const getArgs = buildRequestArgs({ ...options, method })(testQueryResults);
		method = 'post';
		const postArgs = buildRequestArgs({ ...options, method })(testQueryResults);
		expect(getArgs).not.toBeNull();
		expect(getArgs.url).toMatch(/\?.+/); // get requests will add querystring
		expect(getArgs.hasOwnProperty('body')).toBe(false); // get requests will not have a body
		expect(postArgs.url).not.toMatch(/\?.+/); // post requests will not add querystring
		expect(postArgs.body).not.toBeNull(); // post requests will add body string
		// post requests will add body string
		expect(postArgs.headers['content-type']).toEqual(
			'application/x-www-form-urlencoded'
		);
	});

	it('Sets X-Meetup-Request-Flags header when query has flags', () => {
		const query = {
			endpoint: 'foo',
			type: 'bar',
			params: {
				foo: 'bar',
			},
			flags: ['asdf'],
		};
		const getArgs = buildRequestArgs({ ...options, method: 'get' })(query);
		expect(getArgs.headers['X-Meetup-Request-Flags']).not.toBeUndefined();
		const postArgs = buildRequestArgs({ ...options, method: 'post' })(query);
		expect(postArgs.headers['X-Meetup-Request-Flags']).not.toBeUndefined();
	});

	it('Sets X-Meetup-Variants header when query has flags', () => {
		const experiment = 'binge-pilot';
		const context = '1234';
		const query = {
			endpoint: 'foo',
			type: 'bar',
			params: {
				foo: 'bar',
			},
			meta: {
				variants: {
					[experiment]: context,
				},
			},
		};
		const getArgs = buildRequestArgs({ ...options, method: 'get' })(query);
		expect(getArgs.headers['X-Meetup-Variants']).toEqual(
			`${experiment}=${context}`
		);
		const postArgs = buildRequestArgs({ ...options, method: 'post' })(query);
		expect(postArgs.headers['X-Meetup-Variants']).toEqual(
			`${experiment}=${context}`
		);
	});

	it('adds api meta request header with expected value from array provided in query', () => {
		const query = {
			endpoint: 'foo',
			type: 'bar',
			meta: { metaRequestHeaders: ['foo', 'bar'] },
		};
		const requestArgs = buildRequestArgs({ ...options, method: 'get' })(query);
		const requestHeaders = Object.keys(requestArgs.headers);
		const expectedApiMetaHeader = 'foo,bar';

		expect(requestHeaders).toContain(API_META_HEADER);
		expect(requestArgs.headers[API_META_HEADER]).toBe(expectedApiMetaHeader);
	});

	const testQueryResults_utf8 = mockQuery(MOCK_RENDERPROPS_UTF8);
	it('Properly encodes the URL', () => {
		const method = 'get';
		const getArgs = buildRequestArgs({ ...options, method })(
			testQueryResults_utf8
		);
		const { pathname } = require('url').parse(getArgs.url);
		expect(/^[\x00-\xFF]*$/.test(pathname)).toBe(true); // eslint-disable-line no-control-regex
	});
	it('Does not double-encode the URL', () => {
		const method = 'get';
		const decodedQuery = {
			endpoint: encodeURI('バ-京'), // 'pre-encode' the endpoint
			params: {},
		};
		const getArgs = buildRequestArgs({ ...options, method })(decodedQuery);
		const { pathname } = require('url').parse(getArgs.url);
		expect(pathname).toBe(`/${decodedQuery.endpoint}`);
	});

	it('sets baseUrl to undefined when given a fully-qualified URL endpoint', () => {
		const method = 'get';
		const endpoint = 'https://example.com/foo';
		const decodedQuery = {
			endpoint,
			params: {},
		};
		const getArgs = buildRequestArgs({ ...options, method })(decodedQuery);
		expect(getArgs.baseUrl).toBeUndefined();
		expect(getArgs.url).toBe(endpoint);
	});
});

describe('getExternalRequestOpts', () => {
	it('returns the expected object from a vanilla request', async () => {
		const server = await getServer();
		const mockRequest = {
			...MOCK_HAPI_REQUEST,
			server,
		};
		expect(getExternalRequestOpts(mockRequest)).toMatchSnapshot();
	});
	it('returns the expected object from a multipart request', async () => {
		const server = await getServer();

		// most important difference is that multipart has a 'formData' key
		const mockRequest = {
			...MOCK_HAPI_REQUEST,
			server,
			mime: 'multipart/form-data',
			payload: { foo: 'bar' },
		};

		expect(getExternalRequestOpts(mockRequest)).toMatchSnapshot();
	});
});

describe('createCookieJar', () => {
	it('returns a cookie jar for /sessions endpoint', () => {
		const jar = createCookieJar('/sessions?asdfasd');
		expect(jar).not.toBeNull();
	});
	it('returns null for non-sessions endpoint', () => {
		const jar = createCookieJar('/not-sessions?asdfasd');
		expect(jar).toBeNull();
	});
});

describe('makeExternalApiRequest', () => {
	it('calls externalRequest with requestOpts', async () => {
		const server = await getServer();
		const mockRequest = {
			...MOCK_HAPI_REQUEST,
			server,
		};

		const requestOpts = {
			foo: 'bar',
			url: 'http://example.com',
		};

		return makeExternalApiRequest(mockRequest)(requestOpts)
			.then(() => require('request').mock.calls.pop()[0])
			.then(arg => expect(arg).toBe(requestOpts));
	});
	it('Returns an ETIMEDOUT error object for timeouts', () => {
		const err = new Error('ETIMEDOUT');
		err.code = 'ETIMEDOUT';
		const requestOpts = {
			foo: 'bar',
			url: 'http://example.com',
			err,
		};

		return makeExternalApiRequest({
			server: {
				app: { logger: { error: () => {} } },
				settings: { app: { api: { timeout: 100 } } },
			},
			raw: {},
		})(requestOpts).then(([resp, body]) =>
			expect(JSON.parse(body).errors[0].code).toBe('ETIMEDOUT')
		);
	});
	it('returns the requestOpts jar at array index 2', async () => {
		const server = await getServer();

		const mockRequest = {
			...MOCK_HAPI_REQUEST,
			server,
		};

		const requestOpts = {
			foo: 'bar',
			url: 'http://example.com',
			jar: 'fooJar',
		};
		return makeExternalApiRequest(mockRequest)(requestOpts).then(
			([response, body, jar]) => expect(jar).toBe(requestOpts.jar)
		);
	});
});

describe('parseMultipart', () => {
	it('passes through non-file data unchanged', () => {
		const payload = { foo: 'bar', baz: 1 };
		expect(parseMultipart(payload)).toEqual(payload);
	});
	it('converts a Buffer to a { value, options: { filename } } object', () => {
		const myfile = Buffer.alloc(10);
		const payload = {
			foo: 'bar',
			myfile,
		};
		const expectedFile = {
			value: myfile,
			options: {
				filename: expect.any(String),
			},
		};
		expect(parseMultipart(payload)).toEqual({
			...payload,
			myfile: expectedFile,
		});
	});
});
