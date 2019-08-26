/*
* Scheduler.js - main business logic and controller for bot.
*/

import { Permissions } from 'discord.js';
const moment = require('moment-timezone');

import formatter from './formatter.js'
import { validateParty } from './validation.js';

var initScheduler = (dataLayer) => {
  return {
    scheduleParty: async (party, owner) => {
      var { guild, guildId, channel, channelId, topic, start, end } = party;

      const conflicts = await dataLayer.getPartiesInRange(moment(start).toDate(), moment(end).toDate(), guildId, channelId);
      if (conflicts.length === 0) {
        const result = await dataLayer.createParty(party, owner);
        return formatter.renderPartyScheduledResult(result.id, topic, start, end, owner, channel);
      }
      else {
        return formatter.errorMessages.SCHEDULE_FAILURE_CONFLICTS_EXIST;
      }
    },
    getUpcoming: async (guildId, channelId, timezone = null) => {
      const parties = await dataLayer.getPartiesInRange(moment().toDate(), moment().add(72, "hours").toDate(), guildId, channelId);
      //Map each party to embedded field, pulling in enrollment data.
      var fields = await Promise.all(parties.map(async p => {
        const enrollments = await dataLayer.getEnrollmentsForParty(p.id);
        return formatter.renderUpcomingParty(p, enrollments, timezone);
      }));

      return fields;
    },
    joinParty: async (guildId, channelId, userId, userTag, partyId) => {
      /*
      2 - Ensure user isn't already enrolled for party
      3 - Add entry
      */

      var matchingParty = await dataLayer.findPartyById(guildId, channelId, partyId);
      if (matchingParty === null) {
        return formatter.errorMessages.noPartyFound(partyId);
      }
      var existingEnrollment = await dataLayer.findEnrollment(userId, partyId);

      if (existingEnrollment) {
        return formatter.errorMessages.PARTY_ALREADY_JOINED;
      }

      await dataLayer.enrollUser(userId, userTag, partyId);

      return formatter.messages.userJoinedParty(userTag, partyId, matchingParty.topic);
    },
    findAndFlagListeningPartiesHappeningSoon: async () => {
      /*
        1. Find listening parties with pingSent false that are happening within 10 minutes.
        2. Set pingSent to true.
        3. Ping them - compose message and send it.
      */
      var messagesToSend = [];
      var partiesToPing = await dataLayer.getPartiesHappeningSoon();
      await dataLayer.markPartiesHappeningSoonAsPinged();
      await Promise.all(partiesToPing.map(async party => {
        var enrollments = await dataLayer.getEnrollmentsForParty(party.id);
        messagesToSend.push({
          users: enrollments.map(e => "<@" + e.userId + ">"),
          channel: party.channelId,
          guild: party.guildId,
          topic: party.topic,
          owner: party.username,
          start: party.start,
        });
      }));
      return messagesToSend;
    },
    cancelParty: async (guildId, channelId, member, partyId) => {
      //Make sure party exists, is in future and is in this channel
      var matchingParty = await dataLayer.findPartyById(guildId, channelId, partyId);
      if (matchingParty === null) {
        return formatter.errorMessages.noPartyFound(partyId);
      }

      //User must be owner or able to manage messages
      const isOwner = matchingParty.username.toString() == member.user.tag.toString();
      const isMod = member.hasPermission(Permissions.FLAGS.MANAGE_MESSAGES);
      if (!isOwner && !isMod) {
        return formatter.errorMessages.NO_PERMISSIONS;
      }

      const deletedCount = await dataLayer.deletePartyById(guildId, channelId, partyId);

      if (deletedCount > 0) {
        return formatter.messages.partyCanceled(partyId, matchingParty.topic);
      }
      else {
        return formatter.errorMessages.CANT_CANCEL_PARTY;
      }
    },
    updateParty: async (guildId, channelId, member, partyId, start, timeZone, duration) => {
      //Make sure party exists, is in future and is in this channel
      var matchingParty = await dataLayer.findPartyById(guildId, channelId, partyId);
      if (matchingParty === null) {
        return formatter.errorMessages.noPartyFound(partyId);
      }

      //User must be owner or able to manage messages
      const isOwner = matchingParty.username.toString() == member.user.tag.toString();
      const isMod = member.hasPermission(Permissions.FLAGS.MANAGE_MESSAGES);
      if (!isOwner && !isMod) {
        return formatter.errorMessages.NO_PERMISSIONS;
      }

      const { party, errors } = validateParty({
        topic: matchingParty.topic,
        dateTime: start,
        duration,
        timeZone,
        guild: matchingParty.guild,
        guildId: matchingParty.guildId,
        channel: matchingParty.channel,
        channelId: matchingParty.channelId,
      });
      var response = "";
      if (errors.length > 0) {
        response = formatter.generatePartyCreationErrors(errors);
        return response;
      }

      const updatedCount = await dataLayer.updateParty(partyId, {
        start: party.start,
        end: party.end,
        timeZone: party.timeZone,
      });

      if (updatedCount > 0) {
        return formatter.renderPartyScheduledResult(partyId, matchingParty.topic, party.start, party.end, member.user.tag, matchingParty.channel);
      }
      else {
        return formatter.errorMessages.CANT_UPDATE_PARTY;
      }
    }
  }
};

export {
  initScheduler
};