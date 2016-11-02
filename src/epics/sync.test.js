import 'rxjs/Observable';
import { ActionsObservable } from 'redux-observable';
import fetch from 'node-fetch';
global.fetch = fetch;
import { LOCATION_CHANGED } from 'redux-little-router';
import { createFakeStore } from '../util/testUtils';
import {
	mockQuery,
	MOCK_APP_STATE,
	MOCK_LOCATION,
} from '../util/mocks/app';
import {
	epicIgnoreAction
} from '../util/testUtils';
import getSyncEpic from '../epics/sync';
import * as syncActionCreators from '../actions/syncActionCreators';
import * as authActionCreators from '../actions/authActionCreators';
/**
 * @module SyncEpicTest
 */
xdescribe('Sync epic', () => {
	it('does not pass through arbitrary actions', epicIgnoreAction(getSyncEpic()));
	it('emits API_REQUEST for nav-related actions with matched query', function(done) {
		const locationChange = { type: LOCATION_CHANGED, payload: MOCK_LOCATION };

		const action$ = ActionsObservable.of(locationChange);
		const epic$ = getSyncEpic()(action$);
		epic$.subscribe(
			action => expect(action.type).toEqual('API_REQUEST'),
			null,
			done
		);
	});
	it('does not emit for nav-related actions without matched query', () => {
		const SyncEpic = getSyncEpic();

		const pathname = '/noQuery';
		const noMatchLocation = { ...MOCK_LOCATION, pathname };
		const locationChange = { type: LOCATION_CHANGED, payload: noMatchLocation };
		const locationSync = syncActionCreators.locationSync(noMatchLocation);

		return epicIgnoreAction(SyncEpic, locationChange)()
			.then(epicIgnoreAction(SyncEpic, locationSync));
	});

	it('emits API_SUCCESS and API_COMPLETE on successful API_REQUEST', function() {
		const mockFetchQueries = () => () => Promise.resolve({});

		const queries = [mockQuery({})];
		const apiRequest = syncActionCreators.apiRequest(queries);
		const action$ = ActionsObservable.of(apiRequest);
		const fakeStore = createFakeStore(MOCK_APP_STATE);
		return getSyncEpic(mockFetchQueries)(action$, fakeStore)
			.toArray()
			.toPromise()
			.then(actions =>
				expect(actions.map(({ type }) => type)).toEqual(['API_SUCCESS', 'API_COMPLETE'])
			);
	});

	it('emits API_ERROR on failed API_REQUEST', function() {
		const mockFetchQueries = () => () => Promise.reject(new Error());

		const queries = [mockQuery({})];
		const apiRequest = syncActionCreators.apiRequest(queries);
		const action$ = ActionsObservable.of(apiRequest);
		const fakeStore = createFakeStore(MOCK_APP_STATE);
		return getSyncEpic(mockFetchQueries)(action$, fakeStore)
			.toPromise()
			.then(action => expect(action.type).toEqual('API_ERROR'));
	});

	it('emits LOCATION_SYNC with routing state on CONFIGURE_AUTH', function() {
		const configureAuth = authActionCreators.configureAuth({});
		const action$ = ActionsObservable.of(configureAuth);
		const fakeStore = createFakeStore(MOCK_APP_STATE);
		return getSyncEpic()(action$, fakeStore)
			.toPromise()
			.then(
				action => {
					expect(action.type).toEqual('LOCATION_SYNC');
					expect(action.payload).toEqual(MOCK_APP_STATE.router);
				}
			);
	});
});

