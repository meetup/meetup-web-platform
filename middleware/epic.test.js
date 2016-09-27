import fetch from 'node-fetch';
global.fetch = fetch;
import {
	middlewareDispatcher,
} from '../util/testUtils';
import {
	MOCK_APP_STATE,
	MOCK_ROUTES,
} from '../util/mocks/app';
import * as syncActionCreators from '../actions/syncActionCreators';
import getEpicMiddleware from './epic';

/**
 * The sync middleware needs to respond to particular actions by calling
 * an API endpoint and then triggering a syncing action asynchronously
 *
 * Middleware tests require a mock `dispatch` method and a mock `createStore`.
 * @see {@link http://redux.js.org/docs/recipes/WritingTests.html#middleware}
 *
 * @module SyncMiddlewareTest
 */
describe('SyncMiddleware', () => {
	const syncDispatcher = middlewareDispatcher(getEpicMiddleware(MOCK_ROUTES));
	beforeEach(function() {
		this.renderAction = {
			type: 'ARBITRARY',
			payload: '/'  // root location/path will query for member
		};
	});
	it('dispatches', function() {
		expect(syncDispatcher(MOCK_APP_STATE, this.renderAction))
			.toEqual(this.renderAction);  // end of dispatch chain is the action
	});
	it('dispatches locationSync with routing state on CONFIGURE_AUTH', function() {
		spyOn(syncActionCreators, 'locationSync');
		syncDispatcher(MOCK_APP_STATE, { type: 'CONFIGURE_AUTH' });
		jest.runAllTimers();
		expect(syncActionCreators.locationSync)
			.toHaveBeenCalledWith(MOCK_APP_STATE.routing.locationBeforeTransitions);
	});
});

