import { of } from 'rxjs';
import { DataSourceInstanceSettings, FieldType, MutableDataFrame } from '@grafana/data';

import { openGeminiHttpClient } from '../../client/index';
import { SeriesType } from '../../client/types';
import { Formats, GeminiOptions } from 'types';
import { GeminiDataSource } from 'datasource';
import { getTemplateSrv } from '@grafana/runtime';

const fetchMock = jest.fn().mockReturnValue(of(createDefaultResponse()));

jest.mock('@grafana/runtime', () => ({
	...(jest.requireActual('@grafana/runtime') as unknown as object),
	getBackendSrv: () => ({
		fetch: fetchMock,
	}),
}));
// jest.mock('rxjs');

describe('client', () => {
	const baseUrl = 'http://localhost:8086';
	const instanceSettings = {
		url: '',
		jsonData: { database: 'NOAA_water_database' },
	} as unknown as DataSourceInstanceSettings<GeminiOptions>;
	const client = new openGeminiHttpClient(
		baseUrl,
		{ database: 'NOAA_water_database', httpMethod: 'post' },
		new GeminiDataSource(instanceSettings, getTemplateSrv()),
	);

	describe('querySql', () => {
		let response1: any, response2: any;
		const defaultResponse = createDefaultResponse().data;
		beforeEach(async () => {
			jest.clearAllMocks();
			const sql = 'SELECT pH FROM measurement ';
			response1 = await client.querySql(sql);
			response2 = await client.querySql(sql, true);
		});
		it('should match the default config', () => {
			expect(fetchMock.mock.calls.length).toBe(2);
			expect(fetchMock.mock.calls[0][0].method).toBe('post');
			expect(fetchMock.mock.calls[0][0].url).toBe(`${baseUrl}/query`);
			expect(response1).toEqual(client.getData(defaultResponse));
		});
		it('should receive all response', () => {
			expect(response2).toEqual(defaultResponse);
		});
	});

	describe('test show measurements func', () => {
		let response: any;
		beforeEach(async () => {
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
			response = await client.showMeasurements('');
		});
		it('should receive a flat array', () => {
			expect(response).toEqual([['h2o_feet'], ['h2o_pH']]);
		});
	});

	describe('test getColumnConfig func', () => {
		let response: any;
		beforeEach(async () => {
			jest.clearAllMocks();
			fetchMock
				.mockImplementationOnce(() =>
					of(
						createDefaultResponse([
							{ name: 'h2o_feet', columns: ['tagKey'], values: [['location']] },
							{ name: 'h2o_pH', columns: ['tagKey'], values: [['location']] },
						]),
					),
				)
				.mockImplementationOnce(() =>
					of(
						createDefaultResponse([
							{
								name: 'h2o_feet',
								columns: ['fieldKey', 'fieldType'],
								values: [
									['level description', 'string'],
									['water_level', 'float'],
								],
							},
							{ name: 'h2o_pH', columns: ['fieldKey', 'fieldType'], values: [['pH', 'float']] },
						]),
					),
				);
			response = await client.getColumnConfig();
		});
		it('should receive all field keys and tag keys', () => {
			expect(fetchMock.mock.calls.length).toBe(2);
			expect(fetchMock.mock.calls[0][0].params.q).toEqual('SHOW TAG KEYS');
			expect(fetchMock.mock.calls[1][0].params.q).toEqual('SHOW FIELD KEYS');
			const target = [
				{ label: 'location::tag', value: 'location::tag' },
				{ label: 'level description::field', value: 'level description::field' },
				{ label: 'water_level::field', value: 'water_level::field' },
			];
			expect(response).toEqual(target);
		});
		it('should receive target measurement keys', async () => {
			jest.clearAllMocks();
			fetchMock
				.mockImplementationOnce(() =>
					of(
						createDefaultResponse([
							{ name: 'h2o_feet', columns: ['tagKey'], values: [['location']] },
							{ name: 'h2o_pH', columns: ['tagKey'], values: [['location']] },
						]),
					),
				)
				.mockImplementationOnce(() =>
					of(
						createDefaultResponse([
							{
								name: 'h2o_feet',
								columns: ['fieldKey', 'fieldType'],
								values: [
									['level description', 'string'],
									['water_level', 'float'],
								],
							},
							{ name: 'h2o_pH', columns: ['fieldKey', 'fieldType'], values: [['pH', 'float']] },
						]),
					),
				);
			await client.getColumnConfig('measurement', 'autogen');
			expect(fetchMock.mock.calls[0][0].params.q).toEqual('SHOW TAG KEYS FROM autogen.measurement');
			expect(fetchMock.mock.calls[1][0].params.q).toEqual('SHOW FIELD KEYS FROM autogen.measurement');
		});
	});

	describe('test meta query', () => {
		describe('show tag keys', () => {
			it('getTagKeys', async () => {
				jest.clearAllMocks();
				fetchMock.mockImplementationOnce(() =>
					of(
						createDefaultResponse([
							{
								name: 'h2o_feet',
								columns: ['fieldKey', 'fieldType'],
								values: [
									['level description', 'string'],
									['water_level', 'float'],
								],
							},
							{ name: 'h2o_pH', columns: ['fieldKey', 'fieldType'], values: [['pH', 'float']] },
						]),
					),
				);
				const res = await client.getFieldKeys('h2o_pH', 'autogen', 'NOAA_water_database');
				expect(fetchMock.mock.calls[0][0].params.q).toEqual('SHOW FIELD KEYS on NOAA_water_database FROM "autogen"."h2o_pH"');
				expect(res).toEqual(['level description', 'water_level', 'pH']);
			});
		});
		describe('show field keys', () => {
			it('getFieldKeys', async () => {
				jest.clearAllMocks();
				fetchMock.mockImplementationOnce(() =>
					of(
						createDefaultResponse([
							{ name: 'h2o_feet', columns: ['tagKey'], values: [['location']] },
							{ name: 'h2o_pH', columns: ['tagKey'], values: [['location']] },
						]),
					),
				);
				const res = await client.getTagKeys('h2o_pH', 'autogen', 'NOAA_water_database');
				expect(fetchMock.mock.calls[0][0].params.q).toEqual('SHOW TAG KEYS on NOAA_water_database FROM "autogen"."h2o_pH"');
				expect(res).toEqual(['location']);
			});
		});
	});

	describe('test queryData Func', () => {
		it('should return empty MutableDataFrame', async () => {
			fetchMock
				.mockImplementationOnce(() =>
					of({
						data: {
							results: [
								{
									statement_id: 0,
								},
							],
						},
					}),
				)
				.mockImplementationOnce(() =>
					of(
						createDefaultResponse([
							{
								name: 'h2o_pH',
								columns: ['time', 'location', 'pH'],
								values: [],
							},
						]),
					),
				);
			const response1 = await client.queryData('SELECT * FROM h2o_pH', { refId: 'A' });
			const response2 = await client.queryData('SELECT * FROM h2o_pH', { refId: 'A' });

			expect(response1[0].fields).toEqual([]);
			expect(response2[0].fields).toEqual([]);
		});
		it('should receive all fields', async () => {
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
			const response = await client.queryData('SELECT * FROM h2o_pH', { refId: 'A', resultFormat: Formats.Table });
			expect(response[0].fields).toEqual(
				new MutableDataFrame({
					fields: [
						{ name: 'Time', type: FieldType.time, values: [1566000000000, 1566000000001] },
						{ name: 'location', type: FieldType.string, values: ['coyote_creek', 'santa_monica'] },
						{ name: 'pH', type: FieldType.number, values: [7, 6] },
					],
				}).fields,
			);
		});
		it('should receive number fields', async () => {
			const response = await client.queryData('SELECT * FROM h2o_pH', { refId: 'A' });
			expect(response[0].fields).toEqual(
				new MutableDataFrame({
					fields: [
						{ name: 'Time', type: FieldType.time, values: [1566000000000, 1566000000001] },
						{ name: 'h2o_pH.pH', type: FieldType.number, values: [7, 6] },
					],
				}).fields,
			);
		});
		it('should receive dataframe with preferredVisualisationType:log', async () => {
			const response = await client.queryData('SELECT * FROM h2o_pH', { refId: 'A', resultFormat: Formats.Logs });
			expect(response[0].fields).toEqual(
				new MutableDataFrame({
					fields: [
						{ name: 'Time', type: FieldType.time, values: [1566000000000, 1566000000001] },
						{ name: 'location', type: FieldType.string, values: ['coyote_creek', 'santa_monica'] },
						{ name: 'pH', type: FieldType.number, values: [7, 6] },
					],
				}).fields,
			);
			expect(response[0].meta).toEqual({ preferredVisualisationType: Formats.Logs });
		});
		it('test series with tags', async () => {
			fetchMock.mockImplementation(() =>
				of(
					createDefaultResponse([
						{
							name: 'h2o_pH',
							columns: ['time', 'pH'],
							tags: { location: 'coyote_creek' },
							values: [
								[1566000000000, 7],
								[1566000000001, 6],
							],
						},
					]),
				),
			);
			const response = await client.queryData('SELECT * FROM h2o_pH', { refId: 'A', resultFormat: Formats.Table });
			const response2 = await client.queryData('SELECT * FROM h2o_pH', { refId: 'A', alias: 'alias' });
			expect(response[0].fields).toEqual(
				new MutableDataFrame({
					fields: [
						{ name: 'Time', type: FieldType.time, values: [1566000000000, 1566000000001] },
						{ name: 'location', type: FieldType.string, values: ['coyote_creek', 'coyote_creek'] },
						{ name: 'pH', type: FieldType.number, values: [7, 6] },
					],
				}).fields,
			);
			expect(response2[0].fields).toEqual(
				new MutableDataFrame({
					fields: [
						{ name: 'Time', type: FieldType.time, values: [1566000000000, 1566000000001] },
						{ name: 'alias', type: FieldType.number, values: [7, 6] },
					],
				}).fields,
			);
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
