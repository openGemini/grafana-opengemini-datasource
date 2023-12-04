import { renderHook } from '@testing-library/react-hooks';
import { DataSourceInstanceSettings } from '@grafana/data';

import { useSelectConditions } from 'components/QueryEditor/hooks/useSelectConditions';
import { GeminiDataSource } from 'datasource';
import { CategoryType, GeminiOptions, GeminiQuery, SelectCondition } from 'types';
import { getOperators } from 'components/QueryEditor/VisualQueryEditor/operators';

const defaultQuery: GeminiQuery = {
	refId: 'A',
	selectConditions: [
		[
			{ type: 'field', category: CategoryType.Fields, params: ['value'] },
			{ type: 'count', category: CategoryType.Aggregations, params: [] },
		],
	],
};
const instanceSetting = {
	url: '',
	jsonData: { database: 'NOAA_water_database' },
} as unknown as DataSourceInstanceSettings<GeminiOptions>;
const setup = (query = defaultQuery) => {
	return renderHook(({ query, datasource }) => useSelectConditions({ query, client: datasource.client }), {
		initialProps: { query, datasource: new GeminiDataSource(instanceSetting) },
	});
};

describe('select functions test', () => {
	describe('remove function', () => {
		const query = {
			refId: 'A',
			selectConditions: [
				[
					{ type: 'field', category: CategoryType.Fields, params: ['value'] },
					{ type: 'count', category: CategoryType.Aggregations, params: [] },
				],
				[
					{ type: 'field', category: CategoryType.Fields, params: ['value2'] },
					{ type: 'count', category: CategoryType.Aggregations, params: [] },
				],
			],
		};
		const { result } = setup(query);

		it('should remove other part except field', () => {
			const res = result.current.removeSelectConditions(1, 0);
			expect(res.selectConditions![0]).toEqual([{ type: 'field', category: CategoryType.Fields, params: ['value'] }]);
		});
		it('should remove full select condition', () => {
			const res = result.current.removeSelectConditions(0, 1);

			expect(res.selectConditions).toEqual([
				[
					{ type: 'field', category: CategoryType.Fields, params: ['value'] },
					{ type: 'count', category: CategoryType.Aggregations, params: [] },
				],
			]);
		});
		it("can't remove the field when only one field exists", () => {
			const { result } = setup();
			const res = result.current.removeSelectConditions(0, 0);
			expect(res.selectConditions).toEqual([
				[
					{ type: 'field', category: CategoryType.Fields, params: ['value'] },
					{ type: 'count', category: CategoryType.Aggregations, params: [] },
				],
			]);
		});
	});
	describe('add function', () => {
		const { result, rerender } = setup();
		it('should replace when Aggregations or Selectors exits', () => {
			const res = result.current.addSelectConditions(0, { label: 'count', value: 'count' });
			expect(res.selectConditions).toEqual([
				[
					{ type: 'field', category: CategoryType.Fields, params: ['value'] },
					{ type: 'count', category: CategoryType.Aggregations, params: [] },
				],
			]);
		});
		it('count and distinct can coexist', () => {
			const res = result.current.addSelectConditions(0, { label: 'distinct', value: 'distinct' });
			expect(res.selectConditions).toEqual([
				[
					{ type: 'field', category: CategoryType.Fields, params: ['value'] },
					{ type: 'distinct', category: CategoryType.Aggregations, params: [] },
					{ type: 'count', category: CategoryType.Aggregations, params: [] },
				],
			]);
		});
		it('add Transformations', () => {
			const res = result.current.addSelectConditions(0, { label: 'derivative', value: 'derivative' });
			expect(res.selectConditions).toEqual([
				[
					{ type: 'field', category: CategoryType.Fields, params: ['value'] },
					{ type: 'count', category: CategoryType.Aggregations, params: [] },
					{ type: 'derivative', category: CategoryType.Transformations, params: ['10s'] },
				],
			]);
			rerender({ query: { ...defaultQuery, selectConditions: res.selectConditions }, datasource: new GeminiDataSource(instanceSetting) });
		});
		it('add Predictors', () => {
			const res = result.current.addSelectConditions(0, { label: 'holt_winters', value: 'holt_winters' });
			expect(res.selectConditions).toEqual([
				[
					{ type: 'field', category: CategoryType.Fields, params: ['value'] },
					{ type: 'count', category: CategoryType.Aggregations, params: [] },
					{ type: 'derivative', category: CategoryType.Transformations, params: ['10s'] },
					{ type: 'holt_winters', category: CategoryType.Predictors, params: [10, 2] },
				],
			]);
		});
		it('test valid function', () => {
			expect(
				isValidSelect([
					{ type: 'field', category: CategoryType.Fields, params: ['value'] },
					{ type: 'count', category: CategoryType.Aggregations, params: [] },
					{ type: 'derivative', category: CategoryType.Transformations, params: ['10s'] },
					{ type: 'holt_winters', category: CategoryType.Predictors, params: [10, 2] },
					{ type: 'math', category: CategoryType.Math, params: [' / 100'] },
					{ type: 'alias', category: CategoryType.Aliasing, params: ['alias'] },
				]),
			).toBe(true);
			expect(
				isValidSelect([
					{ type: 'field', category: CategoryType.Fields, params: ['value'] },
					{ type: 'derivative', category: CategoryType.Transformations, params: ['10s'] },
					{ type: 'holt_winters', category: CategoryType.Predictors, params: [10, 2] },
					{ type: 'spread', category: CategoryType.Transformations, params: [] },
				]),
			).toBe(true);
			expect(
				isValidSelect([
					{ type: 'field', category: CategoryType.Fields, params: ['value'] },
					{ type: 'math', category: CategoryType.Math, params: [' / 100'] },
					{ type: 'holt_winters', category: CategoryType.Predictors, params: [10, 2] },
				]),
			).toBe(false);
			expect(
				isValidSelect([
					{ type: 'math', category: CategoryType.Math, params: [' / 100'] },
					{ type: 'field', category: CategoryType.Fields, params: ['value'] },
				]),
			).toBe(false);
			expect(
				isValidSelect([
					{ type: 'field', category: CategoryType.Fields, params: ['value'] },
					{ type: 'alias', category: CategoryType.Aliasing, params: ['alias'] },
					{ type: 'math', category: CategoryType.Math, params: [' / 100'] },
				]),
			).toBe(false);
		});
		it('test select order', () => {
			const operators = Object.values(getOperators());
			const selectList = operators
				.filter((oper) => oper.category !== 'GroupbyCategory')
				.map((oper) => {
					return { label: oper.type, value: oper.type };
				});

			for (let i = 0; i < 100; i++) {
				const randomCondition = selectList[Math.floor(Math.random() * selectList.length)];
				if (randomCondition.value === 'field') {
					continue;
				}
				const res = result.current.addSelectConditions(0, randomCondition);
				expect(isValidSelect(res.selectConditions![0])).toBe(true);
				rerender({ query: { ...defaultQuery, selectConditions: res.selectConditions }, datasource: new GeminiDataSource(instanceSetting) });
			}
		});
	});
	describe('change function', () => {
		const { result } = setup();
		it('change select params', () => {
			const res = result.current.changeSelectCondition(0, 0, ['value2']);
			expect(res.selectConditions).toEqual([
				[
					{ type: 'field', category: CategoryType.Fields, params: ['value2'] },
					{ type: 'count', category: CategoryType.Aggregations, params: [] },
				],
			]);
		});
	});
});

function isValidSelect(selectCondition: SelectCondition[]) {
	const selectQueue = [
		CategoryType.Fields,
		CategoryType.Aggregations,
		CategoryType.Selectors,
		CategoryType.Transformations,
		CategoryType.Predictors,
		CategoryType.Math,
		CategoryType.Aliasing,
	];
	let curIndex = 1;
	// 1. field must be first
	if (selectCondition[0].category !== CategoryType.Fields) {
		return false;
	}
	let count = 0;
	for (let i = 1; i < selectCondition.length; i++) {
		// 2. order by category(selectQueue)
		const queueIndex = selectQueue.indexOf(selectCondition[i].category);
		if (queueIndex < curIndex) {
			if (selectQueue[queueIndex] !== CategoryType.Transformations || selectQueue[curIndex] !== CategoryType.Predictors) {
				return false;
			}
		}
		curIndex = queueIndex;

		if (selectCondition[i].category === CategoryType.Aggregations || selectCondition[i].category === CategoryType.Selectors) {
			count++;
		}
	}
	// 3.Aggregations and Selectors count
	if (count > 2) {
		return false;
	} else if (count === 2) {
		if (selectCondition[1].type !== 'distinct' || selectCondition[2].type !== 'count') {
			return false;
		}
	}

	return true;
}
