# kiyoi

kiyoi is a utility and helper library for Next.js and React. Because web development shouldn't be hard.

## Installation

```bash
npm install --save kiyoi
yarn add kiyoi
pnpm add kiyoi
bun add kiyoi
```

## Features

- `kiyoi/crypto`: `encrypt()` and `decrypt()`, using Iron.
- `kiyoi/enum`: `Enum()`.
- `kiyoi/nextjs`: `mergeCookies`.
- `kiyoi/result`: `Result<T, E>`, `Result.ok()`, and `Result.error()`, as well as matchers.
- `kiyoi/session`: `Session.get()`, `Session.save()`, and `Session.destroy()`, using Iron, plus plugins and validators.
- `kiyoi/client`: `use()`, a server-action-to-SWR hook, and `Actions()`, a wrapper for action-based APIs.
