import React from 'react';
import { SelectableValue } from '@grafana/data';
import { SegmentAsync } from '@grafana/ui';

type Props<T, U> = {
	loadOptions: (query?: string) => Promise<Array<SelectableValue<T>>>;
	onChange: (item: SelectableValue<U>) => void;
};

const AddSegment = <T, U = T>(props: Props<T, U>) => {
	const { loadOptions, onChange } = props;

	return <SegmentAsync placeholder="+" inputMinWidth={200} loadOptions={loadOptions as any} onChange={onChange} />;
};

export default AddSegment;
