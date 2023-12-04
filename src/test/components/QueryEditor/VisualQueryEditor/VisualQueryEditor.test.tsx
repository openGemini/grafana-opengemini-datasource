import React from 'react';
import { of } from 'rxjs';
import { render, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';
import { DataSourceInstanceSettings } from '@grafana/data';

import VisualQueryEditor, { Props, defaultQuery } from 'components/QueryEditor/VisualQueryEditor';
import { GeminiDataSource } from 'datasource';
import { CategoryType, Formats, type GeminiOptions, type GeminiQuery } from 'types';
import type { SeriesType } from 'client/types';

const fetchMock = jest.fn().mockReturnValue(of(createDefaultResponse));

jest.mock('@grafana/runtime', () => ({
	...(jest.requireActual('@grafana/runtime') as unknown as object),
	getBackendSrv: () => ({
		fetch: fetchMock,
	}),
}));

const instanceSetting = {
	url: '',
	jsonData: { database: 'NOAA_water_database' },
} as unknown as DataSourceInstanceSettings<GeminiOptions>;
const datasource = new GeminiDataSource(instanceSetting);

const setup = (options?: Partial<GeminiQuery>) => {
	const onChange = jest.fn();
	const props: Props = {
		datasource: datasource,
		query: { database: 'monitor', ...options } as GeminiQuery,
		onChange,
		onRunQuery: () => {},
	};
	const res = render(<VisualQueryEditor {...props} />);
	return { onChange, ...res };
};

describe('VisualQueryEditor', () => {
	beforeEach(() => {
		fetchMock.mockImplementationOnce(() =>
			of(
				createDefaultResponse([
					{
						name: 'databases',
						columns: ['name'],
						values: [['database1'], ['database2'], ['monitor']],
					},
				]),
			),
		);
	});
	it('should rendering normally', async () => {
		const { container, getByText } = setup();
		await waitFor(() => {
			expect(container.textContent).toBe(
				'FROMmonitorselect rpselect measurementWHERE+' +
					'SELECTfield(value)mean()+' +
					'GROUP BYtime($__interval)fill(null)+' +
					'TIMEZONEORDER BY TIMEascending' +
					'LIMITOFFSET' +
					'FORMAT ASTime seriesALIAS',
			);
			expect(getByText('FROM')).toBeInTheDocument();
			expect(getByText('WHERE')).toBeInTheDocument();
			expect(getByText('SELECT')).toBeInTheDocument();
			expect(getByText('GROUP BY')).toBeInTheDocument();
			expect(getByText('TIMEZONE')).toBeInTheDocument();
			expect(getByText('ORDER BY TIME')).toBeInTheDocument();
			expect(getByText('LIMIT')).toBeInTheDocument();
			expect(getByText('OFFSET')).toBeInTheDocument();
			expect(getByText('FORMAT AS')).toBeInTheDocument();
			expect(getByText('ALIAS')).toBeInTheDocument();
		});
	});

	describe('From Func', () => {
		it('should rendering select option when click', async () => {
			const { getByText, onChange } = setup();
			fetchMock
				.mockImplementationOnce(() =>
					of(
						createDefaultResponse([
							// @ts-ignore
							{
								columns: ['name'],
								values: [['autogen']],
							},
						]),
					),
				)
				.mockImplementationOnce(() =>
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
			await waitFor(async () => {
				await userEvent.click(getByText('select rp'));
				expect(getByText('autogen')).toBeInTheDocument();
				await userEvent.click(getByText('select measurement'));
				expect(getByText('h2o_feet')).toBeInTheDocument();
				expect(getByText('h2o_pH')).toBeInTheDocument();
				await userEvent.click(getByText('h2o_pH'));
				expect(onChange.mock.calls[0][0].fromMeasurement).toBe('h2o_pH');
			});
		});
		it('should clear WHERE,SELECT,GROUP BY when change database', async () => {
			const { getByText, onChange } = setup();
			await waitFor(async () => {
				expect(getByText('monitor')).toBeInTheDocument();
				await userEvent.click(getByText('monitor'));
				expect(getByText('database1')).toBeInTheDocument();
				await userEvent.click(getByText('database1'));
				expect(onChange).toBeCalledWith({ ...defaultQuery, database: 'database1' });
			});
		});
	});

	describe('Where Func', () => {
		it('should rendering normally', async () => {
			const { getByText, getAllByText } = setup();
			await waitFor(() => {
				expect(getByText('WHERE')).toBeInTheDocument();
				expect(getAllByText('+')[0]).toBeInTheDocument();
			});
		});
		it('should rendering select option when click', async () => {
			const { getByText, getAllByText } = setup();
			fetchMock
				.mockImplementationOnce(() =>
					of(
						createDefaultResponse([
							{
								name: 'h2o_feet',
								columns: ['tagKey'],
								values: [['tagKey1'], ['tagKey2']],
							},
							{
								name: 'h2o_pH',
								columns: ['tagKey'],
								values: [['tagKey3'], ['tagKey4']],
							},
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
									['fieldKey1', 'float'],
									['fieldKey2', 'float'],
								],
							},
							{
								name: 'h2o_pH',
								columns: ['fieldKey', 'fieldType'],
								values: [
									['fieldKey1', 'float'],
									['fieldKey2', 'float'],
								],
							},
						]),
					),
				);
			expect(getAllByText('+')[0]).toBeInTheDocument();

			await waitFor(async () => {
				await userEvent.click(getAllByText('+')[0]);
				expect(getByText('tagKey1::tag')).toBeInTheDocument();
			});
		});
	});

	describe('Select', () => {
		it('should rendering normally', async () => {
			const { getByText } = setup({
				selectConditions: [
					[
						{ type: 'field', category: CategoryType.Fields, params: ['value'] },
						{ type: 'mean', category: CategoryType.Aggregations, params: [] },
					],
				],
			});
			await waitFor(() => {
				expect(getByText('field')).toBeInTheDocument();
				expect(getByText('value')).toBeInTheDocument();
				expect(getByText('mean')).toBeInTheDocument();
			});
		});
	});
	describe('Format as', () => {
		it('should render alias', async () => {
			const { getByText } = setup({ resultFormat: Formats.TimeSeries });
			await waitFor(() => {
				expect(getByText('Time series')).toBeInTheDocument();
				expect(getByText('ALIAS')).toBeInTheDocument();
			});
		});
		it('should hidden alias', async () => {
			const { getByText, queryByText } = setup({ resultFormat: Formats.Table });
			await waitFor(() => {
				expect(getByText('Table')).toBeInTheDocument();
				expect(queryByText('ALIAS')).toBe(null);
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
