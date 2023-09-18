import React from 'react';
import { InlineFormLabel, TextArea } from '@grafana/ui';
import { DataSource } from 'datasource';

type Props = {
	query: string;
	datasource: DataSource;
	onChange: (query?: string) => void;
};
const VariableQueryEditor = (props: Props) => {
	const { query, onChange } = props;
	return (
		<div className="gf-form-inline">
			<InlineFormLabel width={10}>Query</InlineFormLabel>
			<div className="gf-form--grow gf-form-inline">
				<TextArea
					className="gf-form-input"
					placeholder="measurements query"
					rows={1}
					defaultValue={query || ''}
					onBlur={(e) => onChange(e.currentTarget.value)}
				/>
			</div>
		</div>
	);
};

export default VariableQueryEditor;
