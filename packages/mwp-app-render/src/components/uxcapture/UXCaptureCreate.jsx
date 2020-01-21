// @flow
import React from 'react';

type callbackType = (label: string) => void;

export default () => {
	const uxCaptureConfigJS = `
		<script>
			if(window.UXCapture) {
				window.UXCapture.create();
			}
		</script>
	`;

	return (
		<div dangerouslySetInnerHTML={{ __html: uxCaptureConfigJS }} /> // eslint-disable-line react/no-danger
	);
};
