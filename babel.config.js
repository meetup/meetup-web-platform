module.exports = {
	presets: [
		'@babel/preset-react',
		[
			'@babel/preset-env',
			{
				targets: {
					browsers: ['last 2 versions', 'not ie < 11', 'android >= 4.2'],
				},
			},
		],
	],
	plugins: [
		'@babel/plugin-transform-flow-strip-types',
		'babel-plugin-dynamic-import-node',
		'@babel/plugin-transform-runtime',
		'@babel/plugin-proposal-class-properties',
		
	],
};
