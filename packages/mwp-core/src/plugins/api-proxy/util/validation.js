import Joi from 'joi';

const stringOrArray = Joi.alternatives().try([
	Joi.string(),
	Joi.array().items(Joi.string()),
]);

export const querySchema = Joi.object({
	endpoint: Joi.string().required(),
	ref: Joi.string().required(),
	flags: Joi.array(),
	mockResponse: Joi.object(),
	params: Joi.object(), // can be FormData
	type: Joi.string(),
	meta: Joi.object({
		method: Joi.string().valid('get', 'post', 'delete', 'patch').insensitive(),
		flags: Joi.array(),
		variants: Joi.object().pattern(/\w+/, stringOrArray),
		metaRequestHeaders: Joi.array(),
	}),
});
