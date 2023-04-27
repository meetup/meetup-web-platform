import * as clickParser from './clickParser';

/*
 * This test suite is disabled n Travis because tests don't have
 * `global.document` defined in Travis for some reason. It works fine locally,
 * however.
 *
 * This testing is tricky because Jest uses jsdom to generate a browser-like
 * Javascript environment, but it doesn't play nice with being modified - there
 * are silent crashes and the context for the tests sometimes seems to be
 * different than the context for the executed code.
 *
 * We could fix all this with a lot of dependency injection for DOM APIs, but
 * that seems to me like a heavy refactor that is specifically for unit testing
 * - mikem Feb 2017
 */
// skpping until we can run this in jsdom
describe.skip('trackStopPropagation', () => {
	let document;
	beforeEach(() => {
		document = global.document;
		global.document = {
			body: {
				clientWidth: 100,
			},
		};
	});
	afterEach(() => {
		global.document = document;
	});
	it('adds Event.prototype.stopPropAndTrack', () => {
		clickParser.trackStopPropagation(() => {});
		expect(Event.prototype.stopPropAndTrack).toBeDefined();
	});
	it('overrides Event.prototype.stopPropagation', () => {
		clickParser.trackStopPropagation(() => {});
	});
	it('calls supplied event handler on stopPropagation', () => {
		const spyable = {
			dummyListener() {},
		};
		jest.spyOn(spyable, 'dummyListener');
		clickParser.trackStopPropagation(spyable.dummyListener);
		const evt = document.createEvent('HTMLEvents');
		evt.initEvent('click', false, true);
		document.body.dispatchEvent(evt);
		evt.stopPropagation();
		expect(spyable.dummyListener).toHaveBeenCalled();
	});
	describe('stopPropAndTrack', () => {
		it('calls trackClick', () => {
			const spyable = {
				dummyListener() {},
			};
			jest.spyOn(spyable, 'dummyListener');
			clickParser.trackStopPropagation(spyable.dummyListener);
			const evt = document.createEvent('HTMLEvents');
			evt.initEvent('click', false, true);
			document.body.dispatchEvent(evt);
			evt.stopPropAndTrack();
			expect(spyable.dummyListener).toHaveBeenCalled();
		});
	});
	global.document = document;
});
