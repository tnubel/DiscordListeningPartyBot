var moment = require('moment-timezone');
import formatter from './formatter.js';
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
    errors.push(formatter.errorMessages.topicTooShort(partyInput.topic));
  }

  var dateMoment;
  try {
    dateMoment = moment.tz(partyInput.dateTime, formatter.DATE_FORMAT, partyInput.timeZone).utc();
    if (!dateMoment.isValid()){
      errors.push(formatter.errorMessages.invalidDateFormat(partyInput.dateTime));
    }

    if (dateMoment.isBefore(moment.tz())) {
      errors.push(formatter.errorMessages.TIME_IN_PAST);
    }
  } catch (ex) {
    console.log(ex);
    errors.push(formatter.errorMessages.invalidDateFormat(partyInput.dateTime));
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