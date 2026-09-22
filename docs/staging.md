# Staging

Staging is the one deployed environment. **Nothing in this repository deploys it.**
It is provisioned and configured from a separate, private infrastructure repository
(Ansible). This page describes what that environment is, so you can work against it —
not how to build it.

If you need to change the server, the proxy, the secrets or the deploy flow, that work
happens in the infrastructure repository, not here.

---

## What is deployed

A single virtual machine runs the whole stack with Docker Compose, behind
[Traefik](https://traefik.io), which terminates TLS and routes each service to its own
subdomain.

Deploys are automatic: **every push to `main`** triggers a webhook on the server, which
verifies the request, pulls the new commit, rebuilds the images and restarts the stack.
There is no GitHub Actions deployment job — CI in this repository only tests and lints.

---

## URLs

The concrete domain is not published here. Ask a maintainer, or read the inventory in
the infrastructure repository. The subdomain pattern is:

| Service | URL |
| --- | --- |
| Backend API | `https://api.staging.<domain>` — `/docs` for Swagger |
| Admin app | `https://dashboard.staging.<domain>` |
| Student app | `https://student.staging.<domain>` |
| Proxy dashboard | `https://traefik.staging.<domain>` — restricted |

> **Why the placeholder.** This repository is public. The hostnames are a map of what
> is exposed, so they stay in the private repository that already holds the domain.
> This is a habit, not a security control — do not treat an unpublished hostname as
> protection for anything behind it.

---

## Availability

Staging is expected to be **available continuously**. It is the shared integration
environment, so treat it as always-on.

If it does not answer, that is a fault rather than something to work around — raise it
with whoever maintains the infrastructure repository. Do not assume it is down on
purpose.

---

## Pointing a local frontend at staging

Both frontends read the API base URL from `VITE_API_URL`. It is **not** set to staging by
default — you opt in, per app, in that app's local `.env`:

```dotenv
# frontend/student/.env
VITE_API_URL=https://api.staging.<domain>
```

Restart the dev server afterwards; Vite reads it at build time, not per request.

Keep in mind that staging holds real, shared data that other people rely on. For everyday
work, run the backend locally instead — see [development.md](../development.md).

---

## Production

There is no production environment yet.
