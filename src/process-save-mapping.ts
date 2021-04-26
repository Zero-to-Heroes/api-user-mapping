/* eslint-disable @typescript-eslint/no-use-before-define */
import { ServerlessMysql } from 'serverless-mysql';
import SqlString from 'sqlstring';
import { getConnection } from './db/rds';
import { Input } from './sqs-event';

export default async (event, context): Promise<any> => {
	console.log('received event', event);
	const events: readonly Input[] = (event.Records as any[])
		.map(event => JSON.parse(event.body))
		.reduce((a, b) => a.concat(b), []);

	const mysql = await getConnection();
	for (const ev of events) {
		console.log('processing event', ev);
		await processEvent(ev, mysql);
	}
	await mysql.end();

	const response = {
		statusCode: 200,
		isBase64Encoded: false,
		body: null,
	};
	console.log('sending back success reponse');
	return response;
};

const processEvent = async (input: Input, mysql: ServerlessMysql) => {
	const escape = SqlString.escape;
	const query = `
		INSERT IGNORE INTO user_mapping (userId, userName)
		VALUES (${escape(input.userId)}, ${escape(input.userName)})
	`;
	console.log('prepared query', query);
	await mysql.query(query);
};
