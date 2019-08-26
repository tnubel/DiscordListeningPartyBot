import Sequelize, { STRING, DATE, Op, INTEGER, BOOLEAN } from 'sequelize';
import { SSL_OP_NETSCAPE_CHALLENGE_BUG } from 'constants';
const moment = require('moment');

const sequelize = new Sequelize('database', 'user', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  logging: false, //console.log,
  operatorsAliases: false,
  // SQLite only
  storage: 'database.sqlite',
});

const listeningParties = sequelize.define('listeningparties', {
  topic: {
    type: STRING,
  },
  start: DATE,
  end: DATE,
  username: STRING,
  channel: STRING,
  channelId: STRING,
  guild: STRING,
  guildId: STRING,
  pingSent: BOOLEAN,
});

const enrollment = sequelize.define('enrollment', {
  listeningPartyId: {
    type: INTEGER,
    references: {
      model: listeningParties,
      key: 'id'
    }
  },
  userId: {
    type: STRING,
  },
  userTag: {
    type: STRING,
  }
});

var dataLayer = {
  initialize: () => {
    listeningParties.sync({
      //force: true
    });
    enrollment.sync({
      //  force: true
    });
  },
  createParty: async (party, owner) => {
    const partyResult = await listeningParties.create({
      topic: party.topic,
      start: party.start,
      end: party.end,
      username: owner,
      channel: party.channel,
      channelId: party.channelId,
      guild: party.guild,
      guildId: party.guildId,
      pingSent: false,
    });
    return partyResult;
  },
  updateParty: async (partyId, newProps) => {
    return await listeningParties.update(newProps,
      {
        where: {
          id: partyId,
        }
      });
  },
  getPartiesInRange: async (start, end, guildId, channelId) => {
    return await listeningParties.findAll({
      where: {
        guildId: guildId,
        channelId: channelId,
        [Op.or]: [
          {
            start: {
              [Op.gte]: start,
              [Op.lt]: end,
            }
          },
          {
            end: {
              [Op.gt]: start,
              [Op.lte]: end,
            }
          }
        ]
      }
    });
  },
  findPartyForTopic: async (guildId, channelId, topic) => {
    return await listeningParties.findOne({
      where: {
        guildId: guildId,
        channelId: channelId,
        topic: topic,
        start: {
          [Op.gte]: moment().toDate(),
        },
      },
      order: [['start', 'ASC']]
    });
  },
  findPartyById: async (guildId, channelId, id) => {
    return await listeningParties.findOne({
      where: {
        guildId: guildId,
        channelId: channelId,
        id: id,
        start: {
          [Op.gte]: moment().toDate(),
        },
      },
    });
  },
  deletePartyById: async (guildId, channelId, id) => {
    return await listeningParties.destroy({
      where: {
        guildId: guildId,
        channelId: channelId,
        id: id,
        start: {
          [Op.gte]: moment().toDate(),
        },
      },
    });
  },
  getPartiesHappeningSoon: async () => {
    return await listeningParties.findAll({
      where: {
        pingSent: false,
        start: {
          [Op.lte]: moment().add(10, "minutes"),
        }
      }
    });
  },
  markPartiesHappeningSoonAsPinged: async () => {
    return await listeningParties.update({
      pingSent: true,
    },
      {
        where: {
          pingSent: false,
          start: {
            [Op.lte]: moment().add(10, "minutes"),
          }
        }
      });
  },
  findEnrollment: async (userId, partyId) => {
    return await enrollment.findOne({
      where: {
        listeningPartyId: partyId,
        userId: userId,
      }
    });
  },
  enrollUser: async (userId, userTag, partyId) => {
    return await enrollment.create({
      listeningPartyId: partyId,
      userId: userId,
      userTag: userTag,
    });
  },
  getEnrollmentsForParty: async (partyId) => {
    return await enrollment.findAll({
      where: {
        listeningPartyId: partyId,
      }
    });
  }
}

export { dataLayer };