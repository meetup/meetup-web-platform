import { OPT_DEFAULT } from './Cookie';
import { set } from './BrowserCookieProvider';
import jsCookie from 'js-cookie';

jest.mock('js-cookie', () => ({
	set: jest.fn(),
	get: jest.fn(),
}));
describe('set', () => {
	test('calls jsCookie.set', () => {
		jsCookie.set.mockClear();
		set('foo', 'fooValue', OPT_DEFAULT);
		expect(jsCookie.set).toHaveBeenCalled();
		expect(jsCookie.set.mock.calls[0]).toMatchInlineSnapshot(`
		[
		  "foo",
		  "fooValue",
		  {
		    "domain": ".meetup.com",
		    "path": "/",
		    "secure": true,
		  },
		]
	`);
	});
	test('does not call jsCookie.set for `isHttpOnly`', () => {
		jsCookie.set.mockClear();
		set('foo', 'fooValue', { ...OPT_DEFAULT, isHttpOnly: true });
		expect(jsCookie.set).not.toHaveBeenCalled();
	});
	test('sets `expires` as a Date corresponding to `ttl` milliseconds from now', () => {
		jsCookie.set.mockClear();
		const originalGetTime = Date.prototype.getTime;
		Date.prototype.getTime = () => 0; // getTime will always be zero baseline - ttl will add on top

		set('foo', 'fooValue', { ...OPT_DEFAULT, ttl: 500 });
		const jsCookieOpts = jsCookie.set.mock.calls[0][2];
		expect(jsCookieOpts.expires).toEqual(new Date(500));

		Date.prototype.getTime = originalGetTime;
	});
});
