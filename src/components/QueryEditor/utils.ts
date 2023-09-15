import { DataSource } from 'datasource';
import { GeminiQuery } from 'types';
import { SelectableValue } from '@grafana/data';

// constructing queryText based on conditions
export const buildQuery = (query: GeminiQuery, datasource: DataSource) => {
	if (query.rawQuery) {
		return query.queryText;
	}

	// const { fromMeasurement } = query;
	let queryText = '';

	return queryText;
};

export function toSelectableValue<T>(value: T): SelectableValue<T> {
	return {
		label: String(value),
		value,
	};
}
