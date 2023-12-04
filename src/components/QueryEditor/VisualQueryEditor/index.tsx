import React, { useMemo, memo, useEffect, useState, useCallback } from 'react';
import { SegmentSection, SegmentAsync, InlineLabel, useStyles2, Select, Segment } from '@grafana/ui';
import type { GrafanaTheme2, QueryEditorProps, SelectableValue } from '@grafana/data';
import { css, cx } from '@emotion/css';

import { GeminiDataSource } from 'datasource';
import { CategoryType, GeminiOptions, GeminiQuery, SelectCondition, OPTION_FORMATS, Formats } from 'types';
import { buildQuery, toSelectableValue } from '../../utils';
import { PartParams, getOperatorOptions } from './operators';
import { useSelectConditions } from '../hooks/useSelectConditions';
import { useGroupbyConditions } from '../hooks/useGroupbyConditions';
// components
import WhereSection from './WhereSection';
import SelectAndGroupSection from './SelectAndGroupSection';
import InputSection from './InputSection';
import OrderByTimeSection from './OrderByTimeSection';

// TODO resolve default
export const defaultQuery = {
	queryText: '',
	database: '',
	fromMeasurement: '',
	rp: '',
	selectConditions: [
		[
			{ type: 'field', category: CategoryType.Fields, params: ['value'] },
			{ type: 'mean', category: CategoryType.Aggregations, params: [] },
		],
	] as SelectCondition[][],
	whereConditions: [],
	groupbyConditions: [
		{ type: 'time', params: ['$__interval'] },
		{ type: 'fill', params: ['null'] },
	],
};

export type Props = QueryEditorProps<GeminiDataSource, GeminiQuery, GeminiOptions>;

export type Part = {
	name: string;
	category: CategoryType;
	params: PartParams;
};

const VisualQueryEditor = (props: Props) => {
	const { datasource, query: curQuery, onChange, onRunQuery } = props;
	const { client } = datasource;

	const query = useMemo(() => ({ ...defaultQuery, ...curQuery }), [curQuery]);
	const curFormat = useMemo(() => query.resultFormat ?? Formats.TimeSeries, [query.resultFormat]);

	const styles = useStyles2(getStyles);
	const { selectLists, removeSelectConditions, addSelectConditions, changeSelectCondition } = useSelectConditions({ query, client });

	const queryChange = <T extends keyof GeminiQuery>(key: T, value: GeminiQuery[T]) => {
		if (query[key] === value) {
			return;
		}
		const curQuery = { ...query, [key]: value };
		resolveChange(curQuery);
	};

	const resolveChange = (query: GeminiQuery) => {
		const sql = buildQuery(query);
		onChange({ ...query, queryText: sql });
		onRunQuery();
	};

	const [databaseOptions, setDatabaseOptions] = useState<Array<SelectableValue<string>>>([]);

	/* get databases */
	/* eslint-disable */
	useEffect(() => {
		if(!query.database){
			onChange({...query,database: datasource.instanceSettings.jsonData.database})
		}
		client.showDatabases().then((res) =>{			
			const databases = res.flat(1)
			databases.unshift('$database')
			return setDatabaseOptions(databases.map(toSelectableValue))
		});
		
	}, []);
	/* eslint-disable */

	/* get rp */
	const loadRp = useCallback(async () => {
		if (!query.database) return [];
		const rp = await client.getRpInfo(query.database);

		return rp.map((val) => ({ label: String(val[0]), value: val[0] }));
	}, [client, query.database]);

	/* get measurements */
	const loadMeasurements = useCallback(async () => {		
		if (!query.database) return [];
		const measurements = (await client.showMeasurements(query.database)).flat(1);
		return measurements.map(toSelectableValue);
	}, [client, query.database,datasource]);

	// get columns
	const allKeys = useCallback(async () => {		
		if (!query.database) {
			return Promise.resolve([]);
		}
		return Promise.all([
			client.getTagKeys(query.fromMeasurement, query.rp, query.database),
			client.getFieldKeys(query.fromMeasurement, query.rp, query.database),
		]).then(([tagName, fieldName]) => {
			const tagKeys = tagName.map((name) => ({
				label: `${name}::tag`,
				value: `${name}::tag`,
			}));
			const fieldKeys = fieldName.map((name) => ({
				label: `${name}::field`,
				value: `${name}::field`,
			}));
			const keys = tagKeys.concat(fieldKeys);
			return keys;
		});
	}, [client, query.fromMeasurement, query.rp, query.database,datasource]);

	const loadColumnNames = async (isAdd = false) => {
		const columnNames = await allKeys();
		const res = columnNames.filter((column) => {
			return query.whereConditions.every((condition) => condition[0] !== column.value);
		});
		if (!isAdd) {
			res.unshift({ label: '--remove filter--', value: 'remove' });
		}
		
		return res;
	};

	const getTagKeys = useCallback(
		async () => {
			const selectedTag = query.whereConditions.map((condition) => condition[0]);
			const allTag = (await allKeys()).map((item) => item.value);
			const tagKeys = allTag.filter((tag) => !selectedTag.includes(tag));
			return tagKeys;
		},
		[query.whereConditions, allKeys],
	);
	const { groupByList, getGroupbyOptions, addGroupbyCondition, removeGroupbyCondition, changeGroupbyCondition } = useGroupbyConditions({
		query,
		getTagKeys,
	});

	const onDatabaseChange = (select: SelectableValue) => {		
		const newQuery: GeminiQuery = { ...query, ...defaultQuery, database: select.value };
		onChange(newQuery);
	};

	return (
		<>
			<div>
				{/* FROM */}
				<SegmentSection label="FROM" fill={true}>
					<Segment
						value={query.database || '$database'}
						options={databaseOptions}				
						onChange={(select) => onDatabaseChange(select)}
					/>
					<SegmentAsync value={query.rp || 'select rp'} loadOptions={loadRp} onChange={(select) => queryChange('rp', select.value)} />
					<SegmentAsync
						value={query.fromMeasurement || 'select measurement'}
						onChange={(select) => queryChange('fromMeasurement', select.value)}
						loadOptions={loadMeasurements}
					/>
					{/* WHERE */}
					<WhereSection whereConditions={query.whereConditions} queryChange={queryChange} loadColumnNames={loadColumnNames} />
				</SegmentSection>
				{/* SELECT */}
				{selectLists.map((list, index) => (
					<SegmentSection label={index === 0 ? 'SELECT' : ''} fill={true} key={index}>
						<SelectAndGroupSection
							parts={list}
							getOptions={() => Promise.resolve(getOperatorOptions())}
							onRemove={(i) => resolveChange(removeSelectConditions(i, index))}
							onAddSection={(item) => resolveChange(addSelectConditions(index, item))}
							onChange={(i, params) => resolveChange(changeSelectCondition(index, i, params))}
						/>
					</SegmentSection>
				))}
				{/* GROUP BY */}
				<SegmentSection label="GROUP BY" fill={true}>
					<SelectAndGroupSection
						parts={groupByList}
						getOptions={() => getGroupbyOptions()}
						onRemove={(i) => resolveChange(removeGroupbyCondition(i))}
						onAddSection={(item) => resolveChange(addGroupbyCondition(item))}
						onChange={(i, params) => resolveChange(changeGroupbyCondition(i, params))}
					/>
				</SegmentSection>
				{/* TIMEZONE */}
				<SegmentSection label="TIMEZONE" fill={true}>
					<InputSection placeholder="(optional)" value={query.tz} onChange={(tz) => queryChange('tz', tz)} />
					<OrderByTimeSection
						value={query.orderByTime === 'DESC' ? 'DESC' : 'ASC'}
						onChange={(v) => resolveChange({ ...query, orderByTime: v })}
					/>
				</SegmentSection>
				<SegmentSection label="LIMIT" fill={true}>
					<InputSection placeholder="limit" value={query.limit} onChange={(limit) => queryChange('limit', limit)} />
					<InlineLabel width="auto" className={styles.inlineLabel}>
						OFFSET
					</InlineLabel>
					<InputSection placeholder="offset" value={query.offset} onChange={(offset) => queryChange('offset', offset)} />
				</SegmentSection>
				<SegmentSection label="FORMAT AS" fill={true}>
					<Select
						options={OPTION_FORMATS}
						className={cx(
							'width-8',
							css({
								marginRight: '4px',
								height: '32px',
							}),
						)}
						value={curFormat}
						onChange={(v) => queryChange('resultFormat', v.value)}
					/>
					{query.resultFormat !== Formats.Table && (
						<>
							<InlineLabel width="auto" className={styles.inlineLabel}>
								ALIAS
							</InlineLabel>
							<InputSection
								wide={true}
								placeholder="Naming pattern"
								value={query.alias}
								onChange={(alias) => queryChange('alias', alias)}
							/>
						</>
					)}
					{query.resultFormat === Formats.Logs && (
						<>
							<InlineLabel width="auto" className={styles.inlineLabel}>
								Keywords
							</InlineLabel>
							<InputSection
								wide={true}
								placeholder="Text to find"
								value={query.keywords}
								onChange={(keywords) => queryChange('keywords', keywords)}
							/>
						</>
					)}
				</SegmentSection>
			</div>
		</>
	);
};

function getStyles(theme: GrafanaTheme2) {
	return {
		inlineLabel: css`
			color: ${theme.colors.primary.text};
		`,
	};
}

export default memo(VisualQueryEditor);
