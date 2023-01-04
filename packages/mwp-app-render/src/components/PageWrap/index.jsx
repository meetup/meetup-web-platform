import React from 'react';
import Helmet from 'react-helmet';
import PropTypes from 'prop-types';

/**
 * This component wraps all pages on the website, and through [Helmet](https://github.com/nfl/react-helmet/)
 * sets up base CSS, favicons, & javascript
 *
 * @module PageWrap
 */
class PageWrap extends React.Component {
	/**
	 * This method ensures important app state props passed
	 * from `AppContainer` are passed to children (feature containers)
	 *
	 * @method renderChildren
	 * @returns {Array} Children with mapped props
	 */
	renderChildren() {
		const { self, localeCode, location } = this.props;

		return React.Children.map(this.props.children, (child, key) =>
			React.cloneElement(child, { self, localeCode, location, key })
		);
	}

	componentDidMount() {
		// Browser has now rendered client-side application - fire the browser TTI triggers

		// Add W3C UserTiming mark for TTI and measure (from navigationStart to newly created mark)
		if (
			window.performance &&
			window.performance.mark &&
			window.performance.measure
		) {
			window.performance.mark('meetup-tti');
			window.performance.measure('meetup-tti', 'navigationStart', 'meetup-tti');
		}

		// Specially for Developer Tools in the browsers (Chrome & Firefox), create entry for the event so it shows up on Performance timeline
		if (console && console.timeStamp) {
			console.timeStamp('meetup-tti');
		}
	}

	/**
	 * @return {React.element} the page wrapping component
	 */
	render() {
		const { head, iconSprite, localeCode } = this.props;

		// Parse localeCode for ISO 639-1 languages code.
		// (ie. 'en', 'it', etc)
		// @see https://github.com/meetup/swarm-sasstools/blob/main/scss/utils/helpers/_i18n.scss
		const lang = localeCode.substring(0, 2);

		return (
			<div
				id="root"
				className={`column lang_${lang}`}
				style={{ minHeight: '100vh' }}
			>
				{head}

				<Helmet defaultTitle="Meetup" titleTemplate="%s - Meetup">
					<meta
						name="viewport"
						content="width=device-width, initial-scale=1"
					/>
					<meta
						http-equiv="Content-Type"
						content="text/html; charset=UTF-8"
					/>
					<meta http-equiv="X-UA-Compatible" content="IE=edge" />
					<meta name="robots" content="index,follow" />
					<meta
						name="verify-v1"
						content="h5EhuAEkLFlZmMxwpH5wnRaoDEmqYCCEUE+FLcrRNvE="
					/>
				</Helmet>

				{iconSprite && (
					<div
						style={{ display: 'none' }}
						dangerouslySetInnerHTML={{ __html: iconSprite }}
					/>
				)}

				{this.renderChildren()}
			</div>
		);
	}
}

PageWrap.propTypes = {
	head: PropTypes.object,
	iconSprite: PropTypes.string,
	localeCode: PropTypes.string.isRequired,
	location: PropTypes.object.isRequired,
	self: PropTypes.object.isRequired,
};

export default PageWrap;
