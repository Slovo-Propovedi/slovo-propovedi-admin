# Модуль `users` — админ-аккаунты

Слой данных об админ-аккаунтах. **Нет HTTP-контроллера** — админы создаются через инфра-playbook (один `admin`-row), а не через API. `UsersService` потребляется только `AuthService`.

**Слой:** backend (module `users`)
**Статус:** актуально

## Сущность `User` (`backend/src/users/entities/user.entity.ts`)

Таблица `user` (`@Entity('user')`). Креды живут здесь.

| Поле | Колонка | Тип | Ограничения |
|------|---------|-----|-------------|
| `id` | `id` | uuid | PK |
| `name` | `name` | varchar | NOT NULL, `@IsNotEmpty` |
| `email` | `email` | varchar | UNIQUE, `@IsEmail`, `@IsNotEmpty` |
| `username` | `username` | varchar | UNIQUE, `@IsString`, `@IsNotEmpty` |
| `password` | `password` | varchar | bcrypt-хэш |

> ⚠️ Единственная сущность, использующая **class-validator** (`@IsNotEmpty`, `@IsEmail`, `@IsString`) вместо Zod-DTO. Это legacy: class-validator здесь не участвует в HTTP-валидации (глобальный strict-пайп требует Zod), а используется как декларативные метаданные сущности. См. [`../conventions.md`](../conventions.md).

## `UsersService` (`backend/src/users/users.service.ts`)

Публичные методы (ошибки оборачиваются в `HttpException`):

| Метод | Назначение |
|-------|------------|
| `findOneByUsername(username): Promise<User \| null>` | поиск по `username` (используется при логине) |
| `findOneById(id): Promise<User \| null>` | поиск по `id` (используется в `getProfile`) |
| `updatePassword(id, hashedPassword): Promise<void>` | обновление пароля (используется при auto-rehash legacy-пароля) |

`backend/src/users/users.module.ts`:

```ts
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],   // AuthService использует UsersService
})
export class UsersModule {}
```

> ✅ `UsersModule` экспортирует `UsersService` **и** `TypeOrmModule` — это позволяет `AuthModule` пользоваться сервисом; наружу HTTP-эндпоинтов нет.

## Связанные документы

- [README.md](./README.md) — индекс модулей
- [auth.md](./auth.md) — как `UsersService` используется в `signIn`/`getProfile`/auto-rehash
- [../db.md](../db.md) — таблица `user` в схеме БД
- [../conventions.md](../conventions.md) — note про legacy class-validator
