import React from 'react';
import { Provider } from 'react-redux';
import SyncContainer from './SyncContainer';
import RouteLayout from './RouteLayout';

/**
 * @module PlatformApp
 */
class PlatformApp extends React.Component {
	render() {
		const {
			store,
			routes,
		} = this.props;
		return (
			<Provider store={store}>
				<SyncContainer>
					<RouteLayout routes={routes} />
				</SyncContainer>
			</Provider>
		);
	}
}

export default PlatformApp;

