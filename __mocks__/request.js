const actual_request = jest.requireActual('request');
/**
 * Jest will automatically apply this mock for every call to the `request`
 * package when running tests. This means that the network will not be hit by
 * unit/integration tests.
 *
 * The characteristics of the mocked request can be changed by calling
 * `request.__setMockResponse` before each test in order to supply the
 * `response` and `body` arguments to the request package's callback function
 *
 * @example
 * ```
 * // some.test.js
 * import request from 'request';
 *
 * request.__setMockResponse(
 * 	{ headers, statusCode, ... },
 * 	JSON.stringify({ foo: 'bar' })
 * );
 *
 * ...
 * expect(response.foo).toEqual('bar')
 * ```
 *
 * @module mockRequest
 */
let mockResponse = {
	method: 'get',
	headers: {},
	statusCode: 200,
	elapsedTime: 2,
	request: {
		uri: {
			query: 'foo=bar',
			pathname: '/foo',
		},
		method: 'get',
	},
};
let mockBody = '{}';

const request = jest.fn((requestOpts, cb) => {
	console.log(
		'mock request',
		(requestOpts.method || 'get').toUpperCase(),
		requestOpts.url
	);
	return setTimeout(
		() => cb(requestOpts.err, mockResponse, mockBody),
		mockResponse.elapsedTime
	);
});
request.post = jest.fn(request);
request.jar = actual_request.jar;
request.defaults = actual_request.defaults;

request.__setMockResponse = (response, body) => {
	mockResponse = response || mockResponse;
	mockBody = body || mockBody;
};

module.exports = request;
