import React, { useMemo } from 'react';
import { SegmentSection, SegmentAsync } from '@grafana/ui';
import type { QueryEditorProps, SelectableValue } from '@grafana/data';
// import { css } from '@emotion/css';

import { DataSource } from 'datasource';
import { GeminiOptions, GeminiQuery } from 'types';
import { buildQuery, toSelectableValue } from '../utils';
// components
import WhereSection from './WhereSection';
import SelectSection from './SelectSection';

// TODO resolve default
export const defaultQuery = {
	queryText: 'SELECT * FROM numbers LIMIT 5',
	selectedColumns: [],
	whereConditions: [],
	groupByColumns: [],
};

type Props = QueryEditorProps<DataSource, GeminiQuery, GeminiOptions>;
export const VisualQueryEditor = (props: Props) => {
	const { datasource, query: curQuery, onChange, onRunQuery } = props;
	const { client } = datasource;

	const query = { ...defaultQuery, ...curQuery };
	const { fromMeasurement, rp, whereConditions } = query;

	const queryChange = <T extends keyof GeminiQuery>(key: T, value: GeminiQuery[T]) => {
		const curQuery = { ...query, [key]: value };
		const sql = buildQuery(curQuery, datasource);

		onChange({ ...curQuery, queryText: sql });
		onRunQuery();
	};

	/* get rp */
	const getRp = useMemo(() => {
		return client.getRpInfo();
	}, [client]);

	const loadRp = async () => {
		const rp = await getRp;
		return rp.map((val) => ({ label: String(val[0]), value: val[0] }));
	};

	const onRpChange = (select: SelectableValue<string>) => {
		queryChange('rp', select.value);
	};

	/* get measurements */
	const getMeasurements = useMemo(() => {
		return client.showMeasurements();
	}, [client]);

	const loadMeasurements = async () => {
		const measurements = await getMeasurements;
		return measurements.map(toSelectableValue);
	};

	const onMeasurementChange = (select: SelectableValue<string>) => {
		queryChange('fromMeasurement', select.value);
	};

	// get columns
	const getColumnConfig = useMemo(() => {
		return client.getColumnConfig(fromMeasurement, rp);
	}, [client, fromMeasurement, rp]);

	const loadColumnNames = async (isAdd = false) => {
		const columnNames = await getColumnConfig;
		const res = columnNames.filter((column) => {
			return whereConditions.every((condition) => condition[0] !== column.value);
		});
		if (!isAdd) {
			res.unshift({ label: '--remove filter--', value: 'remove' });
		}
		return res;
	};

	return (
		<>
			<div className="gf-form-group">
				<SegmentSection label="FROM" fill={true}>
					<SegmentAsync value={rp ?? 'select rp'} onChange={onRpChange} loadOptions={loadRp} />
					<SegmentAsync value={fromMeasurement ?? 'select measurement'} onChange={onMeasurementChange} loadOptions={loadMeasurements} />
					<WhereSection whereConditions={whereConditions} queryChange={queryChange} loadColumnNames={loadColumnNames} />
				</SegmentSection>
				<SelectSection />
			</div>
		</>
	);
};
