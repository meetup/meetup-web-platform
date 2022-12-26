import React from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';

import { DEFAULT_TITLE } from '../util/seo/ldJson';
import { generateCanonicalUrlLinkTags } from '../util/seo/links';
import {
	DEFAULT_IMAGE_URL,
	generateMetaData,
	generateMetaTags,
} from '../util/seo/metaTags';

/**
 * Component for rendering SEO content in the document's head
 * Note: props passed to SEOHead should *not* be html-escaped because this is handled by Helmet
 * @see https://github.com/nfl/react-helmet
 * @param {String} baseUrl Base url of the page (protocol + hostname).
 * @param {String} imageUrl An image url that will be applied to the link tag, og:image meta tag, etc.
 * @param {Array} ldJson Array containing json-ld objects. These are usually generated by helper functions in src/util/seoHelper.js.
 * @param {String} localCode The current localeCode.
 * @param {String} forcedLocaleCode The current group locale code.
 * @param {String} ogDescription A special description for the Open Graph og:description meta tag. If this isn't provided pageDescription is used.
 * @param {String} ogTitle A special title for the Open Graph og:title meta tag. If this isn't provided pageTitle is used.
 * @param {String} pageDescription The page description, for example -- Upcoming Events for NY Tech in New York City
 * @param {String} pageKeywords A comma-separated string of keywords, for example -- 'upcoming events,ny-tech,ny,technology,group,club,event,community,local,networking,meet,sharing'
 * @param {Array} pageMeta Optional meta tag data, for example -- [{name: 'yandex', value: 12345},{name: 'bing', value: 12345}]
 * @param {String} pageTitle Content for the page's title tag
 * @param {Boolean} robots Instructs search engines whether or not we'd like them to crawl the pages and its links
 * @param {String} forcedRobotsContent overrides robots content when is not empty
 * @param {String} route The current route
 * @param {Boolean} isGenerateAlternateLinks Defines if we need to generate alternate link tags for the page
 * @param {String} maxImagePreviewSetting It's a value for the Max Image Preview tag 
 * @module SEOHead
 */
export const SEOHeadComponent = ({
	baseUrl,
	imageUrl,
	ldJson,
	localeCode,
	forcedLocaleCode,
	ogDescription,
	ogTitle,
	pageDescription,
	pageKeywords,
	pageMeta,
	pageTitle,
	robots,
	forcedRobotsContent,
	route,
	isGenerateAlternateLinks,
}) => {
	const metaData = generateMetaData({
		appPath: `meetup:/${route}`,
		baseUrl,
		pageDescription,
		imageUrl,
		localeCode,
		pageKeywords,
		ogTitle,
		ogDescription,
		route,
		pageTitle,
	});

	const metaTags = generateMetaTags([...metaData, ...pageMeta]);

	const canonicalUrlLinkTags = generateCanonicalUrlLinkTags(
		baseUrl,
		localeCode,
		route,
		isGenerateAlternateLinks,
		forcedLocaleCode
	);

	const ldJsonTags = ldJson.map((jsonObj, index) => (
		// eslint-disable-next-line react/no-array-index-key
		<script type="application/ld+json" key={`ldjson-${index}`}>
			{JSON.stringify(jsonObj)}
		</script>
	));

	const getRobotsContent = (robots, forcedRobotsContent) => {
		if (forcedRobotsContent) {
			return forcedRobotsContent;
		}
		return robots ? 'index, follow' : 'noindex, nofollow';
	};

	return (
		<Helmet defaultTitle="Meetup" titleTemplate="%s | Meetup">
			<title>{pageTitle}</title>
			<link rel="image_src" href={imageUrl} />
			<meta
				name="robots"
				content={getRobotsContent(robots, forcedRobotsContent)}
			/>
			{maxImagePreviewSetting && <meta name="robots" content={`max-image-preview:${maxImagePreviewSetting}`}/>}
			{metaTags}
			{canonicalUrlLinkTags}
			{ldJsonTags}
		</Helmet>
	);
};

SEOHeadComponent.propTypes = {
	baseUrl: PropTypes.string.isRequired,
	imageUrl: PropTypes.string,
	ldJson: PropTypes.array,
	localeCode: PropTypes.string,
	ogTitle: PropTypes.string,
	ogDescription: PropTypes.string,
	pageDescription: PropTypes.string,
	pageKeywords: PropTypes.string,
	pageMeta: PropTypes.array,
	pageTitle: PropTypes.string,
	robots: PropTypes.bool,
	route: PropTypes.string.isRequired,
	isGenerateAlternateLinks: PropTypes.bool,
	maxImagePreviewSetting: PropTypes.oneOf(['none', 'standard', 'large']),
};

SEOHeadComponent.defaultProps = {
	pageMeta: [],
	pageTitle: DEFAULT_TITLE,
	imageUrl: DEFAULT_IMAGE_URL,
	ldJson: [],
	localeCode: 'en-US',
	robots: true,
	isGenerateAlternateLinks: true,
};

export default SEOHeadComponent;
