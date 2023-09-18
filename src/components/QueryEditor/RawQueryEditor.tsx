import React, { memo, ChangeEvent } from 'react';
import { CodeEditor, HorizontalGroup, Select, InlineField, Input } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { useShadowedState } from './hooks/useShadowedState';

import { GeminiQuery, Formats } from 'types';

type Props = {
	query: GeminiQuery;
	onRunQuery: () => void;
	onChange: (query: GeminiQuery) => void;
};

const DETAIL_LABEL_WIDTH = 15;

const OPTION_FORMATS: Array<SelectableValue<Formats>> = [
	{ label: 'Time series', value: Formats.TimeSeries },
	{ label: 'Table', value: Formats.Table },
	{ label: 'Logs', value: Formats.Logs },
];

const RawQueryEditor = (props: Props) => {
	const { query, onRunQuery, onChange } = props;
	const curFormat = query.resultFormat ?? 'time_series';
	const [currentAlias, setCurrentAlias] = useShadowedState(query.alias);

	// dashboard: influxdb config Compatible
	if (!query.queryText && query.query) {
		onChange({
			...query,
			queryText: query.query,
		});
	}

	const onFormatChange = (v: SelectableValue) => {
		onChange({ ...query, resultFormat: v.value });
		onRunQuery();
	};

	const onQueryChange = (queryText: string) => {
		onChange({
			...query,
			queryText,
		});
		onRunQuery();
	};

	const onAliasChange = () => {
		onChange({
			...query,
			alias: currentAlias,
		});
		onRunQuery();
	};

	return (
		<div>
			<CodeEditor
				language="sql"
				height="100px"
				value={query.queryText ?? ''}
				showMiniMap={false}
				showLineNumbers={true}
				onBlur={onQueryChange}
				onSave={onQueryChange}
			/>
			<HorizontalGroup>
				<InlineField label="Format as" labelWidth={DETAIL_LABEL_WIDTH}>
					<Select options={OPTION_FORMATS} value={curFormat} onChange={onFormatChange} />
				</InlineField>
				<InlineField label="Alias by" labelWidth={DETAIL_LABEL_WIDTH}>
					<Input
						type="text"
						spellCheck={false}
						placeholder="Name pattern"
						value={currentAlias ?? ''}
						onBlur={onAliasChange}
						onChange={(e: ChangeEvent<HTMLInputElement>) => setCurrentAlias(e.currentTarget.value)}
					/>
				</InlineField>
			</HorizontalGroup>
		</div>
	);
};

export default memo(RawQueryEditor);
