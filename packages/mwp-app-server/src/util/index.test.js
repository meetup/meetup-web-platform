import convict from 'convict';
import https from 'https';
import { getServer } from 'mwp-test-utils';
import * as serverUtils from './';

describe('checkForDevUrl', () => {
	it('returns true for dev URLs', () => {
		expect(serverUtils.checkForDevUrl('www.dev.meetup.com')).toBe(true);
		expect(serverUtils.checkForDevUrl('secure.dev.meetup.com')).toBe(true);
	});

	it('rejects non-dev URLs and non-objects', () => {
		expect(serverUtils.checkForDevUrl('www.meetup.com')).toBe(false);
		expect(serverUtils.checkForDevUrl('secure.meetup.com')).toBe(false);
		expect(serverUtils.checkForDevUrl(1234)).toBe(false);
		expect(serverUtils.checkForDevUrl(true)).toBe(false);
		expect(serverUtils.checkForDevUrl(new Date())).toBe(false);
	});

	it('returns true for nested dev URLs', () => {
		expect(serverUtils.checkForDevUrl({ url: 'www.dev.meetup.com' })).toBe(true);
		expect(
			serverUtils.checkForDevUrl({
				url1: 'www.meetup.com',
				url2: 'www.dev.meetup.com',
			})
		).toBe(true);
		expect(
			serverUtils.checkForDevUrl({ url: { url: 'www.dev.meetup.com' } })
		).toBe(true);
	});
});

xdescribe('configureEnv', function() {
	beforeEach(() => {
		// cache the 'default' setting for rejectUnauthorized
		this.defaultRejectUnauthorized = https.globalAgent.options.rejectUnauthorized;
	});

	afterEach(function() {
		// restore the default setting for rejectUnauthorized
		https.globalAgent.options.rejectUnauthorized = this.defaultRejectUnauthorized;
	});

	it('sets global rejectUnauthorized to false when using dev URLs in config', () => {
		serverUtils.configureEnv(
			convict({
				url: 'www.dev.meetup.com',
			})
		);
		expect(https.globalAgent.options.rejectUnauthorized).toBe(false);
	});

	it('sets global rejectUnauthorized to true when using prod URLs in config', () => {
		serverUtils.configureEnv(
			convict({
				url: 'www.meetup.com',
			})
		);
		expect(https.globalAgent.options.rejectUnauthorized).toBe(true);
	});
});

describe('onRequestExtension', () => {
	it('returns h.continue', async () => {
		const server = await getServer();
		const request = {
			headers: 'foo',
			id: 'bar',
			method: 'get',
			info: {},
			url: { href: 'http://example.com' },
			state: {},
			server,
		};
		const h = {
			continue: {},
		};
		const response = serverUtils.onRequestExtension(request, h);
		expect(response).toEqual(h.continue);
	});
});
