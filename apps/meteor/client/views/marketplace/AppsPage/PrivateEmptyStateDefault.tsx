import { States, StatesIcon, StatesTitle, StatesSubtitle } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

const PrivateEmptyStateDefault = () => {
	const { t } = useTranslation();

	return (
		<States>
			<StatesIcon name='lock' />
			<StatesTitle>{t('No_private_apps_installed')}</StatesTitle>
			<StatesSubtitle>{t('Private_apps_are_side-loaded')}</StatesSubtitle>
		</States>
	);
};

export default PrivateEmptyStateDefault;
