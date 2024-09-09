import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { usePermission, useStream } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import React, { useEffect } from 'react';

import { AppClientOrchestratorInstance } from '../../apps/orchestrator';
import { AppsContext } from '../../contexts/AppsContext';
import { useIsEnterprise } from '../../hooks/useIsEnterprise';
import { useInvalidateLicense } from '../../hooks/useLicense';
import type { AsyncState } from '../../lib/asyncState';
import { AsyncStatePhase } from '../../lib/asyncState';
import { useInvalidateAppsCountQueryCallback } from '../../views/marketplace/hooks/useAppsCountQuery';
import type { App } from '../../views/marketplace/types';
import { storeQueryFunction } from './storeQueryFunction';

const getAppState = (
	loading: boolean,
	apps: App[] | undefined,
): AsyncState<{
	apps: App[];
}> => ({
	phase: loading ? AsyncStatePhase.LOADING : AsyncStatePhase.RESOLVED,
	value: { apps: apps || [] },
	error: undefined,
});

type AppsProviderProps = {
	children: ReactNode;
};

const AppsProvider = ({ children }: AppsProviderProps) => {
	const isAdminUser = usePermission('manage-apps');

	const queryClient = useQueryClient();

	const { data } = useIsEnterprise();
	const isEnterprise = !!data?.isEnterprise;

	const invalidateAppsCountQuery = useInvalidateAppsCountQueryCallback();
	const invalidateLicenseQuery = useInvalidateLicense();

	const stream = useStream('apps');

	const invalidate = useDebouncedCallback(
		() => {
			queryClient.invalidateQueries(['marketplace', 'apps-instance']);
			invalidateAppsCountQuery();
		},
		100,
		[],
	);

	useEffect(() => {
		return stream('apps', ([key]) => {
			if (['app/added', 'app/removed', 'app/updated', 'app/statusUpdate', 'app/settingUpdated'].includes(key)) {
				invalidate();
			}
			if (['app/added', 'app/removed'].includes(key) && !isEnterprise) {
				invalidateLicenseQuery();
			}
		});
	}, [invalidate, invalidateLicenseQuery, isEnterprise, stream]);

	const marketplace = useQuery(
		['marketplace', 'apps-marketplace', isAdminUser],
		() => {
			const result = AppClientOrchestratorInstance.getAppsFromMarketplace(isAdminUser);
			queryClient.invalidateQueries(['marketplace', 'apps-stored']);
			return result;
		},
		{
			staleTime: Infinity,
			keepPreviousData: true,
			onSettled: () => queryClient.invalidateQueries(['marketplace', 'apps-stored']),
		},
	);

	const instance = useQuery(
		['marketplace', 'apps-instance', isAdminUser],
		async () => {
			const result = await AppClientOrchestratorInstance.getInstalledApps().then((result: App[]) =>
				result.map((current: App) => ({
					...current,
					installed: true,
				})),
			);
			return result;
		},
		{
			staleTime: Infinity,
			onSettled: () => queryClient.invalidateQueries(['marketplace', 'apps-stored']),
		},
	);

	const store = useQuery(['marketplace', 'apps-stored', instance.data, marketplace.data], () => storeQueryFunction(marketplace, instance), {
		enabled: marketplace.isFetched && instance.isFetched,
		keepPreviousData: true,
	});

	const [marketplaceAppsData, installedAppsData, privateAppsData] = store.data || [];
	const { isLoading } = store;

	return (
		<AppsContext.Provider
			children={children}
			value={{
				installedApps: getAppState(isLoading, installedAppsData),
				marketplaceApps: getAppState(isLoading, marketplaceAppsData),
				privateApps: getAppState(isLoading, privateAppsData),
				reload: async () => {
					await Promise.all([queryClient.invalidateQueries(['marketplace'])]);
				},
				orchestrator: AppClientOrchestratorInstance,
			}}
		/>
	);
};

export default AppsProvider;
