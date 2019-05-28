import { appendClick } from './clickState';
import getClickParser from './clickParser';

// initialize click tracking in a browser context - do not call on server
export default () => {
	const parseClick = getClickParser();
	const handler = e => {
		const clickData = parseClick(e);
		if (!clickData) {
			return;
		}
		appendClick(clickData);
	};
	document.body.addEventListener('click', handler);
	document.body.addEventListener('change', handler);
};
