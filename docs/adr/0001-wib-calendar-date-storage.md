# WIB Calendar Date Storage

Calendar dates (booking dates, pickup dates, daily stock windows) are stored as UTC midnight (`YYYY-MM-DDT00:00:00.000Z`) rather than timezone-aware timestamps. Real instants (createdAt, updatedAt, range query boundaries) use offset timestamps (`YYYY-MM-DDT00:00:00+07:00`).

This avoids DST ambiguity and keeps calendar-date arithmetic simple. The `parseYMD` helper produces UTC midnight; `fromWIBString` produces offset instants. They are not interchangeable.