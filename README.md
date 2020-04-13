# BoomAdmin

boomadmin - MySQL db explorer with SQL builder

## Usage

1.  Clone repo
2.  `yarn install`
3.  `cp config.example.json config.json` and add db credentials
4.  `yarn build` to build frontend assets
5.  `yarn start` to run server

## Features

- Automatic foreign key as links
- Maps id columns to readable names as links e.g user_id -> user(id=user_id).name
- Detailed view shows `Referenced By` pane with counts so related tables are easily found.

## TODO

- Some way of authentication
- Ability to delete and update
- Ability to run RAW SQL statements (can be turned on via config)
- Ability to import/export .sql, .cvs, .json files
- More enhancements to SQL builder & SQL Emitter
- Simple charting
