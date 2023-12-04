import React, { useMemo } from 'react';
import { cx, css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { MenuGroup, MenuItem, WithContextMenu, SegmentAsync, useTheme2, SegmentInput } from '@grafana/ui';

import { toSelectableValue } from 'components/utils';
import AddSegment from './AddSegment';
import { PartParams } from './operators';
// import InputSection from './InputSection';

interface Props {
	parts: Array<{
		name: string;
		params: PartParams;
	}>;
	getOptions: () => Promise<SelectableValue[]>;
	onRemove: (index: number) => void;
	onAddSection: (item: SelectableValue<string>) => void;
	onChange: (index: number, value: string[]) => void;
}

const noPadding = css({
	paddingLeft: 0,
	paddingRight: 0,
	marginLeft: 0,
	marginRight: 0,
});

const noPaddingRight = css({
	paddingRight: 0,
	marginRight: 0,
});

const getCurClass = (theme: GrafanaTheme2) => {
	return cx(
		'gf-form-label',
		css({
			paddingLeft: 0,
			fontSize: theme.typography.body.fontSize,
			lineHeight: theme.typography.body.lineHeight,
		}),
	);
};

const SectionName = ({ name, onRemove }: { name: string; onRemove: () => void }) => {
	const renderMenuItems = (onClick: () => void) => {
		return (
			<MenuGroup label="">
				<MenuItem label="remove" onClick={onClick} />
			</MenuGroup>
		);
	};
	return (
		<WithContextMenu renderMenuItems={() => renderMenuItems(onRemove)}>
			{({ openMenu }) => (
				<button className={cx('gf-form-label', noPaddingRight)} onClick={openMenu}>
					{name}
				</button>
			)}
		</WithContextMenu>
	);
};

const SelectAndGroupSection = ({ parts, getOptions, onRemove, onAddSection, onChange }: Props) => {
	const theme = useTheme2();
	const curClass = useMemo(() => getCurClass(theme), [theme]);

	const onParamChange = (val: string, partIndex: number, i: number) => {
		const newParams = parts[partIndex].params.map((p) => p.value);
		newParams[i] = val;
		onChange(partIndex, newParams);
	};
	return (
		<>
			{parts.map((part, index) => (
				<div key={index} className={curClass}>
					<SectionName name={part.name} onRemove={() => onRemove(index)} />(
					{part.params.map((p, i) => {
						const { value, options } = p;
						const isLast = i === part.params.length - 1;
						const loadOptions = () => (options !== null ? options().then((items) => items.map(toSelectableValue)) : Promise.resolve([]));
						if (options) {
							return (
								<React.Fragment key={i}>
									<SegmentAsync
										inputMinWidth={150}
										value={toSelectableValue(value)}
										loadOptions={loadOptions}
										onChange={(v) => onParamChange(v.value!, index, i)}
										className={noPadding}
									/>
									{!isLast && ','}
								</React.Fragment>
							);
						} else {
							return <SegmentInput key={i} value={value} className={noPadding} onChange={(v) => onParamChange(v.toString(), index, i)} />;
						}
					})}
					)
				</div>
			))}
			<AddSegment loadOptions={getOptions} onChange={onAddSection} />
		</>
	);
};

export default SelectAndGroupSection;
