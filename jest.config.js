module.exports = {
	moduleFileExtensions: ['js', 'jsx', 'json'],
	setupFiles: ['<rootDir>/tests/util/setupTest.js'],
	snapshotSerializers: ['enzyme-to-json/serializer'],
	testEnvironment: 'node',
	testRegex: 'src/.*\\.test\\.jsx?$'
};
