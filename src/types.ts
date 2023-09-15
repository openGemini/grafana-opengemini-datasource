import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface GeminiQuery extends DataQuery {
	queryText?: string;
	rawQuery?: boolean;
	readonly query?: string;

	resultFormat?: Formats;
	alias?: string;
	/**retention policies */
	rp?: string;
	fromMeasurement?: string;
	// where
	whereConditions?: WhereStatement[];
}

export enum Formats {
	TimeSeries = 'time_series',
	Table = 'table',
	Logs = 'logs',
}

export type HTTPMethod = 'get' | 'post';

/**
 * These are options configured for each DataSource instance
 */
export interface GeminiOptions extends DataSourceJsonData {
	database: string;
	user?: string;
	password?: string;
	minTimeInterval?: string;
	httpMethod?: HTTPMethod;
	organization?: string;
	defaultBucket?: string;
	maxSeries?: number;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface GeminiSecureJsonData {
	token?: string;

	password?: string;
}

/* where statement type */
export const OPERATORS = ['=', '!=', '>', '<', '>=', '<='] as const;
type Operator = (typeof OPERATORS)[number];

export const CONNECTORS = ['AND', 'OR'] as const;

export type WhereStatement = Readonly<[string, Operator, string | number, 'AND' | 'OR' | undefined]>;
