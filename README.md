# DiscordListeningPartyBot

## What is this?
DiscordListeningPartyBot is a bot designed to facilitate *listening parties* on music-oriented Discord servers. This can be tough because of users in multiple time zones and difficulties managing fleeting events using pinning or other mod-centric strategies.

Using DLPB, users can:
- schedule their own parties, and update/cancel them
- find out what parties are happening soon
- join others' parties to get notified when they're about to start

Sometimes, moderator oversight is necessary. DLPB offers some administrative capabilities:
- Moderators can cancel or update any party 
- It can be configured to only allow certain roles to create parties [**in progress**]

## Getting Started
1. Set up your app and add a bot on the Discord developer portal.
2. Copy the bot's secret and create a file named 'secret.js' that uses it - see secret.template.js for an example.
3. Run `npm install`
4. Run `npm run build`
5. Run `npm start` to launch the bot.
