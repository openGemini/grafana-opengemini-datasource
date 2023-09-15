import { useState, useEffect } from 'react';
import { usePrevious } from 'react-use';

export function useShadowedState<T>(value: T): [T, (newVal: T) => void] {
	const [curVal, setCurVal] = useState(value);
	const prevVal = usePrevious(value);

	useEffect(() => {
		const isOutsideValChanged = prevVal !== value;
		// if the value changes from the outside, we accept it into the state
		// (we only set it if it is different from the current value)
		if (isOutsideValChanged && curVal !== value) {
			setCurVal(value);
		}
	}, [value, curVal, prevVal]);

	return [curVal, setCurVal];
}
