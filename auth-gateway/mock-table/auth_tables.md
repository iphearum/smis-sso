# Auth Tables (PostgreSQL, `smis.pro` — inspected 2025-12-05)

## Accessing the Database
To inspect the current database schema, connect to the PostgreSQL database using with credentials from the environment configuration.
- user: `smis_auth_sso`
- database: `smis.pro`
- host: `127.0.0.1`
- port: `5432`

Current definitions in the live database (`public` schema).

## users
- `id` serial PK  
- `name` varchar(255) not null  
- `email` varchar(255) not null **unique**  
- `password` varchar(60)  
- `confirmation_code` varchar(255) not null  
- `confirmed` boolean not null default `true`  
- `remember_token` varchar(100)  
- `created_at` timestamp default `now()`  
- `updated_at` timestamp default `1900-01-01 00:00:00`  
- `deleted_at` timestamp  
- `status` smallint not null default `1`  
- `reset_password` boolean not null default `false`  

## roles
- `id` serial PK  
- `name` varchar(255) not null **unique**  
- `all` boolean not null default `false`  
- `sort` smallint not null default `0`  
- `created_at` timestamp default `now()`  
- `updated_at` timestamp default `1900-01-01 00:00:00`  
- `parent_id` int FK → `roles.id` (cascade)  

## permissions
- `id` serial PK  
- `group_id` int  
- `name` varchar(255) not null **unique**  
- `display_name` varchar(255) not null  
- `system` boolean not null default `false`  
- `sort` smallint not null default `0`  
- `created_at` timestamp default `now()`  
- `updated_at` timestamp default `1900-01-01 00:00:00`  

## permission_groups
- `id` serial PK  
- `parent_id` int  
- `name` varchar(255) not null  
- `sort` smallint not null default `0`  
- `created_at` timestamp default `now()`  
- `updated_at` timestamp default `1900-01-01 00:00:00`  

## permission_dependencies
- `id` serial PK  
- `permission_id` int FK → `permissions.id` (cascade)  
- `dependency_id` int FK → `permissions.id` (cascade)  
- `created_at` timestamp default `now()`  
- `updated_at` timestamp default `1900-01-01 00:00:00`  

## permission_role
- `id` serial PK  
- `permission_id` int FK → `permissions.id` (cascade)  
- `role_id` int FK → `roles.id` (cascade)  


## branches
- `id` bigserial PK  
- `name_en` varchar(255) not null  
- `name_kh` varchar(255) not null  
- `name_fr` varchar(255) not null  
- `description` varchar(255)  
- `code` varchar(255) not null  
- `created_at` timestamp  
- `updated_at` timestamp  

## departments
- `id` serial PK  
- `name_kh` varchar(255)  
- `name_en` varchar(255) not null  
- `name_fr` varchar(255)  
- `code` varchar(255)  
- `description` varchar(255)  
- `is_specialist` boolean not null default `true`  
- `active` boolean not null default `true`  
- `parent_id` int FK → `departments.id` (cascade)  
- `school_id` int not null FK → `schools.id` (cascade)  
- `create_uid` int not null FK → `users.id`  
- `write_uid` int FK → `users.id`  
- `is_vocational` boolean not null default `false`  
- `order` int not null default `1`  
- `created_at` timestamp  
- `updated_at` timestamp  
- indexes: create_uid, write_uid, is_vocational  

## degrees
- `id` serial PK  
- `name_kh` varchar(255)  
- `name_en` varchar(255) not null  
- `name_fr` varchar(255)  
- `code` varchar(255)  
- `description` varchar(255)  
- `active` boolean not null default `true`  
- `school_id` int not null FK → `schools.id` (cascade)  
- `create_uid` int not null FK → `users.id`  
- `write_uid` int FK → `users.id`  
- `created_at` timestamp  
- `updated_at` timestamp  
- indexes: create_uid, write_uid  


## employees
- `id` serial PK  
- `name_kh` varchar(255)  
- `name_latin` varchar(255) not null  
- `email` varchar(255)  
- `phone` varchar(255)  
- `birthdate` timestamp  
- `address` varchar(255)  
- `active` boolean not null default `true`  
- `created_at` timestamp  
- `updated_at` timestamp  
- `gender_id` int FK → `genders.id` (cascade)  
- `department_id` int not null FK → `departments.id`  
- `create_uid` int FK → `users.id`  
- `write_uid` int FK → `users.id`  
- `user_id` int FK → `users.id`  
- `payslip_client_id` int FK → `"payslipClients".id`  
- `id_card` int  
- `status` varchar(255)  
- `salary_rate` varchar(100)  
- `state_position` varchar(255)  
- `observation` varchar(255)  
- `title_id` int FK → `titles.id` (cascade)  
- `service` varchar(255)  
- `branch_id` int FK → `branches.id` (default 1)  
- indexes: create_uid, write_uid, gender_id, department_id, user_id, title_id, name_kh  

## assigning_roles
- `id` bigserial PK  
- `entity_type` varchar(50) not null  
- `entity_id` bigint not null  
- `assignable_type` varchar(50) not null  
- `assignable_id` bigint not null  
- `parent_id` bigint  
- `created_at` timestamp  
- `updated_at` timestamp  
- `deleted_at` timestamp  
- indexes: (`entity_type`, `entity_id`), (`assignable_type`, `assignable_id`), (`parent_id`)  
- unique `unique_active_assignment` on (`entity_type`, `entity_id`, `assignable_type`, `assignable_id`, `parent_id`)  


Sample data in assignment_roles:

| id   | entity_type | entity_id | assignable_type | assignable_id | parent_id | created_at          | updated_at          | deleted_at |
|------|-------------|-----------|-----------------|---------------|-----------|---------------------|---------------------|------------|
| 322  | branch      | 1         | employee        | 373           |           | 2025-12-03 15:36:42 | 2025-12-03 15:36:42 |            |
| 324  | degree      | 1         | employee        | 373           | 323       | 2025-12-03 15:36:42 | 2025-12-03 15:36:42 |            |
| 3548 | degree      | 3         | employee        | 373           | 2035      | 2025-11-07 10:10:39 | 2025-11-07 10:10:39 |            |
| 3547 | degree      | 4         | employee        | 373           | 2035      | 2025-11-07 10:10:39 | 2025-11-07 10:10:39 |            |
| 3549 | degree      | 7         | employee        | 373           | 2035      | 2025-11-07 10:10:39 | 2025-11-07 10:10:39 |            |
| 2036 | degree      | 1         | employee        | 373           | 2035      | 2025-12-03 15:36:43 | 2025-12-03 15:36:43 |            |
| 3550 | degree      | 6         | employee        | 373           | 2035      | 2025-11-07 10:10:39 | 2025-11-07 10:10:39 |            |
| 3545 | degree      | 2         | employee        | 373           | 2035      | 2025-11-07 10:10:39 | 2025-11-07 10:10:39 |            |
| 3546 | degree      | 5         | employee        | 373           | 2035      | 2025-11-07 10:10:39 | 2025-11-07 10:10:39 |            |
| 2035 | department  | 10        | employee        | 373           | 322       | 2025-11-07 10:10:39 | 2025-11-07 10:10:39 |            |
| 323  | department  | 6         | employee        | 373           | 322       | 2023-04-24 14:48:10 | 2023-04-24 14:48:10 |            |
| 4690 | permission  | 209       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4685 | permission  | 203       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4686 | permission  | 207       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4687 | permission  | 204       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4688 | permission  | 202       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4689 | permission  | 205       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4648 | permission  | 212       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4649 | permission  | 219       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4650 | permission  | 39        | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4651 | permission  | 22        | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4652 | permission  | 162       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4653 | permission  | 44        | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4654 | permission  | 210       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4655 | permission  | 242       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4656 | permission  | 31        | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4657 | permission  | 89        | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4658 | permission  | 73        | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4659 | permission  | 132       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4660 | permission  | 150       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4661 | permission  | 148       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4662 | permission  | 130       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4663 | permission  | 142       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4664 | permission  | 48        | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4665 | permission  | 135       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4666 | permission  | 56        | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4667 | permission  | 117       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4668 | permission  | 65        | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4669 | permission  | 157       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4670 | permission  | 52        | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4671 | permission  | 152       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4672 | permission  | 64        | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4673 | permission  | 26        | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4674 | permission  | 211       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4675 | permission  | 1         | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4676 | permission  | 194       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4677 | permission  | 195       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4678 | permission  | 201       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4679 | permission  | 30        | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4680 | permission  | 77        | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4681 | permission  | 208       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4682 | permission  | 206       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4683 | permission  | 191       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4684 | permission  | 248       | employee        | 373           | 323       | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 2587 | position    | 20        | employee        | 373           | 2035      | 2017-02-07 00:00:00 | 2025-12-03 15:36:44 |            |
| 2055 | position    | 4         | employee        | 373           | 2035      | 2025-12-03 15:36:43 | 2025-12-03 15:36:43 |            |
| 3672 | role        | 10        | employee        | 373           | 323       | 2025-12-03 15:36:44 | 2025-12-03 15:36:44 |            |
| 3673 | role        | 9         | employee        | 373           | 323       | 2025-12-03 15:36:44 | 2025-12-03 15:36:44 |            |
| 3674 | role        | 14        | employee        | 373           | 323       | 2025-12-03 15:36:44 | 2025-12-03 15:36:44 |            |
| 1477 | branch      | 1         | employee        | 930           |           | 2025-12-03 15:36:43 | 2025-12-03 15:36:43 |            |
| 1479 | degree      | 1         | employee        | 930           | 1478      | 2025-12-03 15:36:43 | 2025-12-03 15:36:43 |            |
| 1878 | degree      | 1         | employee        | 930           | 1877      | 2025-12-03 15:36:43 | 2025-12-03 15:36:43 |            |
| 3184 | department  | 10        | employee        | 930           | 1477      | 2025-12-03 15:36:44 | 2025-12-03 15:36:44 |            |
| 1478 | department  | 4         | employee        | 930           | 1477      | 2023-04-24 14:48:16 | 2023-04-24 14:48:16 |            |
| 1877 | department  | 20        | employee        | 930           | 1477      | 2025-12-03 15:36:43 | 2025-12-03 15:36:43 |            |
| 3185 | position    | 1         | employee        | 930           | 3184      | 2025-12-03 15:36:44 | 2025-12-03 15:36:44 |            |
| 4557 | role        | 17        | employee        | 930           | 1478      | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4558 | role        | 1         | employee        | 930           | 1478      | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4559 | role        | 18        | employee        | 930           | 1478      | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
| 4560 | role        | 9         | employee        | 930           | 1478      | 2025-12-03 15:36:45 | 2025-12-03 15:36:45 |            |
