import React, { useMemo } from 'react';
import { css } from '@emotion/css';
// import { InlineField, Input } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';

import { GeminiDataSource } from '../../datasource';
import { GeminiOptions, GeminiQuery } from '../../types';
// components
import RawQueryEditor from './RawQueryEditor';
import ModeSwitcher from './ModeSwitcher';
import VisualQueryEditor from './VisualQueryEditor';
import { buildQuery } from 'components/utils';

export type Props = QueryEditorProps<GeminiDataSource, GeminiQuery, GeminiOptions>;

export function QueryEditor(props: Props) {
	const { query, onChange, onRunQuery } = props;
	const modeChange = (value: boolean) => {
		onChange({ ...query, queryText: buildQuery(query), rawQuery: value });
		onRunQuery();
	};

	const CurrentEditor = useMemo(() => {
		const { query, onChange, onRunQuery } = props;
		if (query.rawQuery) {
			return <RawQueryEditor query={query} onChange={onChange} onRunQuery={onRunQuery}></RawQueryEditor>;
		} else {
			return <VisualQueryEditor {...props}></VisualQueryEditor>;
		}
	}, [props]);

	return (
		<div className={css({ display: 'flex' })}>
			<div className={css({ flexGrow: 1 })}>{CurrentEditor}</div>
			<ModeSwitcher isRaw={query.rawQuery ?? false} onChange={modeChange} />
		</div>
	);
}
