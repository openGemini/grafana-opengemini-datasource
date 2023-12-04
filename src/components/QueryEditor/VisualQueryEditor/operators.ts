import { SelectableValue } from '@grafana/data';
import { toSelectableValue } from 'components/utils';
import { clone, map } from 'lodash';
import { CategoryType, GeminiQuery, GroupbyCondition, SelectCondition } from 'types';

interface Category {
	Aggregations: any[];
	Selectors: any[];
	Transformations: any[];
	Predictors: any[];
	Math: any[];
	Aliasing: any[];
	Fields: any[];
}
export type PartParams = Array<{
	value: string;
	options: (() => Promise<string[]>) | null;
}>;

type GroupbyCategory = 'GroupbyCategory';

type Operator = {
	type: string;
	category: CategoryType | GroupbyCategory;
	defaultParams: Array<string | number>;
	params: any;
	addStrategy?: any;
	renderMode?: string;
	renderer: any;
};

const operators: Record<string, Operator> = {};

const categories: Category = { Aggregations: [], Selectors: [], Transformations: [], Predictors: [], Math: [], Aliasing: [], Fields: [] };

const groupByCategory = [];

function register(options: Operator, isOperator = true) {
	operators[options.type] = options;
	if (isOperator) {
		categories[options.category as CategoryType].push(operators[options.type]);
	} else {
		groupByCategory.push(options);
	}
}
// render functions
function fieldRenderer(part: SelectCondition) {
	const fieldValue = part.params[0] as string;

	if (fieldValue === '*') {
		return '*';
	}

	let fieldText = `"${fieldValue}"`;
	if (fieldValue.endsWith('::tag')) {
		fieldText = `"${fieldValue.slice(0, -5)}"::tag`;
	}

	if (fieldValue.endsWith('::field')) {
		fieldText = `"${fieldValue.slice(0, -7)}"::field`;
	}

	return fieldText;
}
function functionRenderer(conditions: SelectCondition, text: string) {
	const params = conditions.params.slice();
	if (text) {
		params.unshift(text);
	}
	return `${conditions.type}(${params.join(', ')})`;
}
function suffixRenderer(conditions: SelectCondition, text: string) {
	return `${text} ${conditions.params[0]}`;
}
function aliasRenderer(part: SelectCondition, text: string) {
	return `${text} AS "${part.params[0]}"`;
}

// add functions
function addField(conditions: SelectCondition[], newItem: SelectCondition, query: GeminiQuery) {
	const newConditions = map(conditions, (part) => {
		return clone(part);
	});
	query.selectConditions?.push(newConditions);
}
function addAggregations(conditions: SelectCondition[], newItem: SelectCondition) {
	for (let i = 0; i < conditions.length; i++) {
		const part = conditions[i];
		if (part.category === CategoryType.Aggregations) {
			if (part.type === newItem.type) {
				return;
			}
			// count and distinct can coexist
			if (part.type === 'count' && newItem.type === 'distinct') {
				break;
			}
			if (part.type === 'distinct') {
				const isNotLast = conditions.length > i + 1;
				if (newItem.type !== 'count' && isNotLast) {
					const nextPart = conditions[i + 1];
					if (nextPart.category === CategoryType.Aggregations) {
						conditions.splice(i + 1, 1);
					}
				} else if (newItem.type === 'count') {
					if (!isNotLast || conditions[i + 1].type !== 'count') {
						conditions.splice(i + 1, 0, newItem);
					}
					return;
				}
			}
			// replace
			conditions[i] = newItem;
			return;
		}
		if (part.category === CategoryType.Selectors) {
			conditions[i] = newItem;
			return;
		}
	}

	conditions.splice(1, 0, newItem);
}
function addTransformation(conditions: SelectCondition[], newItem: SelectCondition) {
	// insert transformations before math and alias
	let i = 0;
	for (; i < conditions.length; i++) {
		const part = conditions[i];
		if (part.category === CategoryType.Math || part.category === CategoryType.Aliasing) {
			break;
		}
	}
	conditions.splice(i, 0, newItem);
}

function addMath(conditions: SelectCondition[], newItem: SelectCondition) {
	const count = conditions.length;
	if (count > 0) {
		if (conditions[count - 1].category === CategoryType.Math) {
			// if math is the last part, push it
			conditions.push(newItem);
			return;
		} else if (count > 1 && conditions[count - 2].category === CategoryType.Math) {
			conditions.splice(count - 2, 0, newItem);
			return;
		} else if (conditions[count - 1].category === CategoryType.Aliasing) {
			// insert math before alias
			conditions.splice(count - 1, 0, newItem);
			return;
		}
	}
	conditions.push(newItem);
}

function addAlias(conditions: SelectCondition[], newItem: SelectCondition) {
	const count = conditions.length;
	if (count > 0 && conditions[count - 1].category === CategoryType.Aliasing) {
		// if math is the last part, replace
		conditions[count - 1] = newItem;
		return;
	}
	conditions.push(newItem);
}

register({
	type: 'field',
	addStrategy: addField,
	category: CategoryType.Fields,
	params: [{ type: 'field', dynamicLookup: true }],
	defaultParams: ['value'],
	renderer: fieldRenderer,
});

// Aggregations
register({
	type: 'count',
	addStrategy: addAggregations,
	category: CategoryType.Aggregations,
	params: [],
	defaultParams: [],
	renderer: functionRenderer,
});
register({
	type: 'distinct',
	addStrategy: addAggregations,
	category: CategoryType.Aggregations,
	params: [],
	defaultParams: [],
	renderer: functionRenderer,
});

register({
	type: 'integral',
	addStrategy: addAggregations,
	category: CategoryType.Aggregations,
	params: [],
	defaultParams: [],
	renderer: functionRenderer,
});

register({
	type: 'mean',
	addStrategy: addAggregations,
	category: CategoryType.Aggregations,
	params: [],
	defaultParams: [],
	renderer: functionRenderer,
});

register({
	type: 'median',
	addStrategy: addAggregations,
	category: CategoryType.Aggregations,
	params: [],
	defaultParams: [],
	renderer: functionRenderer,
});

register({
	type: 'mode',
	addStrategy: addAggregations,
	category: CategoryType.Aggregations,
	params: [],
	defaultParams: [],
	renderer: functionRenderer,
});

register({
	type: 'sum',
	addStrategy: addAggregations,
	category: CategoryType.Aggregations,
	params: [],
	defaultParams: [],
	renderer: functionRenderer,
});

// transformations

register({
	type: 'derivative',
	addStrategy: addTransformation,
	category: CategoryType.Transformations,
	params: [
		{
			name: 'duration',
			type: 'interval',
			options: ['1s', '10s', '1m', '5m', '10m', '15m', '1h'],
		},
	],
	defaultParams: ['10s'],
	renderer: functionRenderer,
});

register({
	type: 'spread',
	addStrategy: addTransformation,
	category: CategoryType.Transformations,
	params: [],
	defaultParams: [],
	renderer: functionRenderer,
});

register({
	type: 'non_negative_derivative',
	addStrategy: addTransformation,
	category: CategoryType.Transformations,
	params: [
		{
			name: 'duration',
			type: 'interval',
			options: ['1s', '10s', '1m', '5m', '10m', '15m', '1h'],
		},
	],
	defaultParams: ['10s'],
	renderer: functionRenderer,
});

register({
	type: 'difference',
	addStrategy: addTransformation,
	category: CategoryType.Transformations,
	params: [],
	defaultParams: [],
	renderer: functionRenderer,
});

register({
	type: 'non_negative_difference',
	addStrategy: addTransformation,
	category: CategoryType.Transformations,
	params: [],
	defaultParams: [],
	renderer: functionRenderer,
});

register({
	type: 'moving_average',
	addStrategy: addTransformation,
	category: CategoryType.Transformations,
	params: [{ name: 'window', type: 'int', options: [5, 10, 20, 30, 40] }],
	defaultParams: [10],
	renderer: functionRenderer,
});

register({
	type: 'cumulative_sum',
	addStrategy: addTransformation,
	category: CategoryType.Transformations,
	params: [],
	defaultParams: [],
	renderer: functionRenderer,
});

register({
	type: 'stddev',
	addStrategy: addTransformation,
	category: CategoryType.Transformations,
	params: [],
	defaultParams: [],
	renderer: functionRenderer,
});

register({
	type: 'elapsed',
	addStrategy: addTransformation,
	category: CategoryType.Transformations,
	params: [
		{
			name: 'duration',
			type: 'interval',
			options: ['1s', '10s', '1m', '5m', '10m', '15m', '1h'],
		},
	],
	defaultParams: ['10s'],
	renderer: functionRenderer,
});

// predictions
register({
	type: 'holt_winters',
	addStrategy: addTransformation,
	category: CategoryType.Predictors,
	params: [
		{ name: 'number', type: 'int', options: [5, 10, 20, 30, 40] },
		{ name: 'season', type: 'int', options: [0, 1, 2, 5, 10] },
	],
	defaultParams: [10, 2],
	renderer: functionRenderer,
});

register({
	type: 'holt_winters_with_fit',
	addStrategy: addTransformation,
	category: CategoryType.Predictors,
	params: [
		{ name: 'number', type: 'int', options: [5, 10, 20, 30, 40] },
		{ name: 'season', type: 'int', options: [0, 1, 2, 5, 10] },
	],
	defaultParams: [10, 2],
	renderer: functionRenderer,
});

// Selectors
register({
	type: 'bottom',
	addStrategy: addAggregations,
	category: CategoryType.Selectors,
	params: [{ name: 'count', type: 'int' }],
	defaultParams: [3],
	renderer: functionRenderer,
});

register({
	type: 'first',
	addStrategy: addAggregations,
	category: CategoryType.Selectors,
	params: [],
	defaultParams: [],
	renderer: functionRenderer,
});

register({
	type: 'last',
	addStrategy: addAggregations,
	category: CategoryType.Selectors,
	params: [],
	defaultParams: [],
	renderer: functionRenderer,
});

register({
	type: 'max',
	addStrategy: addAggregations,
	category: CategoryType.Selectors,
	params: [],
	defaultParams: [],
	renderer: functionRenderer,
});

register({
	type: 'min',
	addStrategy: addAggregations,
	category: CategoryType.Selectors,
	params: [],
	defaultParams: [],
	renderer: functionRenderer,
});

register({
	type: 'percentile',
	addStrategy: addAggregations,
	category: CategoryType.Selectors,
	params: [{ name: 'nth', type: 'int' }],
	defaultParams: [95],
	renderer: functionRenderer,
});

register({
	type: 'top',
	addStrategy: addAggregations,
	category: CategoryType.Selectors,
	params: [{ name: 'count', type: 'int' }],
	defaultParams: [3],
	renderer: functionRenderer,
});

register(
	{
		type: 'time',
		category: 'GroupbyCategory',
		// addStrategy: addAggregations,
		params: [
			{
				name: 'interval',
				type: 'time',
				options: ['$__interval', '1s', '10s', '1m', '5m', '10m', '15m', '1h'],
			},
		],
		defaultParams: ['$__interval'],
		renderer: functionRenderer,
	},
	false,
);

register(
	{
		type: 'fill',
		category: 'GroupbyCategory',
		// addStrategy: addAggregations,
		params: [
			{
				name: 'fill',
				type: 'string',
				options: ['none', 'null', '0', 'previous', 'linear'],
			},
		],
		defaultParams: ['null'],
		renderer: functionRenderer,
	},
	false,
);

register(
	{
		type: 'tag',
		category: 'GroupbyCategory',
		params: [{ name: 'tag', type: 'string', dynamicLookup: true }],
		defaultParams: ['tag'],
		renderer: fieldRenderer,
	},
	false,
);

register({
	type: 'math',
	addStrategy: addMath,
	category: CategoryType.Math,
	params: [{ name: 'expr', type: 'string' }],
	defaultParams: ['/ 100'],
	renderer: suffixRenderer,
});

register({
	type: 'alias',
	addStrategy: addAlias,
	category: CategoryType.Aliasing,
	params: [{ name: 'name', type: 'string', quote: 'double' }],
	defaultParams: ['alias'],
	renderMode: 'suffix',
	renderer: aliasRenderer,
});

export const getSelectParams = (part: SelectCondition | GroupbyCondition, options: () => Promise<string[]>): PartParams => {
	const params = (part.params ?? []).map((p) => p.toString());
	const operator = operators[part.type];
	return params.map((param, index) => {
		if (operator.params[index].dynamicLookup) {
			return {
				value: param,
				options,
			};
		}
		return {
			value: param,
			options: operator.params[index].options ? () => Promise.resolve(operator.params[index].options) : null,
		};
	});
};

export const getOperators = () => operators;

export const getOperatorOptions = () => {
	const options: SelectableValue[] = [];
	Object.keys(categories).forEach((key) => {
		const childOptions = categories[key as keyof Category].map((child) => toSelectableValue(child.type));

		options.push({ label: key, options: childOptions });
	});
	return options;
};
