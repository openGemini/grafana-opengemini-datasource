import { useMemo } from 'react';
import { SelectableValue } from '@grafana/data';

import { toSelectableValue } from 'components/utils';
import { GeminiQuery } from 'types';
import { getSelectParams } from '../VisualQueryEditor/operators';
import { cloneDeep } from 'lodash';

type Props = { query: GeminiQuery; getTagKeys: () => Promise<string[]> };

export const useGroupbyConditions = ({ query, getTagKeys }: Props) => {
	const groupByList = useMemo(() => {
		const groupby = query.groupbyConditions ?? [];
		return groupby.map((item) => ({ name: item.type, params: getSelectParams(item, getTagKeys) }));
	}, [query.groupbyConditions, getTagKeys]);

	const getGroupbyOptions = async () => {
		const tagKeys = await getTagKeys();
		const options: Array<SelectableValue<string>> = [];
		const groupbyConditions = query.groupbyConditions ?? [];
		let hasTime = false,
			hasFill = false;
		groupbyConditions.forEach((condition) => {
			if (condition.type === 'time') {
				hasTime = true;
			} else if (condition.type === 'fill') {
				hasFill = true;
			}
		});
		if (!hasFill) {
			options.push(toSelectableValue('fill(null)'));
		}
		if (!hasTime) {
			options.push(toSelectableValue('time($__interval)'));
		}
		tagKeys.forEach((key) => {
			options.push(toSelectableValue(`tag(${key})`));
		});

		return options;
	};

	const addGroupbyCondition = (item: SelectableValue<string>) => {
		const newQuery = cloneDeep(query);
		newQuery.groupbyConditions = newQuery.groupbyConditions || [];
		let matchString = item.value!.match(/^(\w+)\((.*)\)$/);
		if (!matchString) {
			return newQuery;
		}
		const [_, type, value] = matchString;

		const count = newQuery.groupbyConditions.length;
		const newGroup = { type, params: [value] };

		if (count === 0) {
			newQuery.groupbyConditions.push(newGroup);
			return newQuery;
		} else if (type === 'time') {
			newQuery.groupbyConditions!.unshift(newGroup);
			return newQuery;
		} else if (type === 'tag') {
			if (newQuery.groupbyConditions[count - 1].type === 'fill') {
				newQuery.groupbyConditions.splice(count - 1, 0, newGroup);
				return newQuery;
			}
		}
		newQuery.groupbyConditions.push(newGroup);
		return newQuery;
	};

	const removeGroupbyCondition = (index: number) => {
		const newQuery = cloneDeep(query);
		newQuery.groupbyConditions!.splice(index, 1);
		return newQuery;
	};

	const changeGroupbyCondition = (index: number, newParams: string[]) => {
		const newGroup = [...(query.groupbyConditions ?? [])];
		newGroup[index] = {
			...newGroup[index],
			params: newParams,
		};
		return { ...query, groupbyConditions: newGroup };
	};

	return { groupByList, getGroupbyOptions, addGroupbyCondition, removeGroupbyCondition, changeGroupbyCondition };
};
