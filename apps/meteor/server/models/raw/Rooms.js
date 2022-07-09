import { ReadPreference } from 'mongodb';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { getCollectionName, Subscriptions } from '@rocket.chat/models';

import { BaseRaw } from './BaseRaw';

export class RoomsRaw extends BaseRaw {
	constructor(db, trash) {
		super(db, getCollectionName('room'), trash);
	}

	findOneByRoomIdAndUserId(rid, uid, options = {}) {
		const query = {
			'_id': rid,
			'u._id': uid,
		};

		return this.findOne(query, options);
	}

	findManyByRoomIds(roomIds, options = {}) {
		const query = {
			_id: {
				$in: roomIds,
			},
		};

		return this.find(query, options);
	}

	async getMostRecentAverageChatDurationTime(numberMostRecentChats, department) {
		const aggregate = [
			{
				$match: {
					t: 'l',
					...(department && { departmentId: department }),
					closedAt: { $exists: true },
				},
			},
			{ $sort: { closedAt: -1 } },
			{ $limit: numberMostRecentChats },
			{
				$group: {
					_id: null,
					chats: { $sum: 1 },
					sumChatDuration: { $sum: '$metrics.chatDuration' },
				},
			},
			{ $project: { _id: '$_id', avgChatDuration: { $divide: ['$sumChatDuration', '$chats'] } } },
		];

		const [statistic] = await this.col.aggregate(aggregate).toArray();
		return statistic;
	}

	findByNameContainingAndTypes(name, types, discussion = false, teams = false, showOnlyTeams = false, options = {}) {
		const nameRegex = new RegExp(escapeRegExp(name).trim(), 'i');

		const onlyTeamsQuery = showOnlyTeams ? { teamMain: { $exists: true } } : {};

		const teamCondition = teams
			? {}
			: {
					teamMain: {
						$exists: false,
					},
			  };

		const query = {
			t: {
				$in: types,
			},
			prid: { $exists: discussion },
			$or: [
				{ name: nameRegex },
				{
					t: 'd',
					usernames: nameRegex,
				},
			],
			...teamCondition,
			...onlyTeamsQuery,
		};
		return this.find(query, options);
	}

	findByTypes(types, discussion = false, teams = false, onlyTeams = false, options = {}) {
		const teamCondition = teams
			? {}
			: {
					teamMain: {
						$exists: false,
					},
			  };

		const onlyTeamsCondition = onlyTeams ? { teamMain: { $exists: true } } : {};

		const query = {
			t: {
				$in: types,
			},
			prid: { $exists: discussion },
			...teamCondition,
			...onlyTeamsCondition,
		};
		return this.find(query, options);
	}

	findByNameContaining(name, discussion = false, teams = false, onlyTeams = false, options = {}) {
		const nameRegex = new RegExp(escapeRegExp(name).trim(), 'i');

		const teamCondition = teams
			? {}
			: {
					teamMain: {
						$exists: false,
					},
			  };

		const onlyTeamsCondition = onlyTeams ? { $and: [{ teamMain: { $exists: true } }, { teamMain: true }] } : {};

		const query = {
			prid: { $exists: discussion },
			$or: [
				{ name: nameRegex },
				{
					t: 'd',
					usernames: nameRegex,
				},
			],
			...teamCondition,
			...onlyTeamsCondition,
		};

		return this.find(query, options);
	}

	findByTeamId(teamId, options = {}) {
		const query = {
			teamId,
			teamMain: {
				$exists: false,
			},
		};

		return this.find(query, options);
	}

	findByTeamIdContainingNameAndDefault(teamId, name, teamDefault, ids, options = {}) {
		const query = {
			teamId,
			teamMain: {
				$exists: false,
			},
			...(name ? { name: new RegExp(escapeRegExp(name), 'i') } : {}),
			...(teamDefault === true ? { teamDefault } : {}),
			...(ids ? { $or: [{ t: 'c' }, { _id: { $in: ids } }] } : {}),
		};

		return this.find(query, options);
	}

	findByTeamIdAndRoomsId(teamId, rids, options = {}) {
		const query = {
			teamId,
			_id: {
				$in: rids,
			},
		};

		return this.find(query, options);
	}

	findChannelAndPrivateByNameStarting(name, sIds, options) {
		const nameRegex = new RegExp(`^${escapeRegExp(name).trim()}`, 'i');

		const query = {
			t: {
				$in: ['c', 'p'],
			},
			name: nameRegex,
			teamMain: {
				$exists: false,
			},
			$or: [
				{
					teamId: {
						$exists: false,
					},
				},
				{
					teamId: {
						$exists: true,
					},
					_id: {
						$in: sIds,
					},
				},
			],
		};

		return this.find(query, options);
	}

	findRoomsByNameOrFnameStarting(name, options) {
		const nameRegex = new RegExp(`^${escapeRegExp(name).trim()}`, 'i');

		const query = {
			t: {
				$in: ['c', 'p'],
			},
			$or: [
				{
					name: nameRegex,
				},
				{
					fname: nameRegex,
				},
			],
		};

		return this.find(query, options);
	}

	findRoomsWithoutDiscussionsByRoomIds(name, roomIds, options) {
		const nameRegex = new RegExp(`^${escapeRegExp(name).trim()}`, 'i');

		const query = {
			_id: {
				$in: roomIds,
			},
			t: {
				$in: ['c', 'p'],
			},
			name: nameRegex,
			$or: [
				{
					teamId: {
						$exists: false,
					},
				},
				{
					teamId: {
						$exists: true,
					},
					_id: {
						$in: roomIds,
					},
				},
			],
			prid: { $exists: false },
		};

		return this.find(query, options);
	}

	findChannelAndGroupListWithoutTeamsByNameStartingByOwner(uid, name, groupsToAccept, options) {
		const nameRegex = new RegExp(`^${escapeRegExp(name).trim()}`, 'i');

		const query = {
			teamId: {
				$exists: false,
			},
			prid: {
				$exists: false,
			},
			_id: {
				$in: groupsToAccept,
			},
			name: nameRegex,
		};
		return this.find(query, options);
	}

	async findBySubscriptionTypeAndUserId(type, userId, options) {
		const data = await Subscriptions.findByUserIdAndType(userId, type, {
			fields: { rid: 1 },
		})
			.map((item) => item.rid)
			.toArray();

		const query = {
			t: type,
			_id: {
				$in: data,
			},
		};

		return this.find(query, options);
	}
	unsetTeamId(teamId, options = {}) {
		const query = { teamId };
		const update = {
			$unset: {
				teamId: '',
				teamDefault: '',
				teamMain: '',
			},
		};

		return this.updateMany(query, update, options);
	}

	unsetTeamById(rid, options = {}) {
		return this.updateOne({ _id: rid }, { $unset: { teamId: '', teamDefault: '' } }, options);
	}

	setTeamById(rid, teamId, teamDefault, options = {}) {
		return this.updateOne({ _id: rid }, { $set: { teamId, teamDefault } }, options);
	}

	setTeamMainById(rid, teamId, options = {}) {
		return this.updateOne({ _id: rid }, { $set: { teamId, teamMain: true } }, options);
	}

	setTeamByIds(rids, teamId, options = {}) {
		return this.updateMany({ _id: { $in: rids } }, { $set: { teamId } }, options);
	}

	setTeamDefaultById(rid, teamDefault, options = {}) {
		return this.updateOne({ _id: rid }, { $set: { teamDefault } }, options);
	}

	setJoinCodeById(rid, joinCode) {
		let update;
		const query = { _id: rid };

		if ((joinCode !== null ? joinCode.trim() : undefined) !== '') {
			update = {
				$set: {
					joinCodeRequired: true,
					joinCode,
				},
			};
		} else {
			update = {
				$set: {
					joinCodeRequired: false,
				},
				$unset: {
					joinCode: 1,
				},
			};
		}

		return this.updateOne(query, update);
	}

	findChannelsWithNumberOfMessagesBetweenDate({ start, end, startOfLastWeek, endOfLastWeek, onlyCount = false, options = {} }) {
		const readPreference = ReadPreference.SECONDARY_PREFERRED;
		const lookup = {
			$lookup: {
				from: 'rocketchat_analytics',
				localField: '_id',
				foreignField: 'room._id',
				as: 'messages',
			},
		};
		const messagesProject = {
			$project: {
				room: '$$ROOT',
				messages: {
					$filter: {
						input: '$messages',
						as: 'message',
						cond: {
							$and: [{ $gte: ['$$message.date', start] }, { $lte: ['$$message.date', end] }],
						},
					},
				},
				lastWeekMessages: {
					$filter: {
						input: '$messages',
						as: 'message',
						cond: {
							$and: [{ $gte: ['$$message.date', startOfLastWeek] }, { $lte: ['$$message.date', endOfLastWeek] }],
						},
					},
				},
			},
		};
		const messagesUnwind = {
			$unwind: {
				path: '$messages',
				preserveNullAndEmptyArrays: true,
			},
		};
		const messagesGroup = {
			$group: {
				_id: {
					_id: '$room._id',
				},
				room: { $first: '$room' },
				messages: { $sum: '$messages.messages' },
				lastWeekMessages: { $first: '$lastWeekMessages' },
			},
		};
		const lastWeekMessagesUnwind = {
			$unwind: {
				path: '$lastWeekMessages',
				preserveNullAndEmptyArrays: true,
			},
		};
		const lastWeekMessagesGroup = {
			$group: {
				_id: {
					_id: '$room._id',
				},
				room: { $first: '$room' },
				messages: { $first: '$messages' },
				lastWeekMessages: { $sum: '$lastWeekMessages.messages' },
			},
		};
		const presentationProject = {
			$project: {
				_id: 0,
				room: {
					_id: '$_id._id',
					name: { $ifNull: ['$room.name', '$room.fname'] },
					ts: '$room.ts',
					t: '$room.t',
					_updatedAt: '$room._updatedAt',
					usernames: '$room.usernames',
				},
				messages: '$messages',
				lastWeekMessages: '$lastWeekMessages',
				diffFromLastWeek: { $subtract: ['$messages', '$lastWeekMessages'] },
			},
		};
		const firstParams = [
			lookup,
			messagesProject,
			messagesUnwind,
			messagesGroup,
			lastWeekMessagesUnwind,
			lastWeekMessagesGroup,
			presentationProject,
		];
		const sort = { $sort: options.sort || { messages: -1 } };
		const params = [...firstParams, sort];

		if (onlyCount) {
			params.push({ $count: 'total' });
		}

		if (options.offset) {
			params.push({ $skip: options.offset });
		}

		if (options.count) {
			params.push({ $limit: options.count });
		}

		return this.col.aggregate(params, { allowDiskUse: true, readPreference });
	}

	findOneByIdOrName(_idOrName, options) {
		const query = {
			$or: [
				{
					_id: _idOrName,
				},
				{
					name: _idOrName,
				},
			],
		};

		return this.findOne(query, options);
	}

	findOneByName(name, options = {}) {
		return this.col.findOne({ name }, options);
	}

	findDefaultRoomsForTeam(teamId) {
		return this.col.find({
			teamId,
			teamDefault: true,
			teamMain: {
				$exists: false,
			},
		});
	}

	incUsersCountByIds(ids, inc = 1) {
		const query = {
			_id: {
				$in: ids,
			},
		};

		const update = {
			$inc: {
				usersCount: inc,
			},
		};

		return this.update(query, update, { multi: true });
	}

	findOneByNameOrFname(name, options = {}) {
		return this.col.findOne({ $or: [{ name }, { fname: name }] }, options);
	}

	allRoomSourcesCount() {
		return this.col.aggregate([
			{
				$match: {
					source: {
						$exists: true,
					},
					t: 'l',
				},
			},
			{
				$group: {
					_id: '$source',
					count: { $sum: 1 },
				},
			},
		]);
	}

	findByBroadcast(options) {
		return this.find(
			{
				broadcast: true,
			},
			options,
		);
	}

	findByActiveLivestream(options) {
		return this.find(
			{
				'streamingOptions.type': 'livestream',
			},
			options,
		);
	}

	setAsFederated(roomId) {
		return this.updateOne({ _id: roomId }, { $set: { federated: true } });
	}

	setRoomTypeById(roomId, roomType) {
		return this.update({ _id: roomId }, { $set: { t: roomType } });
	}

	setRoomNameById(roomId, name, fname) {
		return this.update({ _id: roomId }, { $set: { name, fname } });
	}

	setRoomTopicById(roomId, topic) {
		return this.update({ _id: roomId }, { $set: { description: topic } });
	}

	saveDefaultById(_id, defaultValue) {
		const query = { _id };

		const update = {
			$set: {
				default: defaultValue,
			},
		};

		return this.updateOne(query, update);
	}
	saveFeaturedById(_id, featured) {
		const query = { _id };
		const set = ['true', true].includes(featured);

		const update = {
			[set ? '$set' : '$unset']: {
				featured: true,
			},
		};

		return this.updateOne(query, update);
	}
	saveRetentionEnabledById(_id, value) {
		const query = { _id };

		const update = {};

		if (value === null) {
			update.$unset = { 'retention.enabled': true };
		} else {
			update.$set = { 'retention.enabled': !!value };
		}

		return this.updateOne(query, update);
	}
	saveRetentionMaxAgeById(_id, value) {
		const query = { _id };

		value = Number(value);
		if (!value) {
			value = 30;
		}

		const update = {
			$set: {
				'retention.maxAge': value,
			},
		};

		return this.updateOne(query, update);
	}
	saveRetentionExcludePinnedById(_id, value) {
		const query = { _id };

		const update = {
			$set: {
				'retention.excludePinned': value === true,
			},
		};

		return this.updateOne(query, update);
	}
	saveRetentionFilesOnlyById(_id, value) {
		const query = { _id };

		const update = {
			$set: {
				'retention.filesOnly': value === true,
			},
		};

		return this.updateOne(query, update);
	}

	saveRetentionIgnoreThreadsById(_id, value) {
		const query = { _id };

		const update = {
			[value === true ? '$set' : '$unset']: {
				'retention.ignoreThreads': true,
			},
		};

		return this.updateOne(query, update);
	}
	saveRetentionOverrideGlobalById(_id, value) {
		const query = { _id };

		const update = {
			$set: {
				'retention.overrideGlobal': value === true,
			},
		};

		return this.updateOne(query, update);
	}
	saveFavoriteById(_id, favorite, defaultValue) {
		const query = { _id };

		const update = {
			...(favorite && defaultValue && { $set: { favorite } }),
			...((!favorite || !defaultValue) && { $unset: { favorite: 1 } }),
		};

		return this.updateOne(query, update);
	}
	saveEncryptedById(_id, value) {
		const query = { _id };

		const update = {
			$set: {
				encrypted: value === true,
			},
		};

		return this.updateOne(query, update);
	}
	findByE2E(options) {
		return this.find(
			{
				encrypted: true,
			},
			options,
		);
	}

	findRoomsInsideTeams(autoJoin = false) {
		return this.find({
			teamId: { $exists: true },
			teamMain: { $exists: false },
			...(autoJoin && { teamDefault: true }),
		});
	}
}
