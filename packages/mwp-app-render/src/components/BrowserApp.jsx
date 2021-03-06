import React from 'react';
import PropTypes from 'prop-types';
import BrowserRouter from 'react-router-dom/BrowserRouter';
import PlatformApp from './shared/PlatformApp';
import initClickTracking from 'mwp-tracking-plugin/lib/util/browserInit';
import BrowserCookieProvider from '@meetup/mwp-cookie/lib/BrowserCookieProvider';
import ApolloProvider from './ApolloProvider';
import getClient from '../util/getClient';

/**
 * A simple component to wrap the base PlatformApp with the BrowserRouter
 */

let client = getClient(false);

class BrowserApp extends React.Component {
	componentDidMount() {
		initClickTracking();
	}
	render() {
		const { appContext, store, routes } = this.props;
		return (
			<BrowserRouter basename={appContext.basename}>
				<BrowserCookieProvider>
					<ApolloProvider client={client}>
						<PlatformApp
							appContext={appContext}
							store={store}
							routes={routes}
						/>
					</ApolloProvider>
				</BrowserCookieProvider>
			</BrowserRouter>
		);
	}
}

BrowserApp.propTypes = {
	routes: PropTypes.array.isRequired,
	store: PropTypes.object.isRequired,
	appContext: PropTypes.object.isRequired,
};
BrowserApp.defaultProps = {
	basename: '',
};

export default BrowserApp;
