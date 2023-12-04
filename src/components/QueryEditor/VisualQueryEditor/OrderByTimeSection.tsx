import React from 'react';
import { InlineLabel, Select, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { css, cx } from '@emotion/css';

const options: Array<SelectableValue<Mode>> = [
	{ label: 'ascending', value: 'ASC' },
	{ label: 'descending', value: 'DESC' },
];

type Mode = 'ASC' | 'DESC';
type Props = {
	value: Mode;
	onChange: (value: Mode) => void;
};
const OrderByTimeSection = ({ value, onChange }: Props) => {
	const styles = useStyles2(getStyles);
	return (
		<>
			<InlineLabel width="auto" className={styles.inlineLabel}>
				ORDER BY TIME
			</InlineLabel>
			<Select<Mode>
				className={cx(
					'width-8',
					css({
						marginRight: '4px',
						height: '32px',
					}),
				)}
				options={options}
				value={value}
				onChange={(v) => onChange(v.value!)}
			/>
		</>
	);
};

function getStyles(theme: GrafanaTheme2) {
	return {
		inlineLabel: css`
			color: ${theme.colors.primary.text};
		`,
	};
}

export default OrderByTimeSection;
