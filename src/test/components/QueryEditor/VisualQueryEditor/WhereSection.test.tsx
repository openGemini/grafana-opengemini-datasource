import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';

import WhereSection, { defaultStatement } from 'components/QueryEditor/VisualQueryEditor/WhereSection';
import { WhereStatement } from 'types';

const setup = (whereConditions?: WhereStatement[]) => {
	const conditions = whereConditions ?? [];
	const loadColumnNames = () =>
		Promise.resolve([
			{ value: 'tagKey1::tag', label: 'tagKey1::tag' },
			{ value: 'tagKey2::tag', label: 'tagKey2::tag' },
		]);
	const queryChange = jest.fn();
	const result = render(<WhereSection whereConditions={conditions} queryChange={queryChange} loadColumnNames={loadColumnNames} />);
	return { queryChange, ...result };
};

describe('WhereSection Component', () => {
	it('should call queryChange func', async () => {
		const { queryChange, getByText } = setup();
		await userEvent.click(screen.getByText('+'));
		expect(await getByText('tagKey1::tag')).toBeInTheDocument();
		await userEvent.click(screen.getByText('tagKey1::tag'));
		const [_, ...rest] = defaultStatement;
		expect(queryChange).toBeCalledWith('whereConditions', [['tagKey1::tag', ...rest]]);
	});
	it('test whereConditions', async () => {
		const [_, ...rest] = defaultStatement;
		const { getByText, queryChange } = setup([['tagKey1::tag', ...rest] as const]);
		expect(await getByText(rest[0])).toBeInTheDocument();
		expect(await getByText(rest[1])).toBeInTheDocument();
		await userEvent.click(screen.getByText(rest[0]));
		await userEvent.click(screen.getByText('>'));
		expect(queryChange).toBeCalledWith('whereConditions', [['tagKey1::tag', '>', rest[1], rest[2]]]);
	});
});
