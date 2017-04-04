import Joi from 'joi';

export const querySchema = Joi.object({
	endpoint: Joi.string().required(),
	ref: Joi.string().required(),
	flags: Joi.array(),
	mockResponse: Joi.object(),
	params: Joi.object(),
	type: Joi.string(),
	meta: Joi.object({
		method: Joi.string().valid('get', 'post', 'delete', 'patch').insensitive(),
	}),
});

