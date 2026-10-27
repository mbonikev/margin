-- Nothing nameless.
--
-- `name` was NOT NULL, which an empty string satisfies — so a record saved
-- with the field untouched produced an activity row that said only that
-- something had happened, with no way to tell what. The UI now requires it;
-- this makes the database agree, so a future screen cannot reintroduce it.

update public.entries set name = 'Untitled' where length(trim(name)) = 0;

alter table public.entries
    add constraint entries_name_not_blank check (length(trim(name)) > 0);
