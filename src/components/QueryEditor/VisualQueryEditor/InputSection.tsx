import React from 'react';
import { cx, css } from '@emotion/css';
import { Input } from '@grafana/ui';

import { useShadowedState } from '../hooks/useShadowedState';

type Props = {
	placeholder?: string;
	wide?: boolean;
	value?: string;
	onChange: (value: string | undefined) => void;
};

const InputSection = (props: Props) => {
	let { placeholder, wide, value, onChange } = props;
	wide = wide ?? false;
	const [curValue, setCurValue] = useShadowedState(value);

	return (
		<Input
			type="text"
			spellCheck={false}
			className={cx(
				wide ? 'width-14' : 'width-8',
				css({
					marginRight: '4px',
				}),
			)}
			placeholder={placeholder}
			onChange={(e) => setCurValue(e.currentTarget.value)}
			onBlur={() => onChange(curValue === '' ? undefined : curValue)}
		/>
	);
};

export default InputSection;
