import { GeminiResponse } from 'client/types';
import { each, isArray } from 'lodash';

export const responseParse = (query: string, results: GeminiResponse) => {
	if (!results?.results || results.results.length === 0) {
		return [];
	}
	const influxResults = results.results[0];
	if (!influxResults.series) {
		return [];
	}

	const normalizedQuery = query.toLowerCase();
	const isRetentionPolicyQuery = normalizedQuery.indexOf('show retention policies') >= 0;
	const isValueFirst = normalizedQuery.indexOf('show field keys') >= 0 || isRetentionPolicyQuery;

	const res = new Set<string>();
	each(influxResults.series, (series) => {
		each(series.values, (value) => {
			if (isArray(value)) {
				if (isValueFirst) {
					if (isRetentionPolicyQuery && value[value.length - 1] === true) {
						const newSetValues = [value[0].toString(), ...Array.from(res)];
						res.clear();
						newSetValues.forEach((sv) => res.add(sv));
					} else {
						res.add(value[0].toString());
					}
				} else if (value[1] !== undefined) {
					res.add(value[1].toString());
				} else {
					res.add(value[0].toString());
				}
			}
		});
	});

	return Array.from(res).map((v) => ({ text: v }));
};
