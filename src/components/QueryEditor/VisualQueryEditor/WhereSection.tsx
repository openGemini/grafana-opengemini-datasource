import React from 'react';
import { SegmentSection, SegmentAsync, Segment, SegmentInput } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';

import { GeminiQuery, WhereStatement, OPERATORS, CONNECTORS } from 'types';
import AddSegment from './AddSegment';
import { toSelectableValue } from '../utils';

type Props = {
	whereConditions: WhereStatement[];
	queryChange: <K extends keyof GeminiQuery>(key: K, value: GeminiQuery[K]) => void;
	loadColumnNames: (isAdd?: boolean) => Promise<Array<SelectableValue<string>>>;
};

const defaultStatement: WhereStatement = ['select column', '=', 'value', 'AND'];

const WhereSection = (props: Props) => {
	const { whereConditions, queryChange, loadColumnNames } = props;

	const addCondition = (select: SelectableValue) => {
		const [_, ...rest] = defaultStatement;
		const conditions = [...whereConditions, [select.value!, ...rest] as const];
		queryChange('whereConditions', conditions);
	};

	// whereSection column change callback
	const conditionChange = (select: string | number, index: number, changeType: 0 | 1 | 2 | 3) => {
		let newConditions: WhereStatement[] = [...whereConditions];
		if (changeType === 0 && select === 'remove') {
			// delete condition
			newConditions.splice(index, 1);
		} else {
			newConditions = whereConditions.map((condition, i) => {
				if (i !== index) return condition;
				const newCondition = [...condition];
				newCondition[changeType] = select;
				return newCondition as unknown as WhereStatement;
			});
		}
		queryChange('whereConditions', newConditions);
	};

	return (
		<>
			<SegmentSection fill={false} label="WHERE">
				{whereConditions.map((condition, index) => {
					const [column, operator, value, connector] = condition;
					return (
						<>
							{/* column */}
							<SegmentAsync
								value={toSelectableValue(column)}
								loadOptions={() => loadColumnNames()}
								onChange={(select) => conditionChange(select.value!, index, 0)}
							/>
							{/* operator */}
							<Segment
								value={toSelectableValue(operator)}
								options={OPERATORS.map(toSelectableValue)}
								inputMinWidth={40}
								onChange={(select) => conditionChange(select.value!, index, 1)}
							/>
							{/* value */}
							<SegmentInput value={value} placeholder="value" onChange={(value) => conditionChange(value, index, 2)} />
							{/* connector */}
							{index < whereConditions.length - 1 && (
								<Segment
									value={toSelectableValue(connector)}
									options={CONNECTORS.map(toSelectableValue)}
									onChange={(select) => conditionChange(select.value!, index, 3)}
								/>
							)}
						</>
					);
				})}
				<AddSegment onChange={addCondition} loadOptions={() => loadColumnNames(true)} />
			</SegmentSection>
		</>
	);
};

export default WhereSection;
