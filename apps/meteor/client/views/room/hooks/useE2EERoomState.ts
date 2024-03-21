import { useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import type { E2ERoomState } from '../../../../app/e2e/client/E2ERoomState';
import { useE2EERoom } from './useE2EERoom';

// export const useE2EERoomState = (e2eRoom: E2ERoom | undefined | null) => {
//     // if(!e2eRoom) {
//     //     return undefined;
//     // }

//     return useSyncExternalStore((callback) => e2eRoom ? e2eRoom.on('STATE_CHANGED', callback) : () => undefined, e2eRoom ? () => e2eRoom.state : () => undefined);
// }

export const useE2EERoomState = (rid: string) => {
	const e2eRoom = useE2EERoom(rid);

	const subscribeE2EERoomState = useMemo(
		() =>
			[
				(callback: () => void): (() => void) => (e2eRoom ? e2eRoom.on('STATE_CHANGED', callback) : () => undefined),
				(): E2ERoomState | undefined => (e2eRoom ? e2eRoom.state : undefined),
			] as const,
		[e2eRoom],
	);

	return useSyncExternalStore(...subscribeE2EERoomState);

	// return useSyncExternalStore((callback) => e2eRoom ? e2eRoom.on('STATE_CHANGED', callback) : () => undefined, e2eRoom ? () => e2eRoom.state : () => undefined);
};
