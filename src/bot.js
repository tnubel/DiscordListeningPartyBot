import { Client } from "discord.js";
import stringArgv from "string-argv";

import { dataLayer } from './datalayer.js';
import formatter from './formatter';
import { initScheduler } from './scheduler.js';
import { validateParty } from './validation.js';
//This file is not checked into source control - use secret.template.js as a basis to create your own.
import secret from './secret.js';
const moment = require("moment");
var cron = require('node-cron');

const prefix = "!";

var scheduler;

const client = new Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  dataLayer.initialize();
  scheduler = initScheduler(dataLayer);

  /* Recurring task - wait to ping parties 10 min before start */
  // Still to-do - can we ping them AS they start?
  cron.schedule('*/1 * * * *', () => {
    console.log('Checking for parties to ping...');
    scheduler.findAndFlagListeningPartiesHappeningSoon().then(messages => {
      messages.forEach(m => {
        //Announce Listening Party
        const minDiff = moment(m.start).diff(moment(), 'minutes');
        client.channels.get(m.channel).send({
          embed: {
            color: 0xFF0000,
            description: `Listening Party for **${m.topic}** starts in ${minDiff} minutes at ${moment(m.start).toLocaleString()}!`,
          }
        });
        //Ping Users
        if (m.users.length > 0) {
          client.channels.get(m.channel).send(m.users.join(" , "));
        }
      });
    });
  });
});

client.on('message', msg => {
  var tokenizedMsg = stringArgv(msg.content);
  /*
  * Help
  */
  if (msg.content == prefix + 'lphelp') {
    const description = formatter.descriptions.HELP;
    const fields = formatter.getHelpFields();
    msg.channel.send({
      embed: {
        color: 0,
        description,
        fields
      }
    });
  } else if (msg.content.startsWith(prefix + 'lpschedule ')) {
    /*
    * Schedule
    !lpschedule [Topic] [Date] [Timezone] [Duration]
    */
    try {
      if (tokenizedMsg.length != 5) {
        msg.channel.send(formatter.errorMessages.INCORRECT_NUMBER_ARGUMENTS);
        return;
      }
      const partyTopic = tokenizedMsg[1];
      const partyDateTime = tokenizedMsg[2];
      const timeZone = tokenizedMsg[3];
      const durationHours = tokenizedMsg[4];

      var partyInput = {
        guild: msg.guild.name,
        guildId: msg.guild.id,
        channel: msg.channel.name,
        channelId: msg.channel.id,
        topic: partyTopic,
        dateTime: partyDateTime,
        timeZone: timeZone,
        duration: durationHours,
      };

      const { party, errors } = validateParty(partyInput);
      var response = "";
      if (errors.length > 0) {
        response = formatter.generatePartyCreationErrors(errors),
          msg.channel.send(response);
      }
      else {
        scheduler.scheduleParty(party, msg.member.user.tag).then(r => {
          msg.channel.send(r);
        }).catch(ex => {
          console.log(ex);
        });
      }
    } catch (ex) {
      msg.channel.send(formatter.errorMessages.CANT_SCHEDULE_PARTY);
      console.log(ex);
    }
  } else if (msg.content.startsWith(prefix + 'lpupcoming')) {
    /*
    Upcoming
    */
    try {
      var timezone = null;
      if (tokenizedMsg.length > 1) {
        timezone = tokenizedMsg[1];
      }
      scheduler.getUpcoming(msg.guild.id, msg.channel.id, timezone).then(fields => {
        fields = formatter.addUpcomingBottomFields(fields, timezone);
        return msg.channel.send({
          embed: {
            color: 0,
            description: "Upcoming listening parties for " + msg.channel,
            fields
          }
        });
      });
    } catch (ex) {
      msg.channel.send(formatter.errorMessages.CANT_RETRIEVE_PARTIES);
    }
  } else if (msg.content.startsWith(prefix + 'lpjoin')) {
    /*
    Join
    */
    try {
      if (tokenizedMsg.length < 2) {
        return msg.channel.send(formatter.errorMessages.PLEASE_SPECIFY_ID_TO_JOIN);
      }
      if (tokenizedMsg.length > 2) {
        return msg.channel.send(formatter.errorMessages.TOO_MANY_ARGUMENTS);
      }
      const partyId = tokenizedMsg[1];
      if (Number.parseInt(partyId) == NaN) {
        return msg.channel.send(formatter.errorMessages.PROVIDE_NUMERIC_ID);
      }

      scheduler.joinParty(msg.guild.id, msg.channel.id, msg.member.user.id, msg.member.user.tag, partyId).then(response => {
        msg.channel.send(response);
      }).catch(ex => {
        console.log(ex);
        msg.channel.send(formatter.errorMessages.CANT_JOIN_PARTY);
      });
    } catch (ex) {
      console.log(ex);
      msg.channel.send(formatter.errorMessages.CANT_JOIN_PARTY);
    }
  } else if (msg.content.startsWith(prefix + 'lpcancel')) {
    /* 
    * Cancel
    */
    try {
      if (tokenizedMsg.length < 2) {
        return msg.channel.send(formatter.errorMessages.PLEASE_SPECIFY_ID_TO_CANCEL);
      }
      if (tokenizedMsg.length > 2) {
        return msg.channel.send(formatter.errorMessages.TOO_MANY_ARGUMENTS);
      }
      const partyId = tokenizedMsg[1];
      if (Number.parseInt(partyId) == NaN) {
        return msg.channel.send(formatter.errorMessages.PROVIDE_NUMERIC_ID);
      }
      scheduler.cancelParty(msg.guild.id, msg.channel.id, msg.member, partyId).then(response => {
        msg.channel.send(response);
      }).catch(ex => {
        console.log(ex);
        msg.channel.send(formatter.errorMessages.CANT_JOIN_PARTY);
      });
    } catch (ex) {
      console.log(ex);
      msg.channel.send(formatter.errorMessages.CANT_JOIN_PARTY);
    }
  } else if (msg.content.startsWith(prefix + 'lpupdate ')) {
    /*
    * Update
    !lpupdate [id] [Date] [Timezone] [Duration]
    */
    console.log(tokenizedMsg);
    try {
      if (tokenizedMsg.length != 5) {
        msg.channel.send(formatter.errorMessages.INCORRECT_NUMBER_ARGUMENTS);
        return;
      }
      const partyId = tokenizedMsg[1];
      const partyDateTime = tokenizedMsg[2];
      const timeZone = tokenizedMsg[3];
      const durationHours = tokenizedMsg[4];
      scheduler.updateParty(msg.guild.id, msg.channel.id, msg.member, partyId, partyDateTime, timeZone, durationHours).then(r => {
        msg.channel.send(r);
      });
    }
    catch (ex) {
      console.log(ex);
      msg.channel.send(formatter.errorMessages.CANT_UPDATE_PARTY);
    }
  }

});

client.login(secret);