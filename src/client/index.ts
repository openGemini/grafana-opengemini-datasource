import { getBackendSrv, BackendSrvRequest } from '@grafana/runtime';
import { FieldType, DataFrame, MutableDataFrame } from '@grafana/data';
import { lastValueFrom } from 'rxjs';

import { GeminiResponse, SeriesType } from './types';
import { Formats, GeminiOptions, GeminiQuery } from 'types';
import { buildMetaQuery } from './builder';
import { GeminiDataSource } from 'datasource';

export class openGeminiHttpClient {
	baseUrl: string;
	jsonData: GeminiOptions;
	sqlUrl: string;
	rp: string;
	datasource: GeminiDataSource;
	constructor(baseUrl: string, jsonData: GeminiOptions, datasource: GeminiDataSource) {
		this.baseUrl = baseUrl;
		this.jsonData = jsonData;
		this.sqlUrl = `${this.baseUrl}/query`;
		this.datasource = datasource;
		this.rp = '';
	}

	getData(res: GeminiResponse): Array<Array<string | number | boolean>> {
		if (res.results[0].series) {
			return res.results[0].series[0]?.values;
		} else {
			return [[]];
		}
	}

	private async request(options: BackendSrvRequest) {
		const res = await lastValueFrom(getBackendSrv().fetch<GeminiResponse>(options));

		const data = res.data;
		if (data && 'error' in data) {
			throw new Error('request faild');
		}
		return data;
	}

	// querySql overloads
	querySql(sql: string, returnAllData?: false, useDefaultDB?: boolean): Promise<Array<Array<string | number | boolean>>>;
	querySql(sql: string, returnAllData?: true, useDefaultDB?: boolean): Promise<GeminiResponse>;

	async querySql(
		sql: string,
		returnAllData = false,
		useDefaultDB = true,
	): Promise<GeminiResponse | Array<Array<string | number | boolean>>> {
		const { database, user, password, httpMethod } = this.jsonData;
		const res = await this.request({
			url: this.sqlUrl,
			method: httpMethod,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			params: {
				q: sql,
				u: user === '' ? undefined : user,
				p: password === '' ? undefined : password,
				db: database === '' || !useDefaultDB ? undefined : database,
				epoch: 'ms',
			},
		});
		return returnAllData ? res : this.getData(res);
	}

	// show databases
	async showDatabases(): Promise<string[][]> {
		const queryText = buildMetaQuery({ type: 'DATABASES' });
		const databases = await this.querySql(queryText, false, false);

		return databases as string[][];
	}

	// show retention policies
	async getRpInfo(database: string | undefined): Promise<string[][]> {
		const queryText = buildMetaQuery(
			{
				type: 'RETENTION_POLICIES',
				database: database || this.jsonData.database,
			},
			this.datasource.templateSrv,
		);
		const rpInfo = await this.querySql(queryText, false, false);

		return rpInfo as string[][];
	}

	// show measurements
	async showMeasurements(database: string | undefined): Promise<string[][]> {
		const queryText = buildMetaQuery({ type: 'MEASUREMENTS', database: database || this.jsonData.database }, this.datasource.templateSrv);
		const measurement = await this.querySql(queryText, false, false);
		if (!measurement[0].length) {
			measurement[0].push('');
		}

		return measurement as string[][];
	}

	async getTagKeys(fromMeasurement?: string, rp?: string, database?: string): Promise<string[]> {
		const queryText = buildMetaQuery(
			{
				type: 'TAG_KEYS',
				fromMeasurement,
				rp,
				database: database || this.jsonData.database,
			},
			this.datasource.templateSrv,
		);

		const series = (await this.querySql(queryText, true, false)).results[0].series;
		const tagKeys: string[] = [];
		series?.forEach((ser) => {
			ser.values.forEach((tag) => tagKeys.push(tag[0] as string));
		});
		return Array.from(new Set(tagKeys));
	}
	async getFieldKeys(fromMeasurement?: string, rp?: string, database?: string): Promise<string[]> {
		const queryText = buildMetaQuery(
			{
				type: 'FIELD_KEYS',
				fromMeasurement,
				rp,
				database: database || this.jsonData.database,
			},
			this.datasource.templateSrv,
		);
		const series = (await this.querySql(queryText, true, false)).results[0].series;
		const fieldKeys: string[] = [];
		series?.forEach((ser) => {
			ser.values.forEach((field) => fieldKeys.push(field[0] as string));
		});

		return Array.from(new Set(fieldKeys));
	}

	/**
	 * @deprecated
	 * new version sue getTagKeys and getFieldKeys
	 */
	async getColumnConfig(fromMeasurement?: string, rp?: string) {
		let tagSql = 'SHOW TAG KEYS';
		let fieldSql = 'SHOW FIELD KEYS';
		if (fromMeasurement) {
			tagSql += ` FROM ${rp ? rp + '.' : ''}${fromMeasurement}`;
			fieldSql += ` FROM ${rp ? rp + '.' : ''}${fromMeasurement}`;
		}
		// show tag keys
		const tagKeys = (await this.querySql(tagSql)) as string[][];
		let res = tagKeys.map((val) => ({ label: `${val[0]}::tag`, value: `${val[0]}::tag` }));
		// show field keys
		const fieldKeys = (await this.querySql(fieldSql)) as string[][];

		return res.concat(fieldKeys.map((val) => ({ label: `${val[0]}::field`, value: `${val[0]}::field` })));
	}

	async queryData(sql: string, target: GeminiQuery): Promise<DataFrame[]> {
		let { resultFormat } = target;

		resultFormat = resultFormat ?? Formats.TimeSeries;
		const res = (await this.querySql(sql, true)) as GeminiResponse;
		if (!res.results[0].series) {
			return [new MutableDataFrame()];
		}
		let frames: MutableDataFrame[];
		switch (resultFormat) {
			case Formats.Logs:
				frames = resolveTableData(res, target, {
					preferredVisualisationType: 'logs',
					searchWords: target.keywords ? [target.keywords] : undefined,
				});
				break;
			case Formats.Table:
				frames = resolveTableData(res, target);
				break;
			case Formats.TimeSeries:
			default:
				frames = resolveTimeSeries(res, target);
				break;
		}

		return frames;
	}
}

const resolveTimeSeries = (res: GeminiResponse, target: GeminiQuery) => {
	let { refId, alias } = target;
	let frames = res.results[0].series.map((series) => {
		const { values } = series;
		if (!values.length) {
			return new MutableDataFrame();
		}
		// resolve Field column
		let fields = resolveFields(series, Formats.TimeSeries, alias);

		let frame: MutableDataFrame<any>;
		fields = fields.filter((field) => {
			return [FieldType.number, FieldType.time].includes(field.type);
		});
		frame = new MutableDataFrame({ refId, fields });

		return frame;
	});
	return frames;
};

const resolveTableData = (res: GeminiResponse, target: GeminiQuery, meta?: any) => {
	let { refId, alias } = target;
	const series = res.results[0].series;
	if (!series.length) {
		return [new MutableDataFrame()];
	}
	// merge tag columns and field columns
	series.forEach((item) => {
		if (item.tags) {
			const tags = Object.entries(item.tags);
			const tagNames = [],
				tagValues = [];
			for (let i = 0; i < tags.length; i++) {
				tagNames.push(tags[i][0]);
				tagValues.push(tags[i][1]);
			}
			const [timeField, ...rest] = item.columns;
			item.columns = [timeField, ...tagNames, ...rest];
			for (let i = 0; i < item.values.length; i++) {
				item.values[i].splice(1, 0, ...tagValues);
			}
		}
	});

	let fields = resolveFields(series[0], Formats.Table, alias);
	const frame = new MutableDataFrame({ refId, fields, meta });
	for (let i = 1; i < series.length; i++) {
		for (let j = 0; j < series[i].values.length; j++) {
			frame.appendRow(series[i].values[j]);
		}
	}
	return [frame];
};

const resolveFields = (series: SeriesType, format: Formats, alias?: string) => {
	const { columns, values, name } = series;
	return columns.map((column, i) => {
		if (column === 'time') {
			return {
				type: FieldType.time,
				name: 'Time',
				values: values.map((row) => row[i]),
			};
		}
		const firstValidVal = values.find((value) => value[i] !== null);
		let valType = firstValidVal ? typeof firstValidVal[i] : 'number';
		let type = FieldType.number;
		let targetName: string;
		let targetValue = values.map((row) => row[i]);
		switch (valType) {
			case 'string':
				type = FieldType.string;
				break;
			case 'number':
				type = FieldType.number;
				break;
			case 'boolean':
				type = FieldType.boolean;
				break;
			default:
				break;
		}
		if (series.tags) {
			const tags = Object.entries(series.tags).map(([key, value]) => `${key}:${value}`);
			if (format === Formats.TimeSeries) {
				targetName = alias ? resolveAlias(series, alias, i) : `${name}.${column} {${tags.join(', ')}}`;
			} else if (format === Formats.Table) {
				targetName = column;
			} else {
				targetName = `${column}{${tags.join(', ')}}`;
			}
		} else {
			targetName = format === Formats.TimeSeries ? `${name}.${column}` : column;
		}
		return {
			type,
			name: targetName,
			values: targetValue,
		};
	});
};

const resolveAlias = (series: SeriesType, alias: string, index: number) => {
	const regex = /\$(\w+)|\[\[([\s\S]+?)\]\]/g;
	const segments = series.name.split('.');

	return alias.replace(regex, (match: any, group1: any, group2: any) => {
		const group = group1 || group2;
		const segIndex = parseInt(group, 10);

		if (group === 'm' || group === 'measurement') {
			return series.name;
		} else if (group === 'col') {
			return series.columns[index];
		} else if (!isNaN(segIndex)) {
			return segments[segIndex] ?? match;
		} else if (group.indexOf('tag_') !== 0) {
			return match;
		} else if (!series.tags) {
			return match;
		}
		const tag = group.replace('tag_', '');
		return series.tags[tag];
	});
};
