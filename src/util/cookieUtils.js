import querystring from 'qs';
import logger from './logger';

const isProd = process.env.NODE_ENV === 'production';
export const MEMBER_COOKIE = isProd ? 'MEETUP_MEMBER' : 'MEETUP_MEMBER_DEV';

export const parseMemberCookie = state => {
	if (!state[MEMBER_COOKIE]) {
		logger.warn('No member cookie found - there might be a problem with auth');
		// no member cookie - always return id=0
		return { id: 0 };
	}
	const member = querystring.parse(state[MEMBER_COOKIE]);
	member.id = parseInt(member.id, 10) || 0;
	return member;
};

