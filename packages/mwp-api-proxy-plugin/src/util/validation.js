import Joi from 'joi';

const stringOrArray = Joi.alternatives().try([
	Joi.string(),
	Joi.array().items(Joi.string()),
]);

export const querySchema = Joi.object({
	endpoint: Joi.string().required(),
	ref: Joi.string().required(),
	flags: Joi.array(),
	mockResponse: [Joi.object(), Joi.array()],
	params: Joi.object(), // can be FormData
	type: Joi.string(),
	list: Joi.object({
		dynamicRef: Joi.string(),
		merge: Joi.object({
			isReverse: Joi.bool(),
			sort: Joi.func(),
			idTest: Joi.func(),
		}),
	}),
	meta: Joi.object({
		method: Joi.string()
			.valid('get', 'post', 'delete', 'patch', 'put')
			.insensitive(),
		noCache: Joi.bool(),
		flags: Joi.array(),
		variants: Joi.object().pattern(/\w+/, stringOrArray),
		metaRequestHeaders: Joi.array(),
	}),
});
