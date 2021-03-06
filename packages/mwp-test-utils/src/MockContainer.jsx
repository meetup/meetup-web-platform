import React from 'react';
import { connect } from 'react-redux';
import Link from 'react-router-dom/Link';
import { logger } from 'mwp-logger-plugin';

export const fooPathContent = 'Looking good';

function mapStateToProps(state) {
	logger.info(state);
	return {
		data: (state.api.foo || {}).value,
	};
}

/**
 * @module MockContainer
 */
class MockContainer extends React.Component {
	render() {
		return (
			<div>
				<Link to="/">Home link</Link>
				{fooPathContent}
				{JSON.stringify(this.props.route.data || 'nope', null, 2)}
			</div>
		);
	}
}

export default connect(mapStateToProps)(MockContainer);
