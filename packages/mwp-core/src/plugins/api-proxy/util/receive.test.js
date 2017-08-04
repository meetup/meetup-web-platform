import externalRequest from 'request';

import { MOCK_API_PROBLEM } from 'meetup-web-mocks/lib/app';
import { MOCK_GROUP } from 'meetup-web-mocks/lib/api';

import { getServer, MOCK_LOGGER } from '../../../util/testUtils';

import { API_PROXY_PLUGIN_NAME } from '../';
import {
	makeApiResponseToQueryResponse,
	makeInjectResponseCookies,
	makeLogResponse,
	makeParseApiResponse,
	parseApiValue,
	parseMetaHeaders,
	parseVariantsHeader,
} from './receive';

describe('makeInjectResponseCookies', () => {
	const request = {
		plugins: {
			[API_PROXY_PLUGIN_NAME]: {
				setState() {},
			},
		},
		server: getServer(),
	};
	const responseObj = {
		request: {
			uri: {
				href: 'http://example.com',
			},
		},
	};
	const response = {
		toJSON() {
			return responseObj;
		},
	};

	it('does nothing without a cookie jar', () => {
		spyOn(response, 'toJSON');
		makeInjectResponseCookies(request)([response, null, null]);
		expect(response.toJSON).not.toHaveBeenCalled();
	});
	it('sets the provided cookies on the reply state', () => {
		const mockJar = externalRequest.jar();
		spyOn(request.plugins[API_PROXY_PLUGIN_NAME], 'setState');

		// set up mock cookie jar with a dummy cookie for the response.request.uri
		const key = 'foo';
		const value = 'bar';
		mockJar.setCookie(`${key}=${value}`, responseObj.request.uri.href);

		makeInjectResponseCookies(request)([response, null, mockJar]);
		expect(
			request.plugins[API_PROXY_PLUGIN_NAME].setState
		).toHaveBeenCalledWith(
			key,
			value,
			jasmine.any(Object) // don't actually care about the cookie options
		);
	});
});

describe('parseApiValue', () => {
	const MOCK_RESPONSE = {
		headers: {},
		statusCode: 200,
	};
	const RESPONSE_400 = {
		...MOCK_RESPONSE,
		statusCode: 400,
		statusMessage: 'Bad Request',
	};
	const RESPONSE_500 = {
		...MOCK_RESPONSE,
		statusCode: 500,
		statusMessage: 'Internal Server Error',
	};
	it('converts valid JSON into an equivalent object for 200 OK response', () => {
		const validJSON = JSON.stringify(MOCK_GROUP);
		expect(parseApiValue([MOCK_RESPONSE, validJSON])).toEqual(
			jasmine.any(Object)
		);
		expect(parseApiValue([MOCK_RESPONSE, validJSON])).toEqual({
			value: MOCK_GROUP,
		});
	});
	it('converts valid JSON into an equivalent object for 400 Bad Request response', () => {
		const validJSON = JSON.stringify(MOCK_GROUP);
		expect(parseApiValue([RESPONSE_400, validJSON])).toEqual({
			error: expect.any(String),
			value: MOCK_GROUP,
		});
	});
	it('converts valid JSON into an equivalent object for 500 error response', () => {
		const validJSON = JSON.stringify(MOCK_GROUP);
		expect(parseApiValue([RESPONSE_500, validJSON])).toEqual({
			error: expect.any(String),
			value: MOCK_GROUP,
		});
	});
	it('returns an object with a string "error" value for invalid JSON', () => {
		const invalidJSON = 'not valid';
		expect(parseApiValue([MOCK_RESPONSE, invalidJSON]).error).toEqual(
			jasmine.any(String)
		);
	});
	it('returns an object with a string "error" value for API response with "problem"', () => {
		const responeWithProblem = JSON.stringify(MOCK_API_PROBLEM);
		expect(parseApiValue([MOCK_RESPONSE, responeWithProblem]).error).toEqual(
			jasmine.any(String)
		);
	});
	it('returns an object with a null value for a 204 No Content response', () => {
		const noContentStatus = {
			statusCode: 204,
			statusMessage: 'No Content',
		};
		const noContentResponse = { ...MOCK_RESPONSE, ...noContentStatus };
		expect(parseApiValue([noContentResponse, '']).value).toBeNull();
	});
	it('returns an object with a string "error" value for a not-ok response', () => {
		const badStatus = {
			statusCode: 500,
			statusMessage: 'Problems',
		};
		const nonOkReponse = { ...MOCK_RESPONSE, ...badStatus };
		expect(parseApiValue([nonOkReponse, '{}']).error).toEqual(
			badStatus.statusMessage
		);
	});
	it('returns a value without any JS-literal unfriendly newline characters', () => {
		const fragileValue = 'foo \\u2028 \\u2029';
		const fragileJSON = JSON.stringify({ foo: fragileValue });
		const parsed = parseApiValue([MOCK_RESPONSE, fragileJSON]).value.foo;
		expect(parsed).toEqual('foo \\n \\n');
	});
});

describe('makeParseApiResponse', () => {
	const MOCK_RESPONSE = {
		headers: {},
		statusCode: 200,
	};
	it('returns the flags set in the X-Meetup-Flags header', () => {
		const headers = {
			'x-meetup-flags': 'foo=true, bar=false',
		};
		const flaggedResponse = { ...MOCK_RESPONSE, headers };
		expect(
			makeParseApiResponse('http://example.com')([flaggedResponse, '{}']).meta
				.flags
		).toEqual({
			foo: true,
			bar: false,
		});
	});
	it('returns the requestId set in the X-Meetup-Request-Id header', () => {
		const requestId = '1234';
		const headers = {
			'x-meetup-request-id': requestId,
		};
		const flaggedResponse = { ...MOCK_RESPONSE, headers };
		expect(
			makeParseApiResponse('http://example.com')([flaggedResponse, '{}']).meta
				.requestId
		).toEqual(requestId);
	});
});

describe('parseMetaHeaders', () => {
	it('returns x-meetup-flags as flags object with real booleans camelcased', () => {
		expect(parseMetaHeaders({ 'x-meetup-foo-bar': 'whatwhat' })).toMatchObject({
			fooBar: 'whatwhat',
		});
	});
	it('returns x-meetup-flags as flags object with real booleans', () => {
		expect(
			parseMetaHeaders({ 'x-meetup-flags': 'foo=true, bar=false' })
		).toMatchObject({ flags: { foo: true, bar: false } });
	});
	it('parses specified x- headers', () => {
		expect(parseMetaHeaders({ 'x-total-count': 'whatwhat' })).toMatchObject({
			totalCount: 'whatwhat',
		});
	});
	it('parses Link header', () => {
		const next = 'http://example.com/next';
		const prev = 'http://example.com/prev';

		// both 'next' and 'prev'
		expect(
			parseMetaHeaders({
				link: `<${next}>; rel="next", <${prev}>; rel="prev"`,
			})
		).toMatchObject({ link: { next, prev } });
		// just 'next'
		expect(parseMetaHeaders({ link: `<${next}>; rel="next"` })).toMatchObject({
			link: { next },
		});
	});
	it('returns empty object for empty headers', () => {
		expect(parseMetaHeaders({})).toEqual({});
	});
});

describe('parseVariantsHeader', () => {
	it('parses a variants header into a nested object', () => {
		const header =
			'binge-pilot=123|variant critical-mass=1|control critical-mass=2|sendemail';
		const expectedObj = {
			'binge-pilot': {
				123: 'variant',
			},
			'critical-mass': {
				1: 'control',
				2: 'sendemail',
			},
		};
		expect(parseVariantsHeader(header)).toEqual(expectedObj);
	});
	it('sets `null` variant for missing variant', () => {
		const header = 'binge-pilot=123|';
		const expectedObj = {
			'binge-pilot': {
				123: null,
			},
		};
		expect(parseVariantsHeader(header)).toEqual(expectedObj);
	});
});

describe('makeApiResponseToQueryResponse', () => {
	const refs = ['foo', 'bar'];
	const queries = refs.map(ref => ({ ref }));
	const MOCK_API_RESPONSES = refs.map(ref => ({ ref }));
	it('transforms an API response object to an object for State consumption', function() {
		MOCK_API_RESPONSES.map((apiResponse, i) =>
			makeApiResponseToQueryResponse(queries[i])(apiResponse)
		).forEach((queryResponse, i) => {
			expect(queryResponse).toEqual(jasmine.any(Object));
			expect(queryResponse.ref).toEqual(refs[i]);
		});
	});
});

describe('makeLogResponse', () => {
	const request = { server: getServer() };
	const MOCK_INCOMINGMESSAGE_GET = {
		elapsedTime: 1234,
		request: {
			uri: {
				query: 'foo=bar',
				pathname: '/foo',
			},
			method: 'get',
		},
	};
	const MOCK_INCOMINGMESSAGE_POST = {
		elapsedTime: 2345,
		request: {
			uri: {
				pathname: '/foo',
			},
			method: 'post',
		},
	};
	it('emits parsed request and response data for GET request', () => {
		MOCK_LOGGER.info.mockClear();
		makeLogResponse(request)([MOCK_INCOMINGMESSAGE_GET, 'foo']);
		expect(MOCK_LOGGER.info).toHaveBeenCalled();
		const loggedObject = MOCK_LOGGER.info.mock.calls[0][0];
		expect(loggedObject).toEqual(jasmine.any(Object));
	});
	it('emits parsed request and response data for POST request', () => {
		MOCK_LOGGER.info.mockClear();
		makeLogResponse(request)([MOCK_INCOMINGMESSAGE_POST, 'foo']);
		expect(MOCK_LOGGER.info).toHaveBeenCalled();
		const loggedObject = MOCK_LOGGER.info.mock.calls[0][0];
		expect(loggedObject).toEqual(jasmine.any(Object));
	});
	it('handles multiple querystring vals for GET request', () => {
		MOCK_LOGGER.info.mockClear();
		const response = {
			...MOCK_INCOMINGMESSAGE_GET,
			request: {
				...MOCK_INCOMINGMESSAGE_GET.request,
				uri: {
					query: 'foo=bar&baz=boodle',
					pathname: '/foo',
				},
			},
		};
		makeLogResponse(request)([response, 'foo']);
		const loggedObject = MOCK_LOGGER.info.mock.calls[0][0];
		expect(loggedObject.info.query).toEqual({
			foo: 'bar',
			baz: 'boodle',
		});
	});
	it('returns the full body of the response if less than 256 characters', () => {
		const body = 'foo';
		MOCK_LOGGER.info.mockClear();
		makeLogResponse(request)([MOCK_INCOMINGMESSAGE_GET, body]);
		expect(MOCK_LOGGER.info).toHaveBeenCalled();
		const loggedObject = MOCK_LOGGER.info.mock.calls[0][0];
		expect(loggedObject.info.body).toEqual(body);
	});
	it('returns a truncated response body if more than 256 characters', () => {
		const body300 =
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean egestas viverra sem vel congue. Cras vitae malesuada justo. Fusce ut finibus felis, at sagittis leo. Morbi nec velit dignissim, viverra tellus at, pretium nisi. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla turpis duis.';
		MOCK_LOGGER.info.mockClear();
		makeLogResponse(request)([MOCK_INCOMINGMESSAGE_GET, body300]);
		expect(MOCK_LOGGER.info).toHaveBeenCalled();
		const loggedObject = MOCK_LOGGER.info.mock.calls[0][0];
		expect(loggedObject.info.body.startsWith(body300.substr(0, 256))).toBe(
			true
		);
		expect(loggedObject.info.body.startsWith(body300)).toBe(false);
	});
});
