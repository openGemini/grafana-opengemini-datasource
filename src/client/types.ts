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
