import React from 'react';
import { css } from '@emotion/css';
// import { InlineField, Input } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from '../../datasource';
import { GeminiOptions, GeminiQuery } from '../../types';
// components
import RawQueryEditor from './RawQueryEditor';
// import { ModeSwitcher } from './ModeSwitcher';
// import { VisualQueryEditor } from './VisualQueryEditor';

type Props = QueryEditorProps<DataSource, GeminiQuery, GeminiOptions>;

export function QueryEditor(props: Props) {
	const { query, onChange, onRunQuery } = props;
	// const modeChange = (value: boolean) => {
	// 	// TODO buildRawQuery
	// 	onChange({ ...query, queryText: '', rawQuery: value });
	// 	onRunQuery();
	// };

	const CurrentEditor = () => {
		// if (query.rawQuery) {
		// 	return <RawQueryEditor query={query} onChange={onChange} onRunQuery={onRunQuery}></RawQueryEditor>;
		// } else {
		// 	return <VisualQueryEditor {...props}></VisualQueryEditor>;
		// }
		return <RawQueryEditor query={query} onChange={onChange} onRunQuery={onRunQuery}></RawQueryEditor>;
	};

	return (
		<div className={css({ display: 'flex' })}>
			<div className={css({ flexGrow: 1 })}>
				<CurrentEditor />
			</div>
			{/* <ModeSwitcher isRaw={query.rawQuery ?? false} onChange={modeChange} /> */}
		</div>
	);
}
