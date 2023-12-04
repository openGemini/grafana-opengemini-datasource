import { renderHook } from '@testing-library/react-hooks';

import { useGroupbyConditions } from 'components/QueryEditor/hooks/useGroupbyConditions';
import { toSelectableValue } from 'components/utils';
import { GeminiQuery } from 'types';

const defaultQuery: GeminiQuery = {
	refId: 'A',
	// groupbyConditions: [{ type: 'time', params: ['$__interval'] }],
};

const getTagKeys = jest.fn();
const setup = (groupbyConditions = [{ type: 'time', params: ['$__interval'] }]) => {
	const query: GeminiQuery = { ...defaultQuery, groupbyConditions };
	return renderHook(({ query, getTagKeys }) => useGroupbyConditions({ query, getTagKeys }), { initialProps: { query, getTagKeys } });
};

describe('useGroupbyConditions', () => {
	describe('getGroupbyOptions', () => {
		const { result } = setup();
		it('should return options except time($__interval)', async () => {
			getTagKeys.mockImplementation(() => {
				return ['location::tag', 'water_level::field'];
			});
			const options = await result.current.getGroupbyOptions();
			expect(options).toEqual(['fill(null)', 'tag(location::tag)', 'tag(water_level::field)'].map(toSelectableValue));
		});
	});
	describe('removeGroupbyCondition func', () => {
		const { result } = setup();
		it('should remove target group', () => {
			const newQuery = result.current.removeGroupbyCondition(0);
			expect(newQuery.groupbyConditions).toEqual([]);
		});
	});
	describe('addGroupbyCondition func', () => {
		const { result, rerender } = setup([]);
		it('add fill', () => {
			const newQuery = result.current.addGroupbyCondition(toSelectableValue('fill(null)'));
			expect(newQuery.groupbyConditions).toEqual([{ type: 'fill', params: ['null'] }]);
			rerender({ query: { ...defaultQuery, groupbyConditions: newQuery.groupbyConditions }, getTagKeys });
		});
		it('add tag before fill', () => {
			const newQuery = result.current.addGroupbyCondition(toSelectableValue('tag(location::tag)'));
			expect(newQuery.groupbyConditions).toEqual([
				{ type: 'tag', params: ['location::tag'] },
				{ type: 'fill', params: ['null'] },
			]);
			rerender({ query: { ...defaultQuery, groupbyConditions: newQuery.groupbyConditions }, getTagKeys });
		});
		it('add time at the top', () => {
			const newQuery = result.current.addGroupbyCondition(toSelectableValue('time($__interval)'));
			expect(newQuery.groupbyConditions).toEqual([
				{ type: 'time', params: ['$__interval'] },
				{ type: 'tag', params: ['location::tag'] },
				{ type: 'fill', params: ['null'] },
			]);
		});
	});
	describe('changeGroupbyCondition', () => {
		const { result } = setup();
		it('change group params', () => {
			const newQuery = result.current.changeGroupbyCondition(0, ['1s']);
			expect(newQuery.groupbyConditions).toEqual([{ type: 'time', params: ['1s'] }]);
		});
	});
});
