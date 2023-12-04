import { GeminiQuery, WhereStatement } from 'types';
import { SelectableValue } from '@grafana/data';
import { getOperators } from 'components/QueryEditor/VisualQueryEditor/operators';

// constructing queryText based on conditions
export const buildQuery = (query: GeminiQuery) => {
	if (query.rawQuery) {
		return query.queryText;
	}

	// SELECT
	let queryText = 'SELECT ';
	const operators = getOperators();
	const selectConditions = query.selectConditions ?? [];
	selectConditions.forEach((parts, index) => {
		let text = '';
		parts.forEach((part) => {
			const operator = operators[part.type];
			text = operator.renderer(part, text);
		});
		if (index > 0) {
			queryText += ', ';
		}
		queryText += text;
	});
	// FROM
	queryText += ` FROM ${buildFromText(query)} WHERE `;
	// WHERE
	const conditions = query.whereConditions?.map((statement, index) => {
		return buildWhereCondition(statement, index);
	});
	if (conditions && conditions.length > 0) {
		queryText += `(${conditions?.join(' ')}) AND `;
	}
	queryText += '$timeFilter';
	// GROUP BY
	let groupBySection = '';
	query.groupbyConditions?.forEach((part, index) => {
		const operator = operators[part.type];

		if (index > 0) {
			groupBySection += part.type === 'fill' ? ' ' : ', ';
		}
		groupBySection += operator.renderer(part, '');
	});
	if (groupBySection.length > 0) {
		queryText += ` GROUP BY ${groupBySection}`;
	}

	// ORDER BY
	if (query.orderByTime === 'DESC') {
		queryText += ' ORDER BY time DESC';
	}

	// LIMIT
	if (query.limit) {
		queryText += ` LIMIT ${query.limit}`;
	}

	if (query.offset) {
		queryText += ` OFFSET ${query.offset}`;
	}

	if (query.tz) {
		queryText += ` tz('${query.tz}')`;
	}

	return queryText;
};

const buildFromText = (query: GeminiQuery) => {
	let { database, rp, fromMeasurement } = query;

	if (fromMeasurement && !fromMeasurement.match('^/.*/$')) {
		fromMeasurement = '"' + fromMeasurement + '"';
	} else if (!fromMeasurement) {
		fromMeasurement = '"measurement"';
	}
	if (database !== '$database') {
		database = `"${database}"`;
	}
	return `${database}."${rp}".${fromMeasurement}`;
};

export const buildWhereCondition = (statement: WhereStatement, index: number): string => {
	let str = '';
	let [key, operator, value, condition] = statement;
	value = value.toString();
	if (index > 0) {
		str += (condition || 'AND') + ' ';
	}
	if (!operator) {
		operator = /^\/.*\/$/.test(value) ? '=~' : '=';
	}
	if (!['=~', '!~', '>', '<'].includes(operator)) {
		value = "'" + value.replace(/\\/g, '\\\\').replace(/\'/g, "\\'") + "'";
	}
	let escapedKey = `"${key}"`;

	if (key.endsWith('::tag')) {
		escapedKey = `"${key.slice(0, -5)}"::tag`;
	}

	if (key.endsWith('::field')) {
		escapedKey = `"${key.slice(0, -7)}"::field`;
	}
	return `${str}${escapedKey} ${operator} ${value}`;
};

export function toSelectableValue<T>(value: T): SelectableValue<T> {
	return {
		label: String(value),
		value,
	};
}
