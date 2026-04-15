---
applyTo: "develop/backend/gooderp-orchestation/**"
description: "Use when working on GoodERP backend files. Be strict about the real Lambda and servicio-* structure, enforce CORS and full HTTP method coverage for API Gateway Lambdas, reuse existing NestJS/Lambda patterns, and avoid ambiguous or speculative implementations."
---

# GoodERP Backend — Strict Execution Rules

## Objective
Reduce ambiguity and rework. Every backend change must map to the real structure of `gooderp-orchestation` and follow the mature patterns already present in Lambdas and NestJS services.

## Mandatory architecture map

Use only the real backend structure:
- `lib/lambda/` for AWS Lambdas by domain
- `servicio-*/src/` for NestJS microservices
- `scripts/`, `lambda-deploy/`, `terraform/` for deployment and infrastructure concerns
- existing certification and evidence artifacts when validating business flows

## Mandatory Git flow

Before editing backend code:
- identify the backend repo base branch in use;
- create a working branch under `fix/<slug>`;
- implement only in that branch;
- prepare a PR back to the corresponding base branch.

Never implement directly on shared base branches.

## Placement rules

1. Never create a Lambda outside `lib/lambda/<dominio>/fn<Nombre>/`.
2. Never create a microservice outside `servicio-<nombre>/src/**`.
3. If an equivalent Lambda or service already exists, extend that path first.
4. Treat API Gateway Lambdas as HTTP products: check `GET`, `POST`, `PUT`, `DELETE`, and `OPTIONS`.
5. Handle `OPTIONS` first and ensure CORS is enabled consistently in code and gateway behavior.
6. Use deployment and certification paths already present in the repo instead of inventing ad hoc scripts.
7. If the request contains an API Gateway URL or `/api/v1/<resource>` path, route first to `lib/lambda/**` instead of scanning the whole repository.
8. Only inspect `servicio-*` first when the user explicitly mentions a NestJS service or a `servicio-<nombre>` path.

## Implementation rules

- Reuse `ResponseBuilder`, `extractTenantId`, handlers and utils in Lambdas.
- Reuse `JwtTenantGuard`, `@TenantId()`, DTO/entity/service/controller patterns in NestJS.
- Never source tenant information from request body or user-provided params when a JWT-based pattern exists.
- If the request implies missing CRUD methods, implement the missing methods following the existing design.
- Any SQL migration must be executed through Node.js from within the solution, using the connection data already mapped in the project's `.env`.
- Do not treat manual SQL execution outside the repo as the primary migration path; prefer reproducible, versioned project scripts.
- Consider AWS deployment impact and functional certification before marking backend work as complete.

## Strict ambiguity gate

Before coding, identify explicitly:
- exact destination path;
- whether the work belongs to Lambda, NestJS or deployment;
- mirror implementation to follow;
- HTTP methods affected;
- CORS/API Gateway/deployment/certification impact.

### Fast routing rule for endpoint errors

For requests like:
- `el servicio https://.../api/v1/sedes genera error 500`
- `corrige /api/v1/empresas`

apply this order:
1. extract the endpoint resource (`sedes`, `empresas`, `terceros`, etc.);
2. jump directly to the most likely Lambda under `lib/lambda/**`;
3. inspect `index.mjs` first, then the relevant handler, then shared utils;
4. only broaden search if the Lambda path or integration evidence points elsewhere.

Example:
- `/api/v1/sedes` → `lib/lambda/core/fnSede/`

If that is not clear, ask one concise clarification first instead of guessing.

## Transversal sequencing rule

If the requirement includes both backend and frontend impact, enforce this order:
1. BD/schema
2. Lambda or NestJS service
3. frontend form/component
4. functional certification

A request such as changing a field in `/items/new` plus `fnProducto` plus database must be treated as a strict transversal flow, not as an isolated UI fix.

## Mandatory certification

For backend or transversal changes, certification must always include:
- unit tests;
- backend endpoint/lambda consumption tests;
- frontend integration validation when the UI consumes the change;
- Playwright E2E for the end-to-end flow.

Without this full chain, the change is not considered certified.

## Response style

Be direct, brief and operational:
- exact path first;
- mirror pattern second;
- HTTP method and AWS impact third;
- ordered execution path fourth;
- required test chain fifth;
- no speculative backend architecture.
