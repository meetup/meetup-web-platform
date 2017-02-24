import React from 'react';
import Switch from 'react-router-dom/Switch';
import Route from 'react-router-dom/Route';

const RouteWithSubRoutes = route => {
	if (!route.component) {
		throw new Error(`route for ${route.path} must have a 'component' property`);
	}
	if (route.render || route.children) {
		console.warn('route.render and route.children function not supported');
	}
	return (
		<Route
			path={route.path}
			exact={route.exact || false}
			strict={route.strict || false}
			render={props => (
				<route.component {...props}>
					{route.routes &&
						<SwitchRoutes routes={route.routes} currentPath={props.match.path} />
					}
				</route.component>
			)}
		/>
	);
};

const SwitchRoutes = ({ routes, currentPath }) => (
	<Switch>
		{routes.map((route, i) => {
			route.path = `${currentPath || ''}${route.path}`;  // modify path to reflect full match
			return <RouteWithSubRoutes key={i} {...route} />;
		})}
	</Switch>
);


/**
 * @module RouteLayout
 */
class RouteLayout extends React.Component {
	render() {
		const { routes } = this.props;
		return <SwitchRoutes routes={routes} />;
	}
}

export default RouteLayout;

