import { GeminiDataSource } from 'datasource';

export interface GeminiResponse {
	results: Array<{
		statement_id: number;
		series: SeriesType[];
	}>;
}

export interface SeriesType {
	name: string;
	columns: string[];
	values: Array<Array<string | number | boolean>>;
	tags?: Record<string, string>;
}

export type MetadataQueryType = 'TAG_KEYS' | 'TAG_VALUES' | 'DATABASES' | 'MEASUREMENTS' | 'FIELD_KEYS' | 'RETENTION_POLICIES';

export interface MetaDataQuery {
	type: MetadataQueryType;
	datasource: GeminiDataSource;
	fromMeasurement?: string;
	rp?: string;
}
