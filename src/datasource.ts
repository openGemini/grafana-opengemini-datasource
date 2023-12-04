import {
	DataQueryRequest,
	DataQueryResponse,
	DataSourceApi,
	DataSourceInstanceSettings,
	MutableDataFrame,
	DateTime,
	dateMath,
	MetricFindValue,
	ScopedVars,
} from '@grafana/data';
import { TemplateSrv, getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';

import { responseParse } from './utils';
import { GeminiQuery, GeminiOptions } from './types';
import { GeminiResponse } from './client/types';
import { openGeminiHttpClient } from './client';

export class GeminiDataSource extends DataSourceApi<GeminiQuery, GeminiOptions> {
	client: openGeminiHttpClient;
	instanceSettings: DataSourceInstanceSettings<GeminiOptions>;
	constructor(instanceSettings: DataSourceInstanceSettings<GeminiOptions>, readonly templateSrv: TemplateSrv = getTemplateSrv()) {
		super(instanceSettings);
		this.instanceSettings = instanceSettings;
		this.templateSrv = templateSrv;
		this.client = new openGeminiHttpClient(instanceSettings.url!, instanceSettings.jsonData, this);
		this.interval = instanceSettings.jsonData.minTimeInterval || '10s';
	}

	async metricFindQuery(query: string, options?: any): Promise<MetricFindValue[]> {
		const queryText = this.templateSrv ? this.templateSrv.replace(query ?? '', options.scopedVars) : query;
		const res = (await this.client.querySql(queryText, true)) as GeminiResponse;
		return responseParse(queryText, res);
	}

	async query(options: DataQueryRequest<GeminiQuery>): Promise<DataQueryResponse> {
		// Return a constant for each query.
		const promise = options.targets.map(async (target) => {
			const query = this.applyTemplateVariables(target, options.scopedVars);
			if (!query.queryText) {
				return new MutableDataFrame();
			}
			const queryText = query.queryText.replace('$timeFilter', this.timeFilter(options));
			const response = await this.client.queryData(queryText, target);
			return response;
		});
		return Promise.all(promise).then((data) => {
			return { data: data.flat(1) };
		});
	}

	timeFilter(options: DataQueryRequest<GeminiQuery>) {
		const from = this.timeTransform(options.rangeRaw?.from, false, options.timezone);
		const to = this.timeTransform(options.rangeRaw?.to, false, options.timezone);

		return 'time >= ' + from + ' and time <= ' + to;
	}

	// Mapping to target values based on variables in queryText
	applyTemplateVariables(query: GeminiQuery, scopedVars: ScopedVars): GeminiQuery {
		if (!this.templateSrv) return query;
		return {
			...query,
			queryText: this.templateSrv.replace(query.queryText ?? '', scopedVars), // The raw query text
		};
	}

	/**
	 *
	 * @param date DateTime or now-xxx
	 */
	timeTransform(date: DateTime | string | undefined, roundUp: boolean, timezone: any) {
		if (!date) return '';
		let outPutDate;
		if (typeof date === 'string') {
			if (date === 'now') {
				return 'now()';
			}

			const parts = /^now-(\d+)([dhms])$/.exec(date);
			if (parts) {
				const amount = parseInt(parts[1], 10);
				const unit = parts[2];
				return 'now() - ' + amount + unit;
			}
			outPutDate = dateMath.parse(date, roundUp, timezone);
			if (!outPutDate) {
				throw new Error('unable to parse date');
			}
			date = outPutDate;
		}
		return date.valueOf() + 'ms';
	}

	async testDatasource() {
		// Implement a health check for your data source.
		const ping = await lastValueFrom(
			getBackendSrv().fetch<GeminiResponse>({
				url: `${this.instanceSettings.url!}/ping`,
				method: 'GET',
				responseType: 'text',
			}),
		);
		if (ping.status !== 204) {
			return {
				status: 'error',
				message: 'Failed to connect to openGemini',
			};
		}
		const databasesRes = await lastValueFrom(
			getBackendSrv().fetch<GeminiResponse>({
				url: `${this.instanceSettings.url!}/query`,
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				params: {
					q: 'SHOW DATABASES',
					u: this.instanceSettings.jsonData.user ? this.instanceSettings.jsonData.user : undefined,
					p: this.instanceSettings.jsonData.password ? this.instanceSettings.jsonData.password : undefined,
					epoch: 'ms',
				},
			}),
		);
		const databases = databasesRes.data.results[0].series[0].values.flat(1);
		if (databases.includes(this.instanceSettings.jsonData.database)) {
			return {
				status: 'success',
				message: 'Success to connect to openGemini',
			};
		} else {
			return {
				status: 'error',
				message: 'database not found',
			};
		}
	}
}
