import { SelectableValue } from '@grafana/data';
import { openGeminiHttpClient } from 'client';
import { Part } from 'components/QueryEditor/VisualQueryEditor';
import { getOperators, getSelectParams } from 'components/QueryEditor/VisualQueryEditor/operators';
import { cloneDeep } from 'lodash';
import { useMemo } from 'react';
import { GeminiQuery } from 'types';

type Props = {
	query: GeminiQuery;
	client: openGeminiHttpClient;
};
export const useSelectConditions = ({ query, client }: Props) => {
	const { fromMeasurement, rp, database } = query;
	const selectLists: Part[][] = useMemo(() => {
		const select = query.selectConditions ?? [];
		return select.map((item) => {
			return item.map((it) => {
				const options = () => (fromMeasurement ? client.getFieldKeys(fromMeasurement, rp, database) : Promise.resolve([]));
				return { name: it.type, category: it.category, params: getSelectParams(it, options) };
			});
		});
	}, [query.selectConditions, fromMeasurement, rp, database, client]);

	const removeSelectConditions = (partIndex: number, index: number): GeminiQuery => {
		const newQuery = cloneDeep(query);

		if (selectLists[index][partIndex].name === 'field') {
			if (selectLists.length > 1) {
				newQuery.selectConditions!.splice(index, 1);
			}
		} else {
			newQuery.selectConditions![index].splice(partIndex, 1);
		}

		return newQuery;
	};

	const addSelectConditions = (index: number, item: SelectableValue<string>): GeminiQuery => {
		const newQuery = cloneDeep(query);
		const operators = getOperators();
		const addOperator = operators[item.value!];
		const newSelect = { type: item.value!, category: addOperator.category, params: addOperator.defaultParams };
		addOperator.addStrategy(newQuery.selectConditions![index], newSelect, newQuery);
		return newQuery;
	};

	const changeSelectCondition = (index: number, partIndex: number, newParams: string[]): GeminiQuery => {
		const newSelect = [...query.selectConditions!];
		newSelect[index] = [...newSelect[index]];
		newSelect[index][partIndex] = {
			...newSelect[index][partIndex],
			params: newParams,
		};
		return { ...query, selectConditions: newSelect };
	};
	return { selectLists, removeSelectConditions, addSelectConditions, changeSelectCondition };
};
