/* 
botFormatter.js
Provides rich text formatting to bot - goal of this class is just to decouple formatting from bot logic. */

const moment = require('moment');

const DATE_FORMAT = "YYYY-MM-DD HH:mm";
const TIMEZONE_LINK = "See https://en.wikipedia.org/wiki/List_of_tz_database_time_zones for valid time zones.";

const errorMessages = {
  INCORRECT_NUMBER_ARGUMENTS:  "Incorrect number of arguments. Try !lphelp for assistance.",
  TOO_MANY_ARGUMENTS: "Too many arguments - see !lphelp for more information.",
  CANT_JOIN_PARTY: "Couldn't join party. Try again later.",
  PARTY_ALREADY_JOINED: "You've already joined this party.",
  CANT_RETRIEVE_PARTIES: "Couldn't retrieve upcoming parties. Try again later.",
  CANT_SCHEDULE_PARTY: "Sorry, we couldn't schedule the listening party. Try again later.",
  CANT_UPDATE_PARTY: "Sorry, we couldn't update the listening party. Try again later.",
  CANT_CANCEL_PARTY: "Sorry, we couldn't cancel the listening party. Try again later.",
  PLEASE_SPECIFY_ID_TO_JOIN: "Please specify an ID to join the listening party.",
  PLEASE_SPECIFY_ID_TO_CANCEL: "Please specify an ID to cancel.",
  PROVIDE_NUMERIC_ID: "Please provide a number-only ID (e.g. 3)",
  SCHEDULE_FAILURE_CONFLICTS_EXIST: "Could not schedule party - conflicts exist. Double check your time slot.",
  NO_PERMISSIONS: "Sorry, you don't have permissions to do this.",
  TIME_IN_PAST: "This time is in the past. Please schedule listening parties in the future.",

  noPartyFound: (partyId) => {
    return `Sorry, no party with ID ${partyId} found in this channel. Are you in the right channel?`;
  },
  topicTooShort: (topic) => {
    return `Your listening party topic should be over 5 characters long. You provided "${topic}"`;
  },
  invalidDateFormat: (dateInput) => {
    return `"${dateInput}" is not a valid date/time string (use YYYY-MM-DD HH:mm), or your timezone is wrong. ${TIMEZONE_LINK}`;
  }
}

const messages = {
  userJoinedParty: (userTag, partyId, topic) => {
    return `**${userTag}** joined listening party **#${partyId} - ${topic}**`;
  },
  partyCanceled: (partyId, topic) => {
    `Party #${partyId} - ${topic} has been cancelled.`;
  }
};

const descriptions = {
  HELP: `This bot helps schedule listening parties and alert users when they're starting.\n`,
}

const addUpcomingBottomFields = (fields, timezone ) => {
  if (fields.length > 0) {
    fields.push(timezone ? {
      name: "All Times in " + timezone,
      value: "See !lphelp for more info."
    } : {
        name: "All times in GMT",
        value: "You can specify a timezone by adding after !lpupcoming - e.g., !lpupcoming America/Chicago",
    });
  } else {
    fields.push({
      name: "No parties found.",
      value: "Schedule one! See !lphelp for details.",
    });
  }
  return fields;
}

const generatePartyCreationErrors = (errors) => {
  return "Sorry, we couldn't schedule that party. Please correct the following errors: \n\n- " + errors.join("\n- ");
}

const getHelpFields = () => {
  return [
    {
      name: "!lpschedule <topic> <datetime> <timezone> <duration>",
      value:
        "Example: ```!lpschedule \"Slayer - Reign in Blood\" \"2019-08-22 18:00\" America/Chicago 1``` will schedule a listening party for an hour at 6 PM CST.\n\n"
        + "**topic** - Topic of the listening party. Enclose in quotes, must be > 5 characters long\n"
        + "**datetime** - The date and time of the party. Enclose in quotes and please follow the format YYYY-MM-DD HH:mm \n"
        + "**timezone** - The time zone of the party -  see https://en.wikipedia.org/wiki/List_of_tz_database_time_zones.\n"
        + "**duration** - The duration of the party in hours\n\n"
    },
    {
      name: "!lpjoin <id>",
      value:
        "Join a listening party. The bot will ping you 10 minutes before the party begins. \n" +
        "Example: \`!lpjoin 1\` will join the party with ID '1'. You can see party IDs in \`!lpupcoming\`.\n\n"
        + "**topic** - Topic of the listening party. Enclose in quotes.\n\n"
    },
    {
      name: "!lpupcoming [<timezone>]",
      value:
        "Lists the next few listening parties that have been scheduled.\n\n"
        + "**timezone** *(Optional)* - The time zone to display times in -  see https://en.wikipedia.org/wiki/List_of_tz_database_time_zones.\n"
    },
    {
      name: "!lpcancel <id>",
      value:
        "Example: ```!lpcancel 1``` will will cancel the listening party with ID 1.\n\n"
        + "**id** - ID of the listening party. You must be the creator (or an admin) and it must be in the future.\n"
    },
    {
      name: "!lpupdate <id> <datetime> <timezone> <duration>",
      value:
        "Example: ```!lpupdate 1 \"2019-08-22 18:00\" America/Chicago 1``` will update the listening party with ID 1. Even if you just want to update one of these things, please provide values for all of them.\n\n"
        + "**id** - ID of the listening party. You must be the creator (or an admin) and it must be in the future.\n"
        + "**datetime** - The new date and time of the party. Enclose in quotes and please follow the format YYYY-MM-DD HH:mm \n"
        + "**timezone** - The new time zone of the party -  see https://en.wikipedia.org/wiki/List_of_tz_database_time_zones.\n"
        + "**duration** - The duration of the party in hours\n\n"
    },
    {
      name: "!lphelp",
      value:
        "Shows this message.\n"
    },
  ];
}

const renderUpcomingParty = (p, enrollments, timezone) => {
  const enrollmentString = enrollments.map(e => "**"+e.userTag+"**").join(", ");
  const minDiff = moment(p.start).diff(moment(), 'minutes');
  const hrDiff = moment(p.start).diff(moment(), 'hours');
  var flair = "";
  if (minDiff < 0) {
    flair = "Happening now!";
  } else if (minDiff < 60) {
    flair = `Starts in ${minDiff} minutes`;
  } else {
    flair = `Starts in ${hrDiff} hours`;
  }

  const startTime = timezone ? `**${moment(p.start).tz(timezone).toLocaleString()}**`
  : `**${moment(p.start).utc().format()}**`;
  return {
    name:  `**ID #${p.id}: ${p.topic}** - ${flair}`,
    value: `${startTime} - Organized by **${p.username}**\n` + (enrollments.length > 0 ? "Enrolled: " + enrollmentString : "No one has signed up yet.") +
    `\nType \`!lpjoin ${p.id}\` to join.`,
  };
}

const renderPartyScheduledResult = (partyId, topic, start, end, owner, channel) => {
  return {
    embed: {
      description: `**Party scheduled for ${topic}** - ID ${partyId}`,
      fields:[
        {
          name:"Start",
          value: moment(start).toString(),
        },
        {
          name:"End",
          value: moment(end).toString(),
        },
        {
          name:"Organizer",
          value: owner,
        },
        {
          name:"Channel",
          value: channel,
        }
      ]
    }
  };
}

const botFormatter = {
  DATE_FORMAT,
  addUpcomingBottomFields,
  getHelpFields,
  generatePartyCreationErrors,
  renderUpcomingParty,
  renderPartyScheduledResult,
  errorMessages,
  messages,
  descriptions,
}

export default botFormatter;