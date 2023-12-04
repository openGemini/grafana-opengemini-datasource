import React from 'react';
import { SegmentAsync, Segment, SegmentInput, useStyles2, InlineLabel } from '@grafana/ui';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';

import { GeminiQuery, WhereStatement, OPERATORS, CONNECTORS } from 'types';
import AddSegment from './AddSegment';
import { toSelectableValue } from '../../utils';
import { css } from '@emotion/css';

type Props = {
	whereConditions: WhereStatement[];
	queryChange: <K extends keyof GeminiQuery>(key: K, value: GeminiQuery[K]) => void;
	loadColumnNames: (isAdd?: boolean) => Promise<Array<SelectableValue<string>>>;
};

export const defaultStatement: WhereStatement = ['select column', '=', 'value', 'AND'];

const getStyles = (theme: GrafanaTheme2) => {
	return {
		inlineLabel: css`
			color: ${theme.colors.primary.text};
		`,
	};
};

const WhereSection = (props: Props) => {
	const { whereConditions, queryChange, loadColumnNames } = props;
	const styles = useStyles2(getStyles);

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
			<InlineLabel width="auto" className={styles.inlineLabel}>
				WHERE
			</InlineLabel>
			{whereConditions.map((condition, index) => {
				const [column, operator, value, connector] = condition;

				return (
					<React.Fragment key={column}>
						{/* connector */}
						{index > 0 && (
							<Segment
								value={toSelectableValue(connector)}
								options={CONNECTORS.map(toSelectableValue)}
								onChange={(select) => conditionChange(select.value!, index, 3)}
							/>
						)}
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
						<SegmentInput value={value} placeholder="value" width={40} onChange={(value) => conditionChange(value, index, 2)} />
					</React.Fragment>
				);
			})}
			<AddSegment onChange={addCondition} loadOptions={() => loadColumnNames(true)} />
		</>
	);
};

export default WhereSection;
