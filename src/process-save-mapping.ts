/* eslint-disable @typescript-eslint/no-use-before-define */
import { ServerlessMysql } from 'serverless-mysql';
import SqlString from 'sqlstring';
import { getConnection } from './db/rds';
import { Input } from './sqs-event';

export default async (event, context): Promise<any> => {
	const events: readonly Input[] = (event.Records as any[])
		.map(event => JSON.parse(event.body))
		.reduce((a, b) => a.concat(b), []);

	const mysql = await getConnection();
	for (const ev of events) {
		await processEvent(ev, mysql);
	}
	await mysql.end();

	const response = {
		statusCode: 200,
		isBase64Encoded: false,
		body: null,
	};
	return response;
};

const processEvent = async (input: Input, mysql: ServerlessMysql) => {
	const escape = SqlString.escape;
	const query = `
		INSERT IGNORE INTO user_mapping (userId, userName)
		VALUES (${escape(input.userId)}, ${escape(input.userName)})
	`;
	await mysql.query(query);
};
