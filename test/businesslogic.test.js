const { validateParty } = require('../lib/businesslogic.js');
const assert = require('assert');
const moment = require('moment-timezone');

describe('Business Logic', function() {
  describe('validateParty', function() {
    it('should not throw errors for a valid party', function() {
      const result = validateParty({
        topic: "Test Topic",
        dateTime: "2020-08-22 10:00",
        timeZone: "America/Los_Angeles",
        duration: "1",
        channel: "General",
        channelId: "12345",
        guild: "My Server",
        guildId: "12311",
      });

      const expectedResult = {
        errors: [],
        party: {
          topic: "Test Topic",
          start: "2020-08-22T17:00:00Z",
          end: "2020-08-22T18:00:00Z",
          channel: "General",
          channelId: "12345",
          guild: "My Server",
          guildId: "12311",
        }
      };
      assert.deepEqual(result, expectedResult);
    });

    it('Fails if topic is too short', function() {
      const result = validateParty({
        topic: "Test",
        dateTime: "2020/08/22 10:00",
        timeZone: "America/Los_Angeles",
        duration: "1",
        channel: "General",
        channelId: "12345",
        guild: "My Server",
        guildId: "12311",
      });

      assert.deepEqual(result.errors.length, 1);
      console.log(result.errors);
      assert.deepEqual(result.party, null);
    });

    
    it('Fails if duration is not a number', function() {
      const result = validateParty({
        topic: "Testing test test",
        dateTime: "2020/08/22 10:00",
        timeZone: "America/Los_Angeles",
        duration: "Not a number",
        channel: "General",
        channelId: "12345",
        guild: "My Server",
        guildId: "12311",
      });

      assert.deepEqual(result.errors.length, 1);
      console.log(result.errors);
      assert.deepEqual(result.party, null);
    });

    it('Fails if duration is out of bounds', function() {
      const result = validateParty({
        topic: "Testing test test",
        dateTime: "2020/08/22 10:00",
        timeZone: "America/Los_Angeles",
        duration: "45",
        channel: "General",
        channelId: "12345",
        guild: "My Server",
        guildId: "12311",
      });

      assert.deepEqual(result.errors.length, 1);
      console.log(result.errors);
      assert.deepEqual(result.party, null);
    });


    it('Fails if date time is bogus', function() {
      const result = validateParty({
        topic: "Testing test test",
        dateTime: "tomorrow",
        timeZone: "America/Los_Angeles",
        duration: "2",
        channel: "General",
        channelId: "12345",
        guild: "My Server",
        guildId: "12311",
      });

      assert.deepEqual(result.errors.length, 1);
      console.log(result.errors);
      assert.deepEqual(result.party, null);
    });

    it('correctly interprets time zones, understanding 10 AM PST to be 17 GMT', function() {
      const result = validateParty({
        topic: "Test Topic",
        dateTime: "2020-08-22 10:00",
        timeZone: "America/Los_Angeles",
        duration: "1",
        channel: "General",
        channelId: "12345",
        guild: "My Server",
        guildId: "12311",
      });

      const expectedResult = {
        errors: [],
        party: {
          topic: "Test Topic",
          start: "2020-08-22T17:00:00Z",
          end: "2020-08-22T18:00:00Z",
          channel: "General",
          channelId: "12345",
          guild: "My Server",
          guildId: "12311",
        }
      };
      assert.deepEqual(result, expectedResult);
    });

    it('Fails if date time is in the past', function() {
      const result = validateParty({
        topic: "Testing test test",
        dateTime: moment.tz().subtract(5,"minutes"),
        timeZone: moment.tz().zoneAbbr(),
        duration: "2",
        channel: "General",
        channelId: "12345",
        guild: "My Server",
        guildId: "12311",
      });

      assert.deepEqual(result.errors.length, 1);
      console.log(result.errors);
      assert.deepEqual(result.party, null);
    });

  });
});