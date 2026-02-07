# Database Tables

This document provides an overview of the database tables used in the MMO RPG AION Classic EU game. The database is designed to capture various aspects of the game, including users, characters, NPCs, players, mobs, bosses, skills, quests, maps, instances (dungeons), items, item effects, and groups.

All tables in the database should be defined in the `src/infra/db/drizzle/schema.ts` file using Drizzle ORM. Below is a list of the main tables along with their relationships and purposes.

All Tables have:

- a primary key `id` which is an auto-incrementing integer.
- a `createdAt` timestamp that defaults to the current time when a record is created.
- an `updatedAt` timestamp that updates to the current time whenever a record is updated.
- a `deletedAt` timestamp that is nullable and can be used for soft deletes.

When you see `n&d` means "name and description" fields, which are common across many tables to provide a human-readable identifier and a brief description of the entity.

When you see `likable` it means that the table has a `likes` and `dislikes` field, which is an integer that can be incremented to track how many users have liked a particular record.

The core principle of the database design is to maintain a clear separation of concerns while ensuring that relationships between entities are well-defined and efficient for querying. Addtionally, the the design should be flexible enough to accommodate future expansions of the game and its features (aka scalable).

### Users

### Characters

- n&d
- race - Enum (Elyos, Asmodian, Balaur, other)
- level - Integer representing the character's current level
- type - Enum (Player, NPC, Mob, Boss)

#### Notes: Apply Parent Child Inheritance between Characters and Npcs, Players, Mobs, Bosses tables. This way we can have common fields in Characters table and specific fields in the child tables.

### NpcQuests (junction table for one-to-many relationship between Npcs and Quests)

- character_id - Foreign key referencing Characters table
- quest_id - Foreign key referencing Quests table

#### Constraints:

- character_id must reference a Character with type 'NPC'. This ensures that only NPC characters can be associated with quests in this table.

### Players

- player_class_id - Foreign key referencing PlayerClasses table

### Player Classes

- n&d
- origin - Enum (Mage, Scout, Warrior, Priest, )
- evolution - Enum (Gladiator, Templar, Assassin, Ranger, Sorcerer, Spiritmaster)
- role - Enum (DPS, Tank, Healer, Buffer, Debuffer)

### Mobs

### Bosses

### Skills

### Quests

- n&d
- difficulty_id - Foreign key referencing Difficulties table
- is_repeatable - Boolean indicating whether the quest can be repeated after completion
- min_level - Integer representing the minimum character level required to accept the quest
- quest_type_id - Foreign key referencing QuestTypes table
- race - Enum (Elyos, Asmodian, Balaur, other)
- frequency - Enum (daily, weekly, monthly, etc.)

#### Constraints:

- If `is_repeatable` is false, then `frequency` must be null. This ensures that non-repeatable quests do not have a frequency assigned.

Relationships:

- 1 Quest can have only 1 Npc, but one Npc can have many Quests (one-to-many relationship through NpcQuests table)\
-

### QuestTypes

- n&d
- type - Enum (Main Story, Side Quest, Daily Quest, Event Quest, etc.)

### Quest Groups

Description: This table captures the grouping of quests, which can be used to organize quests into categories or storylines. For example, a quest group could represent a specific storyline, faction, or region in the game.

- n&d
- likable

Relationships:

- 1 Quest can belong to many Quest Groups, and each Quest Group can have many Quests (many-to-many relationship)

### Rewards (junction table for many-to-many relationship between RewardSources and Items)

- n&d

- quantity - Integer, the amount of the item rewarded
- reward_source_id - Foreign key referencing RewardSources table
- item_id - Foreign key referencing Items table

### RewardSources

- n&d

- quest_id - Foreign key referencing Quests table (nullable, if the reward source is not a quest)
- world_event_id - Foreign key referencing WorldEvents table (nullable, if the reward source is not a world event)

Description: This table captures the various sources from which players can obtain rewards, such as quests, bosses, or events. It allows for a flexible association of rewards with multiple sources.

### Maps

- n&d
- race - Enum (Elyos, Asmodian, Both)

### Areas (zones within maps)

- n&d

- can_fly - Boolean indicating whether players can fly in this area
- can_pvp - Boolean indicating whether players can engage in PvP combat at this location
- map_id - Foreign key referencing Maps table

### Locations

- n&d

- area_id - Foreign key referencing Areas table
- cord_x - Decimal, the X coordinate of the location
- cord_y - Decimal, the Y coordinate of the location

### Instances (Dungeons)

- n&d
- likable
- frequency - Enum (daily, weekly, monthly, etc.)
- difficulty_id - Foreign key referencing Difficulties table
- map_id - Foreign key referencing Maps table
- min_level - Integer representing the minimum level required to enter the instance
- max_level - Integer representing the maximum level allowed to enter the instance
- min_players - Integer representing the minimum number of players required to enter the instance
- max_players - Integer representing the maximum number of players allowed to enter the instance

### Items

- n&d
- category - Enum (e.g., weapon, armor, accessory, consumable, etc.)
- rarity - Enum (e.g., common, uncommon, rare, epic, legendary)
- min_level - Integer representing the minimum character level required to use the item
- max_level - Integer representing the maximum character level that can use the item
- is_quest_item - Boolean indicating whether the item is a quest item (i.e., it can only be obtained or used in the context of a quest)
- can_be_traded - Boolean indicating whether the item can be traded between players
- can_be_crafted - Boolean indicating whether the item can be crafted by players
- can_be_dropped - Boolean indicating whether the item can be dropped by mobs or bosses
- can_be_sold_via_broker - Boolean indicating whether the item can be sold to NPC brokers for in-game currency
- can_be_stored_in_account_warehouse - Boolean indicating whether the item can be stored in player warehouses for later retrieval
- can_be_stored_in_legion_warehouse - Boolean indicating whether the item can be stored in legion warehouses for later retrieval
- can_be_extracted - Boolean indicating whether the item can be extracted for crafting materials or other purposes
- can_extract_appearance - Boolean indicating whether the item's appearance can be extracted for use in transmogrification or similar systems
- can_be_recorded - Boolean indicating whether the item can be recorded in the player's collection or achievement system
- can_be_demolished - Boolean indicating whether the item can be demolished for crafting materials or other purposes

### ItemDrops (junction table for many-to-many relationship between Mobs/Bosses and Items)

- mob_id - Foreign key referencing Mobs table (nullable, if the item can drop from a boss)
- boss_id - Foreign key referencing Bosses table (nullable, if the item can drop from a mob)
- item_id - Foreign key referencing Items table

### ItemEffects

### ItemEffectLinks (junction table for many-to-many relationship between Items and ItemEffects)

### Stats

- n&d
- attribute - Enum (e.g., speed, attack, atk_speed, hp, mp, etc.)

### ItemStats (junction table for many-to-many relationship between Items and Stats, with additional fields for stat values)

item_id - Foreign key referencing Items table
stat_id - Foreign key referencing Stats table
value - Numeric value representing the stat provided by the item
is_percentage - Boolean indicating whether the stat value is a percentage (e.g., +10% Attack) or a flat value (e.g., +100 HP)

### CalendarEntries

- n&d
- user_id - Foreign key referencing Users table (the creator of the calendar entry)
- start_time - Timestamp representing the start time of the event or activity
- end_time - Timestamp representing the end time of the event or activity
- activity_id - Foreign key referencing Activities table

### WorldEvents

- n&d
- location_id - Foreign key referencing Locations table
- difficulty_id - Foreign key referencing Difficulties table

### Difficulties (This might need thought)

- min_players - Integer representing the minimum number of players required for the event or instance
- max_players - Integer representing the maximum number of players allowed for the event or instance
- type - Enum (solo, group, alliance, league)

### Routines

Definition: A Routine is a user-defined plan or schedule for completing specific activities in the game, such as quests, farming, or leveling up. It helps players organize their in-game tasks and optimize their gameplay. It's conposed of multiple Activity Groups, which in turn are composed of individual Activities. Routines can be shared among users, allowing for community-driven content and collaboration.

- n&d
- likable
- user_id - Foreign key referencing Users table (the creator of the routine)

Relationships:

- 1 User can have many Routines, but each Routine belongs to one User (one-to-many relationship)
- 1 Routine can have many Activity Groups, and each Activity Group can belongs to many Routine (many-to-many relationship)

### Activities

- n&d
- quest_id
- quest_grp_id
- world_event_id
- instance_id
- duration_minutes - Integer representing the estimated time to complete the activity
- user_id - Foreign key referencing Users table (the creator of the activity)
- calendar_entry_id - Foreign key referencing CalendarEntries table (optional, if the activity is associated with a calendar entry)
- times_to_repeat - Integer representing how many times the activity should be repeated in the routine
- type - Enum (e.g., quest, instance, world_event)

#### Relationships:

- 1 User can have many Activities, but each Activity belongs to one User (one-to-many relationship)
- 1 Activity can be associated with one CalendarEntry, and a CalendarEntry can have only 1 Activity (one-to-one relationship)
- 1 Activity can be associated with one Quest, and a Quest can have many Activities (one-to-many relationship)
- 1 Activity can be associated with one Quest Group, and a Quest Group can have many Activities (one-to-many relationship)
- 1 Activity can be associated with one World Event, and a World Event can have many Activities (one-to-many relationship)

#### Constraints:

- Only one of the following fields can be non-null for a given Activity: `quest_id`, `quest_grp_id`, `world_event_id`. This ensures that an Activity is associated with only one type of content (either a quest, a quest group, or a world event).
- The `type` field should be consistent with the non-null content field. For example, if `quest_id` is non-null, then `type` should be 'quest'.
- If `instance_id` is non-null, then `type` should be 'instance'.

### ActivityGroups (junction table for many-to-many relationship between Routines and Activities)

- routine_id - Foreign key referencing Routines table
- activity_id - Foreign key referencing Activities table

### Priorities

- n&d
  type - Enum (e.g., XP, Kinah, PvP Gear, PvE Gear, Cosmetics, etc.)
