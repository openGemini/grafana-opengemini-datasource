import React, { ChangeEvent } from 'react';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { DataSourceHttpSettings, Input, InlineField, Select } from '@grafana/ui';

import { GeminiOptions, GeminiSecureJsonData, HTTPMethod } from '../types';

interface Props extends DataSourcePluginOptionsEditorProps<GeminiOptions, GeminiSecureJsonData> {}

type DetailField = 'database' | 'user' | 'password' | 'minTimeInterval' | 'maxSeries';

export function ConfigEditor(props: Props) {
	const { options, onOptionsChange } = props;
	// gemini details change
	const onDetailChange = (event: ChangeEvent<HTMLInputElement>, field: DetailField) => {
		const jsonData = {
			...options.jsonData,
			[field]: event.target.value,
		};
		onOptionsChange({ ...options, jsonData });
	};

	const onHTTPMethodChange = (item: { label: string; value: HTTPMethod }) => {
		const jsonData = {
			...options.jsonData,
			httpMethod: item.value,
		};
		onOptionsChange({ ...options, jsonData });
	};

	const DETAIL_LABEL_WIDTH = 30;
	const httpMethodOptions: Array<{ label: string; value: HTTPMethod }> = [
		{ label: 'GET', value: 'get' },
		{ label: 'POST', value: 'post' },
	];
	const { jsonData } = options;

	return (
		<>
			{/* http settings */}
			<DataSourceHttpSettings defaultUrl="http://127.0.0.1:8086" dataSourceConfig={options} onChange={onOptionsChange} />
			<div className="gf-form-group">
				<h4>openGemini Details</h4>
				<InlineField label="Database" labelWidth={DETAIL_LABEL_WIDTH}>
					<Input width={40} value={jsonData.database} onChange={(e: ChangeEvent<HTMLInputElement>) => onDetailChange(e, 'database')} />
				</InlineField>
				<InlineField label="HTTP Method" labelWidth={DETAIL_LABEL_WIDTH}>
					<Select
						options={httpMethodOptions}
						value={jsonData.httpMethod}
						onChange={(item) => onHTTPMethodChange(item as { label: string; value: HTTPMethod })}
					/>
				</InlineField>
				<InlineField label="Min time interval" labelWidth={DETAIL_LABEL_WIDTH}>
					<Input
						width={40}
						placeholder="10s"
						value={jsonData.minTimeInterval}
						onChange={(e: ChangeEvent<HTMLInputElement>) => onDetailChange(e, 'minTimeInterval')}
					/>
				</InlineField>
			</div>
		</>
	);
}
