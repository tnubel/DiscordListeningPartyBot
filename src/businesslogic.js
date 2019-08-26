var moment = require('moment-timezone');
import botFormatter from './botFormatter.js';
/*
expects {
  topic,
  dateTime,
  timeZone,
  duration,
  guild,
  guildId,
  channel,
  channelId,
}
  properties.
}
*/
const validateParty = (partyInput) => {
  var errors = [];
  if (partyInput.topic.length < 5) {
    errors.push(botFormatter.errorMessages.topicTooShort(partyInput.topic));
  }

  var dateMoment;
  try {
    dateMoment = moment.tz(partyInput.dateTime, botFormatter.DATE_FORMAT, partyInput.timeZone).utc();
    if (!dateMoment.isValid()){
      errors.push(botFormatter.errorMessages.invalidDateFormat(partyInput.dateTime));
    }

    if (dateMoment.isBefore(moment.tz())) {
      errors.push(botFormatter.errorMessages.TIME_IN_PAST);
    }
  } catch (ex) {
    console.log(ex);
    errors.push(botFormatter.errorMessages.invalidDateFormat(partyInput.dateTime));
  }

  if (isNaN(partyInput.duration)){
    errors.push("Duration must be a number. You specified " + partyInput.duration)
  }
  const durationNum = Number.parseFloat(partyInput.duration);

  if (durationNum < .5 || durationNum > 3) {
    errors.push("Duration must be between .5 and 3 - this is in hours.");
  }

  return {
    errors: errors,
    party: errors.length > 0 ? null : {
      topic: partyInput.topic,
      start: dateMoment.format(),
      end: dateMoment.add(partyInput.duration, "hours").format(),
      channel: partyInput.channel,
      channelId: partyInput.channelId,
      guild: partyInput.guild,
      guildId: partyInput.guildId,
    }
  }
};

export {
  validateParty
}