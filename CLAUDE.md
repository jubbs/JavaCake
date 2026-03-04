# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JavaCake is a CakePHP-inspired MVC framework for Node.js. It uses convention-over-configuration with Express, MySQL (via mysql2), EJS templating, and built-in authentication.

## Commands

- `npm start` — Start the server (`node webroot/index.js`)
- `npm run dev` — Start with auto-reload (nodemon)
- `npm test` — Run tests (Jest)

## Architecture

**Entry point:** `webroot/index.js` creates an `Application` instance, which initializes Express, connects to MySQL, sets up middleware, and mounts the Router.

**Request lifecycle:**
1. Router parses URL → resolves controller/action via convention or custom routes in `config/routes.js`
2. Loader (singleton) loads and caches the controller class from `src/controllers/`
3. Controller `beforeFilter()` runs → action executes → view auto-renders → `afterFilter()` runs
4. View renders EJS template from `src/views/{controller}/{action}.ejs` wrapped in layout from `src/views/layouts/`

**Core classes (`src/core/`):**
- `Application` — Express setup, middleware, DB connection, error handling
- `Router` — Convention-based routing (`/controller/action/params`) + custom routes; generates Express middleware
- `Controller` — Base class with `set()`, `render()`, `redirect()`, `json()`, `flash()`, `loadComponent()`, `loadModel()`
- `Model` — Active Record ORM with static methods (`find`, `findById`, `findAll`, `save`, `update`, `delete`), associations (`hasMany`, `belongsTo`, `hasOne`, `belongsToMany`), query builder, and lifecycle callbacks
- `Loader` — Singleton that resolves and caches controllers, models, components, and helpers by naming convention
- `View` — EJS renderer with layout support
- `QueryBuilder` — Fluent SQL query interface
- `Database` — MySQL connection pool wrapper

**Naming conventions (critical for auto-loading):**
- Controllers: `{Name}Controller.js` (PascalCase + Controller suffix), class `{Name}Controller`
- Models: `{Name}.js` (PascalCase singular), table defaults to plural snake_case
- Views: `src/views/{controller_lowercase}/{action_snake_case}.ejs`
- Components: `{Name}Component.js` in `src/components/`, loaded via `this.loadComponent('Name')`
- Helpers: `{Name}Helper.js` in `src/helpers/`, auto-loaded in views as `FormHelper`, `HtmlHelper`, `AuthHelper`
- Foreign keys: `{model}_id`, join tables: `{model1}_{model2}` (alphabetical)

**Configuration:** `config/app.js` (port, session, debug), `config/database.js` (MySQL), `config/routes.js` (custom routes)

## Key Patterns

- All Model methods are **static** — no instantiation needed (e.g., `await Post.findAll()`)
- Controllers receive `(req, res)` in constructor; use `this.set(key, value)` to pass data to views
- Components attach to controller as `this.{Name}` after `loadComponent()` (e.g., `this.Auth`)
- Auto-rendering: views render automatically unless `this.autoRender = false`, `redirect()`, or `json()` is called
- Flash messages stored in session: `this.flash(message, type)`
