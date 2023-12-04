import React from 'react';
import { render, waitFor } from '@testing-library/react';

import RawQueryEditor, { Props } from 'components/QueryEditor/RawQueryEditor';
import { Formats, GeminiQuery } from 'types';

const setup = (initProps?: Props) => {
	const props: Props = initProps ?? {
		query: {} as GeminiQuery,
		onChange: jest.fn(),
		onRunQuery: () => {},
	};
	const res = render(<RawQueryEditor {...props} />);
	return { onChange: props.onChange, ...res };
};

describe('RawQueryEditor', () => {
	it('init render', async () => {
		const { getByText } = setup();
		await waitFor(() => {
			expect(getByText('Format as')).toBeInTheDocument();
			expect(getByText('Alias by')).toBeInTheDocument();
		});
	});
	it('log format render', async () => {
		const { getByText } = setup({ query: { resultFormat: Formats.Logs } as GeminiQuery, onChange: jest.fn(), onRunQuery: () => {} });
		await waitFor(() => {
			expect(getByText('Keywords')).toBeInTheDocument();
		});
	});
});
