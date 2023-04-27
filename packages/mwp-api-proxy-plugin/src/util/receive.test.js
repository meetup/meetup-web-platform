import { MOCK_API_PROBLEM } from 'meetup-web-mocks/lib/app';
import { MOCK_GROUP } from 'meetup-web-mocks/lib/api';

import { getServer, MOCK_LOGGER } from 'mwp-test-utils';

import {
	makeApiResponseToQueryResponse,
	makeLogResponse,
	makeParseApiResponse,
	parseApiValue,
	parseMetaHeaders,
	parseVariantsHeader,
} from './receive';

jest.mock('mwp-logger-plugin', () => {
	return {
		logger: require('mwp-test-utils').MOCK_LOGGER,
	};
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
		expect(parseApiValue([MOCK_RESPONSE, validJSON])).not.toBeNull();
		expect(parseApiValue([MOCK_RESPONSE, validJSON])).not.toBeNull();
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
		expect(parseApiValue([MOCK_RESPONSE, invalidJSON]).error).not.toBeNull();
	});
	it('returns an object with a string "error" value for API response with "problem"', () => {
		const responeWithProblem = JSON.stringify(MOCK_API_PROBLEM);
		expect(
			parseApiValue([MOCK_RESPONSE, responeWithProblem]).error
		).not.toBeNull();
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
		const fragileValue = 'foo \u2028 \u2029';
		const fragileJSON = JSON.stringify({ foo: fragileValue });
		const parsed = parseApiValue([MOCK_RESPONSE, fragileJSON]).value.foo;
		expect(parsed).toEqual('foo \n \n');
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
			expect(queryResponse).not.toBeNull();
			expect(queryResponse.ref).toEqual(refs[i]);
		});
	});
});

describe('makeLogResponse', () => {
	const MOCK_INCOMINGMESSAGE_GET = {
		elapsedTime: 1234,
		request: {
			method: 'get',
			uri: {},
		},
	};
	const MOCK_INCOMINGMESSAGE_POST = {
		elapsedTime: 2345,
		request: {
			method: 'post',
			uri: {},
		},
	};

	let server, request, botRequest;
	beforeAll(async () => {
		server = await getServer();
		request = { server, headers: {} };
		botRequest = {
			...request,
			headers: { ...request.headers, 'user-agent': 'bot' },
		};
	});
	it('emits parsed request and response data for GET request', () => {
		MOCK_LOGGER.info.mockClear();
		makeLogResponse(request)([MOCK_INCOMINGMESSAGE_GET, 'foo']);
		expect(MOCK_LOGGER.info).toHaveBeenCalled();
		const loggedObject = MOCK_LOGGER.info.mock.calls[0][0];
		expect(loggedObject).not.toBeNull();
	});
	it('emits parsed request and response data for POST request', () => {
		MOCK_LOGGER.info.mockClear();
		makeLogResponse(request)([MOCK_INCOMINGMESSAGE_POST, 'foo']);
		expect(MOCK_LOGGER.info).toHaveBeenCalled();
		const loggedObject = MOCK_LOGGER.info.mock.calls[0][0];
		expect(loggedObject).not.toBeNull();
	});
	it('logs error on non-JSON error', () => {
		const body = 'This is not JSON';
		const responseErr = { ...MOCK_INCOMINGMESSAGE_GET, statusCode: 500 };
		MOCK_LOGGER.error.mockClear();
		makeLogResponse(request)([responseErr, body]);
		expect(MOCK_LOGGER.error).toHaveBeenCalled();
	});
	it('does _not_ log error from a bot request user agent', () => {
		const body = 'foo';
		const responseErr = { ...MOCK_INCOMINGMESSAGE_GET, statusCode: 500 };
		MOCK_LOGGER.error.mockClear();
		MOCK_LOGGER.info.mockClear();
		MOCK_LOGGER.warn.mockClear();
		makeLogResponse(botRequest)([responseErr, body]);
		expect(MOCK_LOGGER.error).not.toHaveBeenCalled();
		expect(MOCK_LOGGER.info).not.toHaveBeenCalled();
		expect(MOCK_LOGGER.warn).not.toHaveBeenCalled();
	});
	it('logs html <title> content on HTML error', () => {
		const title = 'Doom doom ruin';
		const body = `<html><head><title>${title}</title></head></html>`;
		const responseErr = { ...MOCK_INCOMINGMESSAGE_GET, statusCode: 500 };
		MOCK_LOGGER.error.mockClear();
		makeLogResponse(request)([responseErr, body]);
		expect(MOCK_LOGGER.error).toHaveBeenCalled();
		const loggedObject = MOCK_LOGGER.error.mock.calls[0][0];
		expect(loggedObject.err.message).toBe(title);
	});
});
