import { buildQuery, buildWhereCondition } from 'components/utils/index';
import { CategoryType, GeminiQuery } from 'types';

const defaultQuery: GeminiQuery = {
	refId: 'A',
	database: 'monitor',
	fromMeasurement: 'h2o_pH',
	rp: 'autogen',
	whereConditions: [['location::tag', '=', 'coyote_creek', 'AND']],
	selectConditions: [
		[
			{ type: 'field', category: CategoryType.Fields, params: ['value'] },
			{ type: 'mean', category: CategoryType.Aggregations, params: [] },
		],
	],
	groupbyConditions: [
		{ type: 'time', params: ['$__interval'] },
		{ type: 'fill', params: ['null'] },
	],
};
describe('test util function', () => {
	describe('test buildQuery function', () => {
		it('buildQuery1', () => {
			const queryText = buildQuery(defaultQuery);
			expect(queryText).toBe(
				`SELECT mean("value") FROM "monitor"."autogen"."h2o_pH" WHERE ("location"::tag = 'coyote_creek') AND $timeFilter GROUP BY time($__interval) fill(null)`,
			);
		});
		it('buildQuery2', () => {
			const query: GeminiQuery = { ...defaultQuery, tz: 'Asia/Shanghai', limit: '10', orderByTime: 'DESC' };
			const queryText = buildQuery(query);
			expect(queryText).toBe(
				`SELECT mean("value") FROM "monitor"."autogen"."h2o_pH" WHERE ("location"::tag = 'coyote_creek') AND $timeFilter GROUP BY time($__interval) fill(null) ORDER BY time DESC LIMIT 10 tz('Asia/Shanghai')`,
			);
		});
		it('build much select ', () => {
			const query: GeminiQuery = {
				...defaultQuery,
				whereConditions: [],
				groupbyConditions: [],
				selectConditions: [
					[
						{ type: 'field', category: CategoryType.Fields, params: ['value'] },
						{ type: 'distinct', category: CategoryType.Aggregations, params: [] },
						{ type: 'count', category: CategoryType.Aggregations, params: [] },
						{ type: 'spread', category: CategoryType.Transformations, params: [] },
						{ type: 'math', category: CategoryType.Math, params: ['/ 100'] },
					],
					[
						{ type: 'field', category: CategoryType.Fields, params: ['value2'] },
						{ type: 'distinct', category: CategoryType.Aggregations, params: [] },
						{ type: 'count', category: CategoryType.Aggregations, params: [] },
						{ type: 'spread', category: CategoryType.Transformations, params: [] },
						{ type: 'math', category: CategoryType.Math, params: ['/ 100'] },
					],
				],
			};
			const queryText = buildQuery(query);
			expect(queryText).toBe(
				`SELECT spread(count(distinct("value"))) / 100, spread(count(distinct("value2"))) / 100 FROM "monitor"."autogen"."h2o_pH" WHERE $timeFilter`,
			);
		});
	});
	describe('test buildWhereCondition', () => {
		it('buildWhereCondition 1', () => {
			const string = buildWhereCondition(['location::tag', '=', 'coyote_creek', 'AND'], 0);
			expect(string).toBe(`\"location\"::tag = 'coyote_creek'`);
		});
		it('buildWhereCondition 1', () => {
			const string = buildWhereCondition(['location::tag', '=', 'coyote_creek', 'AND'], 0);
			expect(string).toBe(`\"location\"::tag = 'coyote_creek'`);
		});
		it('buildWhereCondition 2', () => {
			const string = buildWhereCondition(['pH::field', '=', '7.4', 'AND'], 1);
			expect(string).toBe(`AND \"pH\"::field = '7.4'`);
		});
	});
});
