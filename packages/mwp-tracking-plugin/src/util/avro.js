// @flow
const avro = require('avsc');
const uuidv1 = require('uuid/v1');
const AWS = require('aws-sdk');

const sts = new AWS.STS();

const getCrossAccountCredentials = async () => {
	return new Promise((resolve, reject) => {
		const timestamp = new Date().getTime();
		const params = {
			RoleArn: process.env.ASSUME_ROLE_ARN,
			RoleSessionName: `aws-kinesis-${timestamp}`,
		};
		sts.assumeRole(params, (err, data) => {
			if (err) reject(err);
			else {
				resolve({
					accessKeyId: data.Credentials.AccessKeyId,
					secretAccessKey: data.Credentials.SecretAccessKey,
					sessionToken: data.Credentials.SessionToken,
				});
			}
		});
	});
};

const getLogAWSKinesis = (): (string => Promise<void>) => {
	if (process.env.NODE_ENV !== 'production') {
		return async (serializedRecord: string) => {
			Promise.resolve();
		};
	}

	return async (serializedRecord: string) => {
		const accessparams = await getCrossAccountCredentials();
		const options = {
			Data: Buffer.from(serializedRecord),
			PartitionKey: uuidv1(),
			StreamName: process.env.KINESIS_STREAM_NAME,
		};

		const kinesis = new AWS.Kinesis({
			apiVersion: '2013-12-02',
			accessKeyId: accessparams.accessKeyId,
			secretAccessKey: accessparams.secretAccessKey,
			sessionToken: accessparams.sessionToken,
		});

		kinesis.putRecord(options, function(err, data) {
			if (err) {
				console.log("Error sending message to Kinesis: "+ serializedRecord);
				console.log(err, err.stack);
			} else {
				console.log("Kinesis recieved message: " + serializedRecord);
			}
		});
	};
};

const logAWSKinesis = getLogAWSKinesis();
const debugLog = deserializedRecord =>
	console.log(JSON.stringify(deserializedRecord));

// currently the schema is manually copied from
// https://github.dev.meetup.com/meetup/meetup/blob/master/modules/base/src/main/versioned_avro/Click_v2.avsc
const click = {
	namespace: 'com.meetup.base.avro',
	type: 'record',
	name: 'Click',
	doc: 'v2',
	fields: [
		{ name: 'timestamp', type: 'string' },
		{ name: 'requestId', type: 'string' },
		{ name: 'memberId', type: 'int' },
		{ name: 'lineage', type: 'string' },
		{ name: 'linkText', type: 'string' },
		{ name: 'coordX', type: 'int' },
		{ name: 'coordY', type: 'int' },
		{ name: 'tag', type: 'string', default: '' },
	],
};

// currently the schema is manually copied from
// https://github.com/meetup/meetup/blob/master/modules/base/src/main/versioned_avro/Activity_v8.avsc
const activity = {
	namespace: 'com.meetup.base.avro',
	type: 'record',
	name: 'Activity',
	doc: 'v9',
	fields: [
		{ name: 'requestId', type: 'string' },
		{ name: 'timestamp', type: 'string' },
		{ name: 'url', type: 'string' },
		{ name: 'aggregratedUrl', type: 'string', default: '' },
		{ name: 'ip', type: 'string', default: '' },
		{ name: 'agent', type: 'string', default: '' },
		{ name: 'memberId', type: 'int' },
		{ name: 'trackId', type: 'string' },
		{ name: 'mobileWeb', type: 'boolean' },
		{ name: 'platform', type: 'string' },
		{ name: 'referer', type: 'string' },
		{ name: 'trax', type: { type: 'map', values: 'string' } },
		{
			name: 'platformAgent',
			type: {
				type: 'enum',
				name: 'PlatformAgent',
				symbols: [
					'WEB',
					'MUP_WEB',
					'PRO_WEB',
					'NATIVE',
					'NATIVE_APP_WEB_VIEW',
					'THIRD_PARTY_UNKNOWN',
					'UNKNOWN',
				],
			},
			default: 'UNKNOWN',
		},
		{ name: 'isUserActivity', type: 'boolean', default: true },
		{ name: 'browserId', type: 'string', default: '' },
		{ name: 'parentRequestId', type: ['null', 'string'], default: null },
		{ name: 'oauthConsumerId', type: ['null', 'int'], default: null },
		{ name: 'apiVersion', type: ['null', 'string'], default: null },
		{ name: 'viewName', type: ['null', 'string'], default: null },
		{ name: 'subViewName', type: ['null', 'string'], default: null },
		{ name: 'standardized_url', type: ['null', 'string'], default: null },
		{ name: 'standardized_referer', type: ['null', 'string'], default: null },
	],
};

const chapinEnvelope = {
	namespace: 'com.meetup.base.avro',
	type: 'record',
	name: 'AvroEnvelope',
	doc: 'v1',
	fields: [
		{
			name: 'id',
			type: 'string',
		},
		{
			name: 'timestamp',
			type: 'long',
			logicalType: 'timestamp-millis',
		},
		{
			name: 'schemaFullname',
			type: 'string',
		},
		{
			name: 'schemaVersion',
			type: 'string',
		},
		{
			name: 'source',
			type: 'string',
		},
		{
			name: 'data',
			type: 'string',
		},
	],
};

const chapinEnvelopeSerializer: Object => Serializer = schema => {
	const envelopeCodec = avro.parse(chapinEnvelope);
	const codec = avro.parse(schema);
	const analyticsSource = 'WEB';

	return data => {
		const record = codec.toBuffer(data);
		const analytics = {
			id: uuidv1(),
			timestamp: Date.now(),
			schemaFullname: `${schema.namespace}.${schema.name}`,
			schemaVersion: schema.doc,
			source: analyticsSource,
			data: record.toString('base64'),
		};
		return JSON.stringify(
			envelopeCodec.fromBuffer(envelopeCodec.toBuffer(analytics))
		);
	};
};

const chapinEnvelopeDeserializer: Object => Deserializer = schema => {
	const codec = avro.parse(schema);
	return serialized => {
		const { data } = JSON.parse(serialized);
		const avroBuffer = Buffer.from(data, 'base64');
		return codec.fromBuffer(avroBuffer);
	};
};

type Serializer = Object => string;
type Deserializer = string => Object;

const avroSerializer: Object => Serializer = schema => {
	const codec = avro.parse(schema);
	const schemaPath = `gs://meetup-logs/avro_schemas/${schema.name}_${schema.doc}.avsc`;
	return data => {
		const record = codec.toBuffer(data);
		// data.timestamp _must_ be ISOString if it exists
		const timestamp = data.timestamp || new Date().toISOString();
		const analytics = {
			record: record.toString('base64'),
			schema: schemaPath,
			date: timestamp.substr(0, 10), // YYYY-MM-DD
		};
		return JSON.stringify(analytics);
	};
};

const avroDeserializer: Object => Deserializer = schema => {
	const codec = avro.parse(schema);
	return serialized => {
		const { record } = JSON.parse(serialized);
		const avroBuffer = Buffer.from(record, 'base64');
		return codec.fromBuffer(avroBuffer);
	};
};

const logger = (
	serializer: Serializer,
	deserializer: Deserializer,
	logFunc: Function
) => (record: Object) => {
	const serializedRecord = serializer(record);
	const deserializedRecord = deserializer(serializedRecord);
	logFunc(serializedRecord);
	if (process.argv.includes('--debug')) {
		debugLog(deserializedRecord);
	}
};

const schemas = {
	activity,
	click,
};
const serializers = {
	avro: avroSerializer,
	awsavro: chapinEnvelopeSerializer,
	awsactivity: chapinEnvelopeSerializer(schemas.activity),
	awsclick: chapinEnvelopeSerializer(schemas.click),
};
const deserializers = {
	avro: avroDeserializer,
	awsactivity: chapinEnvelopeDeserializer(schemas.activity),
	awsclick: chapinEnvelopeDeserializer(schemas.click),
};
const loggers = {
	awsactivity: logger(
		serializers.awsactivity,
		deserializers.awsactivity,
		logAWSKinesis
	),
	awsclick: logger(serializers.awsclick, deserializers.awsclick, logAWSKinesis),
};

module.exports = {
	avroSerializer,
	getLogAWSKinesis,
	schemas,
	serializers,
	deserializers,
	loggers,
};
