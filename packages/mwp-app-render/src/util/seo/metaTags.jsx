import React from 'react';
import { generateCanonicalUrl } from './links';

export const FB_APP_ID =
	process.env.NODE_ENV === 'production' ? '2403839689' : '36212898404';

export const YANDEX_META = {
	name: 'yandex-verification',
	value: '68c4b420dba9aa42',
};
export const BING_META = {
	name: 'msvalidate.01',
	value: '386E470199B7059A6A790A75D5A03B31',
};

export const TWITTER_APP_ID = '375990038';

export const DEFAULT_IMAGE_URL =
	'https://secure.meetupstatic.com/s/img/286374644891845767035/logo/meetup-logo-script-1200x630.png';

/**
 * Strips new lines and tabs from string + truncates provided
 * @param {String} str String to strip
 * @param {Number} charLen Number of char to truncate string by
 * @return {String} new string
 */
const stripAndTruncate = (str = '', charLen = 200) =>
	str
		.replace(/<(?:.|\n)*?>/gm, '')
		.replace(/\r?\n|\r\t/g, '')
		.substr(0, charLen);

/**
 * Generates array of properties off of object based on array of keys passed
 * @param {Object} item object to get values from
 * @param {Array} keys keys to pull values with
 * @return {Array} array of requested props
 */
export const getKeywordsByProperties = (item, keys) =>
	keys.filter(key => item[key]).map(key => item[key]);

/**
 * Generates keywords from group based on group object
 * @param {Object} group group object from api
 * @return {String} keyword string to use for seo
 */
export const getGroupKeywords = group => {
	const topics = group.topics || [];
	const topicKeywords = topics.map(topic => topic.name);
	const groupKeys = ['name', 'city', 'state', 'country'];
	return [...topicKeywords, ...getKeywordsByProperties(group, groupKeys)].join(
		','
	);
};

export const generateMetaTags = tags =>
	tags.map((meta, index) => <meta {...meta} key={`meta-${index}`} />);

/**
 * Generates array of basic common meta data for all pages
 * @param {String} options.appPath current pages path in apps
 * @param {String} options.baseUrl base url of the current page
 * @param {String} imageUrl An image url that will be applied to several meta tags
 * @param {String} localCode The current localeCode
 * @param {String} options.ogDescription title for og:description
 * @param {String} options.ogTitle title for og:title
 * @param {String} options.pageDescription pageDescription for the current page
 * @param {String} options.pageKeywords pageKeywords for the current page
 * @param {String} options.pageTitle pageTitle for the current page
 * @param {String} route The current route
 * @return {Array} array of meta objects or use by Helmet
 */
export const generateMetaData = ({
	appPath,
	baseUrl,
	imageUrl,
	localeCode,
	ogDescription,
	ogTitle,
	pageDescription,
	pageKeywords,
	pageTitle,
	route,
}) => {
	const desc = stripAndTruncate(pageDescription);
	const ogDesc = stripAndTruncate(ogDescription);

	return [
		{ name: 'description', content: desc },
		{ name: 'keywords', content: pageKeywords },
		{ property: 'fb:app_id', content: FB_APP_ID },
		{ property: 'og:site_name', content: 'Meetup' },
		{ property: 'og:type', content: 'article' },
		{ property: 'og:title', content: ogTitle || pageTitle },
		{ property: 'og:description', content: ogDesc || desc },
		baseUrl && {
			property: 'og:url',
			content: generateCanonicalUrl(baseUrl, localeCode, route),
		},
		{ property: 'og:image', content: imageUrl },
		{ property: 'al:android:app_name', content: 'Meetup' },
		{ property: 'al:android:package', content: 'com.meetup' },
		{ property: 'al:ios:app_store_id', content: TWITTER_APP_ID },
		{ property: 'al:ios:app_name', content: 'Meetup' },
		{ property: 'al:web:should_fallback', content: 'true' },
		appPath && { property: 'al:android:url', content: appPath },
		appPath && { property: 'al:ios:url', content: appPath },
		baseUrl &&
		route && {
			property: 'al:web:url',
			content: generateCanonicalUrl(baseUrl, localeCode, route),
		},
		{ property: 'twitter:card', content: 'summary_large_image' },
		{ property: 'twitter:site', content: '@meetup' },
		{ property: 'twitter:image', content: imageUrl },
		{ property: 'twitter:description', content: desc },
		{ property: 'twitter:app:id:iphone', content: TWITTER_APP_ID },
		{ property: 'twitter:app:name:iphone', content: 'Meetup' },
		{ property: 'twitter:app:id:ipad', content: TWITTER_APP_ID },
		{ property: 'twitter:app:name:ipad', content: 'Meetup' },
		{ property: 'twitter:app:id:googleplay', content: 'com.meetup' },
		{ property: 'twitter:app:name:googleplay', content: 'Meetup' },
	].filter(metaEntry => metaEntry && metaEntry.content);
};

/**
 * Generates array of basic geo meta data
 * @param {Number} options.lat lat of content on page (generally group or event location)
 * @param {Number} options.lon lon of content on page (generally group or event location)
 * @param {String} options.city city of content on page (generally group or event location)
 * @param {String} options.state state of content on page (generally group or event location)
 * @param {String} options.country country of content on page (generally group or event location)
 * @return {Array} array of meta objects for use by Helmet
 */
export const generateGeoMetaData = ({ lat, lon, city, state, country }) => {
	const place = [city, state, country].filter(place => place).join(', ');
	return [
		lat && lon && { property: 'geo.position', content: `${lat};${lon}` }, // MUP coordinates
		{ property: 'geo.placename', content: place },
		{ property: 'geo.region', content: country },
	].filter(metaEntry => metaEntry && metaEntry.content);
};
