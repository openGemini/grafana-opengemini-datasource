import React, { memo, ChangeEvent, useMemo } from 'react';
import { CodeEditor, HorizontalGroup, Select, InlineField, Input } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';

import { useShadowedState } from './hooks/useShadowedState';
import { GeminiQuery, Formats, OPTION_FORMATS } from 'types';

export type Props = {
	query: GeminiQuery;
	onRunQuery: () => void;
	onChange: (query: GeminiQuery) => void;
};

const DETAIL_LABEL_WIDTH = 15;

const RawQueryEditor = (props: Props) => {
	const { query, onRunQuery, onChange } = props;

	const curFormat = useMemo(() => query.resultFormat ?? Formats.TimeSeries, [query.resultFormat]);
	const [currentAlias, setCurrentAlias] = useShadowedState(query.alias);
	const [currentKeywords, setCurrentKeywords] = useShadowedState(query.keywords);

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

	const RenderKeywords: React.JSX.Element = useMemo(() => {
		const { query, onRunQuery, onChange } = props;
		const onKeywordsBlur = () => {
			onChange({
				...query,
				keywords: currentKeywords,
			});
			onRunQuery();
		};
		if (curFormat === Formats.Logs) {
			return (
				<InlineField label="Keywords" labelWidth={DETAIL_LABEL_WIDTH}>
					<Input
						type="text"
						spellCheck={false}
						placeholder="Text to find"
						value={currentKeywords ?? ''}
						onBlur={onKeywordsBlur}
						onChange={(e: ChangeEvent<HTMLInputElement>) => setCurrentKeywords(e.currentTarget.value)}
					/>
				</InlineField>
			);
		}

		return <></>;
	}, [curFormat, currentKeywords, setCurrentKeywords, props]);
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
				{RenderKeywords}
			</HorizontalGroup>
		</div>
	);
};

export default memo(RawQueryEditor);
