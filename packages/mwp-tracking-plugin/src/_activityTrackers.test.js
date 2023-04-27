import url from 'url';
import { getTrackActivity, getTrackApiResponses } from './_activityTrackers';
import { ACTIVITY_PLUGIN_NAME } from './config';

describe('getTrackActivity', () => {
	const trackApiResponses = jest.fn();
	const REQUEST_BASE = {
		trackApiResponses,
		route: { settings: { plugins: {} } },
	};
	const trackActivity = getTrackActivity();
	const fields = { foo: 'bar' }; // arbitrary additional params to merge with url+referrer
	test('standard field values', () => {
		const request = {
			...REQUEST_BASE,
			url: url.parse('http://www.current.com/foo?bar=baz'),
			method: 'get',
			query: {},
			info: { referrer: 'http://www.previous.com/bar' },
		};
		trackActivity(request)(fields);
		expect(trackApiResponses.mock.calls[0][0]).toMatchInlineSnapshot(`
		{
		  "foo": "bar",
		  "referrer": "http://www.previous.com/bar",
		  "url": "/foo?bar=baz",
		}
	`);
	});
	test('custom getFields', () => {
		trackApiResponses.mockClear();
		const mockFields = { foo: 'bar', route: 'overrides' };
		const request = {
			...REQUEST_BASE,
			route: {
				settings: {
					plugins: {
						[ACTIVITY_PLUGIN_NAME]: {
							getFields: (request, fields) => mockFields,
						},
					},
				},
			},
			url: url.parse('http://www.current.com/foo'),
			method: 'get',
			query: {},
			info: { referrer: 'http://www.previous.com/bar' },
		};
		trackActivity(request)(fields);
		expect(trackApiResponses.mock.calls[0][0]).toEqual(mockFields);
	});
});
describe('getTrackApiResponses', () => {
	test('passes along arbitrary fields', () => {
		const trackApiResponses = getTrackApiResponses({
			log: (x, record) => record,
		})({
			state: {},
			plugins: { tracking: {} },
		});
		expect(trackApiResponses({ foo: 'bar' }).foo).toBe('bar');
	});
});
