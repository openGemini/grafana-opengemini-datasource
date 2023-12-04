import { DataQuery, DataSourceJsonData, SelectableValue } from '@grafana/data';

export interface GeminiQuery extends DataQuery {
	queryText?: string;
	rawQuery?: boolean;
	readonly query?: string;

	resultFormat?: Formats;
	alias?: string;
	keywords?: string;
	/**retention policies */
	database?: string;
	rp?: string;
	fromMeasurement?: string;
	// visual query
	whereConditions?: WhereStatement[];
	selectConditions?: SelectCondition[][];
	groupbyConditions?: GroupbyCondition[];
	tz?: string;
	orderByTime?: 'DESC' | 'ASC';
	limit?: string;
	offset?: string;
}

export enum Formats {
	TimeSeries = 'time_series',
	Table = 'table',
	Logs = 'logs',
}

export const OPTION_FORMATS: Array<SelectableValue<Formats>> = [
	{ label: 'Time series', value: Formats.TimeSeries },
	{ label: 'Table', value: Formats.Table },
	{ label: 'Logs', value: Formats.Logs },
];

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
export const OPERATORS = ['=', '!=', '>', '>=', '<', '<=', '<>', '=~', '!~'] as const;
type Operator = (typeof OPERATORS)[number];

export const CONNECTORS = ['AND', 'OR'] as const;

export type WhereStatement = Readonly<[string, Operator, string | number, 'AND' | 'OR' | undefined]>;

/* selected part */
interface BasicCondition {
	type: string;
	params: Array<string | number>;
}

export enum CategoryType {
	Aggregations = 'Aggregations',
	Selectors = 'Selectors',
	Transformations = 'Transformations',
	Predictors = 'Predictors',
	Math = 'Math',
	Aliasing = 'Aliasing',
	Fields = 'Fields',
}

export interface SelectCondition extends BasicCondition {
	category: CategoryType;
}

export interface GroupbyCondition extends BasicCondition {}
