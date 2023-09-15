import { of, lastValueFrom } from 'rxjs';
import { DataQueryRequest, DataSourceInstanceSettings, dateMath } from '@grafana/data';

import { DataSource } from '../datasource';
import type { GeminiOptions, GeminiQuery } from '../types';
import type { SeriesType } from 'client/types';

const fetchMock = jest.fn().mockReturnValue(of(createDefaultResponse));

jest.mock('@grafana/runtime', () => ({
	...(jest.requireActual('@grafana/runtime') as unknown as object),
	getBackendSrv: () => ({
		fetch: fetchMock,
	}),
}));

// const getAdhocFiltersMock = jest.fn().mockImplementation(() => []);
// const replaceMock = jest.fn().mockImplementation((a: string) => a);

// const templateSrcStub = {
// 	getAdhocFilters: getAdhocFiltersMock,
// 	replace: replaceMock,
// } as unknown as TemplateSrv;

describe('openGeminiDataSource', () => {
	// const ctx: any = {
	// 	instanceSettings: { url: 'url', name: 'openGemini' },
	// };
	let ds: DataSource;
	const instanceSettings = {
		url: '',
		jsonData: { database: 'NOAA_water_database' },
	} as unknown as DataSourceInstanceSettings<GeminiOptions>;

	beforeEach(() => {
		jest.clearAllMocks();
		ds = new DataSource(instanceSettings);
	});

	describe('When issuing metricFindQuery', () => {
		const query = 'SHOW MEASUREMENTS';
		it('should receive a MetricFindValue', async () => {
			fetchMock.mockImplementation(() =>
				of(
					createDefaultResponse([
						{
							name: 'measurements',
							columns: ['name'],
							values: [['h2o_feet'], ['h2o_pH']],
						},
					]),
				),
			);
			const response = await ds.metricFindQuery(query);
			expect(response).toEqual([{ text: 'h2o_feet' }, { text: 'h2o_pH' }]);
		});
		it('should not includes time field', async () => {
			fetchMock.mockImplementation(() => of(createDefaultResponse()));
			const response = await ds.metricFindQuery(query);
			expect(response).toEqual([{ text: '7' }]);
		});
	});

	describe('test testDatasource func', () => {
		describe('when openGemini is off', () => {
			let response: any;
			beforeEach(async () => {
				jest.clearAllMocks();
				fetchMock.mockImplementation(() => of({ status: 502 }));
				response = await ds.testDatasource();
			});
			it('should return error msg', async () => {
				const { status } = (await lastValueFrom(fetchMock.mock.results[0].value)) as any;
				expect(status).toBe(502);
				expect(response).toEqual({
					status: 'error',
					message: 'Failed to connect to openGemini',
				});
			});
		});
		describe('when openGemini is on but database incorrect', () => {
			let response: any;
			beforeEach(async () => {
				jest.clearAllMocks();
				fetchMock
					.mockImplementationOnce(() => of({ status: 204 }))
					.mockImplementationOnce(() =>
						of(
							createDefaultResponse([
								{
									name: 'databases',
									columns: ['name'],
									values: [['NOAA_water_database'], ['_internal']],
								},
							]),
						),
					);
				ds.instanceSettings.jsonData.database = 'incorrect_name';
				response = await ds.testDatasource();
				ds.instanceSettings.jsonData.database = 'NOAA_water_database';
			});
			it('should return error msg', async () => {
				const pingRes = (await lastValueFrom(fetchMock.mock.results[0].value)) as any;
				expect(pingRes.status).toBe(204);
				expect(response).toEqual({
					status: 'error',
					message: 'database not found',
				});
			});
		});

		describe('when openGemini is on && database correct', () => {
			let response: any;
			beforeEach(async () => {
				jest.clearAllMocks();
				fetchMock
					.mockImplementationOnce(() => of({ status: 204 }))
					.mockImplementationOnce(() =>
						of(
							createDefaultResponse([
								{
									name: 'databases',
									columns: ['name'],
									values: [['NOAA_water_database'], ['_internal']],
								},
							]),
						),
					);
				response = await ds.testDatasource();
			});
			it('should return success msg', async () => {
				const pingRes = (await lastValueFrom(fetchMock.mock.results[0].value)) as any;
				expect(pingRes.status).toBe(204);
				expect(response).toEqual({
					status: 'success',
					message: 'Success to connect to openGemini',
				});
			});
		});
	});

	describe('test query func', () => {
		describe('when queryTest is empty', () => {
			const options = {
				targets: [{ queryText: '', refId: 'xxx' }],
			} as DataQueryRequest<GeminiQuery>;
			it('should receive empty MutableDataFrame', async () => {
				const response = await ds.query(options);
				expect(response.data[0].fields).toEqual([]);
			});
		});

		describe('when queryTest include $timeFilter', () => {
			// let response: any;
			beforeEach(async () => {
				jest.clearAllMocks();
				fetchMock.mockImplementation(() =>
					of(
						createDefaultResponse([
							{
								name: 'h2o_pH',
								columns: ['time', 'location', 'pH'],
								values: [
									[1566000000000, 'coyote_creek', 7],
									[1566000000001, 'santa_monica', 6],
								],
							},
						]),
					),
				);
			});
			it('should replace $timeFilter ', async () => {
				const options = {
					targets: [{ queryText: 'SELECT * FROM h2o_pH WHERE $timeFilter', refId: 'xxx' }],
					rangeRaw: {
						from: '2023-01-01T00:00:00Z',
						to: '2023-01-02T00:00:00Z',
					},
					timezone: 'UTC',
				} as DataQueryRequest<GeminiQuery>;
				await ds.query(options);
				expect(fetchMock.mock.calls[0][0].params.q).toBe('SELECT * FROM h2o_pH WHERE time >= 1672531200000ms and time <= 1672617600000ms');
			});
			it('should replace $timeFilter with now() ', async () => {
				const options = {
					targets: [{ queryText: 'SELECT * FROM h2o_pH WHERE $timeFilter', refId: 'xxx' }],
					rangeRaw: {
						from: '2023-01-01T00:00:00Z',
						to: 'now',
					},
					timezone: 'UTC',
				} as DataQueryRequest<GeminiQuery>;
				await ds.query(options);
				expect(fetchMock.mock.calls[0][0].params.q).toBe('SELECT * FROM h2o_pH WHERE time >= 1672531200000ms and time <= now()');
			});
			it('should replace $timeFilter with now() - 2d & now() ', async () => {
				const options = {
					targets: [{ queryText: 'SELECT * FROM h2o_pH WHERE $timeFilter', refId: 'xxx' }],
					rangeRaw: {
						from: 'now-2d',
						to: 'now',
					},
					timezone: 'UTC',
				} as DataQueryRequest<GeminiQuery>;
				await ds.query(options);
				expect(fetchMock.mock.calls[0][0].params.q).toBe('SELECT * FROM h2o_pH WHERE time >= now() - 2d and time <= now()');
			});
			it('should replace $timeFilter with UTC time & now() ', async () => {
				const nowTime = dateMath.parse('now-2y', false, 'UTC')!.valueOf();
				const response = ds.timeTransform('now-2y', false, 'UTC');

				expect(nowTime - Number(response.slice(0, 13))).toBeLessThanOrEqual(3);
			});
		});

		describe('when curForm = time_series', () => {
			beforeEach(() => {
				fetchMock.mockImplementation(() =>
					of(
						createDefaultResponse([
							{
								name: 'h2o_pH',
								columns: ['time', 'location', 'pH'],
								values: [
									[1566000000000, 'coyote_creek', 7],
									[1566000000001, 'santa_monica', 6],
								],
							},
						]),
					),
				);
			});
			it('should receive number fields', async () => {
				const options = {
					targets: [{ queryText: 'SELECT * FROM h2o_pH', refId: 'xxx', resultFormat: 'time_series' }],
				} as DataQueryRequest<GeminiQuery>;
				const response = await ds.query(options);
				expect(response.data[0].fields.length).toEqual(2);
			});
			it('should receive all fields', async () => {
				const options = {
					targets: [{ queryText: 'SELECT * FROM h2o_pH', refId: 'xxx', resultFormat: 'table' }],
				} as DataQueryRequest<GeminiQuery>;
				const response = await ds.query(options);
				expect(response.data[0].fields.length).toEqual(3);
			});
		});
	});
});

function createDefaultResponse(series?: SeriesType[]) {
	return {
		data: {
			results: [
				{
					statement_id: 0,
					series: series
						? series
						: [
								{
									name: 'test_measurement',
									columns: ['time', 'value'],
									values: [[1566000000000, 7]],
								},
						  ],
				},
			],
		},
	};
}
