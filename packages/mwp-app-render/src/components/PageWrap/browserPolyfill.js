/**
 * @param {String} localeCode the 'xx-XX' language code for the app
 * @return {String} the polyfill.io cdn string
 */
export function polyfillServiceUrl(localeCode) {
	const features = [
		'default-3.6',
		'fetch', // IE, Safari
		'Intl',
		`Intl.~locale.${localeCode}`,
		'Array.prototype.find', // IE
		'Array.prototype.includes', // IE
		'Object.values', // IE, Safari
	];
	const flags = [
		'gated', // use feature detection in addition to user agent test
	];
	return `https://cdn.polyfill.io/v2/polyfill.min.js?features=${features.join()}&flags=${flags.join()}`;
}
