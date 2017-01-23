import { browserHistory } from 'react-router';
import 'rxjs/Observable';
import { ActionsObservable } from 'redux-observable';
import { LOCATION_CHANGE } from 'react-router-redux';

import fetch from 'node-fetch';
global.fetch = fetch;

import {
	createFakeStore,
} from 'meetup-web-mocks/lib/testUtils';

import {
	mockQuery,
	MOCK_APP_STATE,
	MOCK_RENDERPROPS,
	MOCK_ROUTES,
} from 'meetup-web-mocks/lib/app';

import {
	epicIgnoreAction,
} from '../util/testUtils';

import getSyncEpic from '../epics/sync';
import * as syncActionCreators from '../actions/syncActionCreators';
import * as authActionCreators from '../actions/authActionCreators';

/**
 * @module SyncEpicTest
 */
describe('Sync epic', () => {
	const routes = {};
	it('does not pass through arbitrary actions', epicIgnoreAction(getSyncEpic(MOCK_ROUTES)));
	it('emits API_REQUEST for nav-related actions with matched query', function() {
		const locationChange = { type: LOCATION_CHANGE, payload: MOCK_RENDERPROPS.location };
		const serverRender = { type: '@@server/RENDER', payload: MOCK_RENDERPROPS.location };

		const action$ = ActionsObservable.of(locationChange, serverRender);
		return getSyncEpic(MOCK_ROUTES)(action$)
			.toPromise()
			.then(action => expect(action.type).toEqual('API_REQUEST'));
	});
	it('emits CACHE_CLEAR and API_REQUEST for nav-related actions with logout query', function() {
		const logoutLocation = {
			...MOCK_RENDERPROPS.location,
			query: {
				...MOCK_RENDERPROPS.query,
				logout: true,
			}
		};
		const locationChange = { type: LOCATION_CHANGE, payload: logoutLocation };

		const action$ = ActionsObservable.of(locationChange);
		return getSyncEpic(MOCK_ROUTES)(action$)
			.toArray()
			.toPromise()
			.then(actions => {
				expect(actions[0].type).toEqual('CACHE_CLEAR');
				expect(actions[1].type).toEqual('API_REQUEST');
			});
	});
	it('does not emit for nav-related actions without matched query', () => {
		const SyncEpic = getSyncEpic(MOCK_ROUTES);

		const pathname = '/noQuery';
		const noMatchLocation = { ...MOCK_RENDERPROPS.location, pathname };
		const locationChange = { type: LOCATION_CHANGE, payload: noMatchLocation };
		const serverRender = { type: '@@server/RENDER', payload: noMatchLocation };

		return epicIgnoreAction(SyncEpic, locationChange)()
			.then(epicIgnoreAction(SyncEpic, serverRender));
	});
	it('does not emit for nav-related actions with query functions that return null', () => {
		const SyncEpic = getSyncEpic(MOCK_ROUTES);

		const pathname = '/nullQuery';
		const noMatchLocation = { ...MOCK_RENDERPROPS.location, pathname };
		const locationChange = { type: LOCATION_CHANGE, payload: noMatchLocation };
		const serverRender = { type: '@@server/RENDER', payload: noMatchLocation };

		return epicIgnoreAction(SyncEpic, locationChange)()
			.then(epicIgnoreAction(SyncEpic, serverRender));
	});


	it('strips logout query and calls browserHistory.replace on LOGIN_SUCCESS', function() {
		spyOn(browserHistory, 'replace');
		const mockFetchQueries = () => () => Promise.resolve({});
		const locationWithLogout = {
			...MOCK_APP_STATE.routing.locationBeforeTransitions,
			query: { logout: true },
		};
		const locationWithoutLogout = {
			...locationWithLogout,
			query: {},
		};
		const MOCK_APP_STATE_LOGOUT = {
			...MOCK_APP_STATE,
			routing: {
				locationBeforeTransitions: locationWithLogout
			}
		};

		const locationSync = authActionCreators.loginSuccess();
		const action$ = ActionsObservable.of(locationSync);
		const fakeStore = createFakeStore(MOCK_APP_STATE_LOGOUT);
		return getSyncEpic(routes, mockFetchQueries)(action$, fakeStore)
			.toPromise()
			.then(() => {
				expect(browserHistory.replace).toHaveBeenCalledWith(locationWithoutLogout);
			});
	});

	it('emits API_SUCCESS and API_COMPLETE on successful API_REQUEST', function() {
		const mockFetchQueries = () => () => Promise.resolve({});

		const queries = [mockQuery({})];
		const apiRequest = syncActionCreators.apiRequest(queries);
		const action$ = ActionsObservable.of(apiRequest);
		const fakeStore = createFakeStore(MOCK_APP_STATE);
		return getSyncEpic(routes, mockFetchQueries)(action$, fakeStore)
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
		return getSyncEpic(routes, mockFetchQueries)(action$, fakeStore)
			.toPromise()
			.then(action => expect(action.type).toEqual('API_ERROR'));
	});

});

