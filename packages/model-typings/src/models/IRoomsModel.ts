import type { Cursor, AggregationCursor, UpdateWriteOpResult, FindOneOptions } from 'mongodb';
import type { IRoom, IOmnichannelGenericRoom } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IRoomsModel extends IBaseModel<IRoom> {
	findOneByRoomIdAndUserId(rid: any, uid: any, options?: any): any;

	findManyByRoomIds(roomIds: any, options?: any): any;

	getMostRecentAverageChatDurationTime(numberMostRecentChats: any, department: any): Promise<any>;

	findByNameContainingAndTypes(name: any, types: any, discussion?: boolean, teams?: boolean, showOnlyTeams?: boolean, options?: any): any;

	findByTypes(types: any, discussion?: boolean, teams?: boolean, onlyTeams?: boolean, options?: any): any;

	findByNameContaining(name: any, discussion?: boolean, teams?: boolean, onlyTeams?: boolean, options?: any): any;

	findByTeamId(teamId: any, options?: any): any;

	findByTeamIdContainingNameAndDefault(teamId: any, name: any, teamDefault: any, ids: any, options?: any): any;

	findByTeamIdAndRoomsId(teamId: any, rids: any, options?: any): any;

	findChannelAndPrivateByNameStarting(name: any, sIds: any, options: any): any;

	findRoomsByNameOrFnameStarting(name: any, options: any): any;

	findRoomsWithoutDiscussionsByRoomIds(name: any, roomIds: any, options: any): any;

	findChannelAndGroupListWithoutTeamsByNameStartingByOwner(uid: any, name: any, groupsToAccept: any, options: any): any;

	findBySubscriptionTypeAndUserId<T>(type: string, uid: string, options?: FindOneOptions<IRoom>,): Promise<Cursor<IRoom & T>>;

	unsetTeamId(teamId: any, options?: any): any;

	unsetTeamById(rid: any, options?: any): any;

	setTeamById(rid: any, teamId: any, teamDefault: any, options?: any): any;

	setTeamMainById(rid: any, teamId: any, options?: any): any;

	setTeamByIds(rids: any, teamId: any, options?: any): any;

	setTeamDefaultById(rid: any, teamDefault: any, options?: any): any;

	setJoinCodeById(rid: string, joinCode: string): Promise<UpdateWriteOpResult>;

	findChannelsWithNumberOfMessagesBetweenDate(params: {
		start: any;
		end: any;
		startOfLastWeek: any;
		endOfLastWeek: any;
		onlyCount?: boolean;
		options?: any;
	}): any;

	findOneByIdOrName(idOrName: string, options?: any): Promise<any>;

	findOneByName(name: any, options?: any): any;

	findDefaultRoomsForTeam(teamId: any): Cursor<IRoom>;

	incUsersCountByIds(ids: any, inc: number): any;

	findOneByNameOrFname(name: any, options?: any): any;

	allRoomSourcesCount(): AggregationCursor<{ _id: Required<IOmnichannelGenericRoom['source']>; count: number }>;

	findByBroadcast(options?: any): any;

	findByActiveLivestream(options?: any): any;

	setAsFederated(roomId: any): any;

	setRoomTypeById(roomId: any, roomType: any): any;

	setRoomNameById(roomId: any, name: any, fname: any): any;

	setRoomTopicById(roomId: any, topic: any): any;

	saveDefaultById(_id: string, defaultValue: boolean): Promise<UpdateWriteOpResult>;
	saveFeaturedById(_id: string, featured: boolean): Promise<UpdateWriteOpResult>;
	saveRetentionEnabledById(_id: string, value: boolean | null): Promise<UpdateWriteOpResult>;
	saveRetentionMaxAgeById(_id: string, value: number | null): Promise<UpdateWriteOpResult>;
	saveRetentionExcludePinnedById(_id: string, value: boolean | null): Promise<UpdateWriteOpResult>;
	saveRetentionFilesOnlyById(_id: string, value: boolean | null): Promise<UpdateWriteOpResult>;
	saveRetentionIgnoreThreadsById(_id: string, value: boolean | null): Promise<UpdateWriteOpResult>;
	saveRetentionOverrideGlobalById(_id: string, value: boolean | null): Promise<UpdateWriteOpResult>;
	saveFavoriteById(_id: string, favorite: boolean, defaultValue?: boolean): Promise<UpdateWriteOpResult>;
	saveEncryptedById(_id: string, encrypted: boolean): Promise<UpdateWriteOpResult>;

	findByE2E(options: any): any;

	findRoomsInsideTeams(autoJoin?: boolean): any;
}
