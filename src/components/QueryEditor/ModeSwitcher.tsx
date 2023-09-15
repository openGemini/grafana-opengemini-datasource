import React, { useEffect, useState } from 'react';

import { Button, ConfirmModal } from '@grafana/ui';

type Props = {
	isRaw: boolean;
	onChange: (isRaw: boolean) => void;
};

const ModeSwitcher = ({ isRaw, onChange }: Props) => {
	const [showModal, setShowModal] = useState(false);
	useEffect(() => {
		setShowModal(false);
	}, [isRaw]);

	if (isRaw) {
		// text editor mode
		return (
			<>
				<Button aria-label="Switch to visual editor" icon="pen" variant="secondary" type="button" onClick={() => setShowModal(true)} />
				<ConfirmModal
					isOpen={showModal}
					title="Switch to visual editor mode"
					body="Are you sure to switch to visual editor mode? You will lose the changes done in raw query mode."
					confirmText="Yes, switch to editor mode"
					dismissText="No, stay in raw query mode"
					onConfirm={() => onChange(false)}
					onDismiss={() => setShowModal(false)}
				/>
			</>
		);
	} else {
		// visual editor mode
		return (
			<Button
				type="button"
				icon="pen"
				variant="secondary"
				aria-label="Switch to text editor"
				onClick={() => {
					onChange(true);
				}}
			/>
		);
	}
};

export default ModeSwitcher;
