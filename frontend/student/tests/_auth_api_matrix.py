#!/usr/bin/env python3
"""Auth E2E API matrix against local stack. Exit 0 always — prints JSON report."""

from __future__ import annotations

import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass

API = "http://localhost:8000/api/v1"
MAIL = "http://localhost:1080"


@dataclass
class Case:
    id: str
    area: str
    ok: bool
    expected: str
    actual: str
    notes: str = ""


def req(
    method: str,
    url: str,
    *,
    data: bytes | None = None,
    headers: dict[str, str] | None = None,
    form: dict[str, str] | None = None,
    json_body: dict | None = None,
) -> tuple[int, str, dict]:
    hdrs = dict(headers or {})
    body = data
    if form is not None:
        body = urllib.parse.urlencode(form).encode()
        hdrs.setdefault("Content-Type", "application/x-www-form-urlencoded")
    if json_body is not None:
        body = json.dumps(json_body).encode()
        hdrs.setdefault("Content-Type", "application/json")
    r = urllib.request.Request(url, data=body, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            raw = resp.read().decode()
            return resp.status, raw, dict(resp.headers)
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        return e.code, raw, dict(e.headers)


def detail(raw: str) -> str:
    try:
        d = json.loads(raw)
        det = d.get("detail", d)
        return json.dumps(det, ensure_ascii=False)[:300]
    except Exception:
        return raw[:300]


def main() -> int:
    cases: list[Case] = []
    stamp = int(time.time())
    email = f"e2e.auth.{stamp}@example.com"
    password = "Password1!"  # >= 8 for backend
    short_pw = "short1"  # 6 chars — UI allows, API should reject

    # --- LOGIN: superuser happy ---
    code, raw, _ = req(
        "POST",
        f"{API}/login/access-token",
        form={"username": "admin@example.com", "password": "changethis"},
    )
    token = None
    try:
        token = json.loads(raw).get("access_token")
    except Exception:
        pass
    cases.append(
        Case(
            "api-login-superuser-ok",
            "login",
            code == 200 and bool(token),
            "200 + access_token",
            f"{code} token={'yes' if token else 'no'}",
        )
    )

    # --- LOGIN: wrong password ---
    code, raw, _ = req(
        "POST",
        f"{API}/login/access-token",
        form={"username": "admin@example.com", "password": "wrong-password"},
    )
    cases.append(
        Case(
            "api-login-wrong-password",
            "login",
            code == 400 and "Incorrect" in detail(raw),
            "400 Incorrect email or password",
            f"{code} {detail(raw)}",
        )
    )

    # --- LOGIN: unknown user ---
    code, raw, _ = req(
        "POST",
        f"{API}/login/access-token",
        form={"username": "nobody@example.com", "password": "whatever12"},
    )
    cases.append(
        Case(
            "api-login-unknown-user",
            "login",
            code == 400,
            "400 (same message — no user enumeration)",
            f"{code} {detail(raw)}",
        )
    )

    # --- LOGIN: empty credentials ---
    code, raw, _ = req(
        "POST",
        f"{API}/login/access-token",
        form={"username": "", "password": ""},
    )
    cases.append(
        Case(
            "api-login-empty",
            "login",
            code in (400, 422),
            "400 or 422",
            f"{code} {detail(raw)}",
        )
    )

    # --- TEST TOKEN ---
    if token:
        code, raw, _ = req(
            "POST",
            f"{API}/login/test-token",
            headers={"Authorization": f"Bearer {token}"},
        )
        cases.append(
            Case(
                "api-test-token-ok",
                "login",
                code == 200 and "admin@example.com" in raw,
                "200 UserPublic",
                f"{code} {raw[:120]}",
            )
        )
        code, raw, _ = req(
            "GET",
            f"{API}/users/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        cases.append(
            Case(
                "api-users-me-ok",
                "login",
                code == 200 and "admin@example.com" in raw,
                "200 /users/me",
                f"{code}",
            )
        )

    code, raw, _ = req(
        "POST",
        f"{API}/login/test-token",
        headers={"Authorization": "Bearer invalid.token.here"},
    )
    cases.append(
        Case(
            "api-test-token-invalid",
            "login",
            code in (401, 403),
            "401/403",
            f"{code} {detail(raw)}",
        )
    )

    code, raw, _ = req("GET", f"{API}/users/me")
    cases.append(
        Case(
            "api-users-me-no-auth",
            "login",
            code in (401, 403),
            "401/403 without token",
            f"{code} {detail(raw)}",
        )
    )

    # --- SIGNUP happy ---
    code, raw, _ = req(
        "POST",
        f"{API}/users/signup",
        json_body={
            "email": email,
            "password": password,
            "first_name": "أحمد",
            "father_name": "محمد",
            "family_name": "العصيمي",
            "is_male": True,
        },
    )
    cases.append(
        Case(
            "api-signup-ok",
            "signup",
            code == 200 and email in raw,
            "200 UserPublic",
            f"{code} {detail(raw) if code != 200 else 'ok'}",
        )
    )

    # --- SIGNUP duplicate ---
    code, raw, _ = req(
        "POST",
        f"{API}/users/signup",
        json_body={
            "email": email,
            "password": password,
            "first_name": "أحمد",
            "father_name": "محمد",
            "family_name": "العصيمي",
            "is_male": True,
        },
    )
    cases.append(
        Case(
            "api-signup-duplicate-email",
            "signup",
            code == 400 and "already exists" in detail(raw).lower(),
            "400 already exists",
            f"{code} {detail(raw)}",
        )
    )

    # --- SIGNUP password too short for backend (6 chars — UI allows) ---
    code, raw, _ = req(
        "POST",
        f"{API}/users/signup",
        json_body={
            "email": f"shortpw.{stamp}@example.com",
            "password": short_pw,
            "first_name": "أحمد",
            "father_name": "محمد",
            "family_name": "العصيمي",
            "is_male": True,
        },
    )
    cases.append(
        Case(
            "api-signup-password-6-chars",
            "signup",
            code == 422,
            "422 (backend min=8) — UI currently allows 6",
            f"{code} {detail(raw)}",
            notes="UI/backend mismatch if UI accepts 6-char password",
        )
    )

    # --- SIGNUP invalid email ---
    code, raw, _ = req(
        "POST",
        f"{API}/users/signup",
        json_body={
            "email": "not-an-email",
            "password": password,
            "first_name": "أحمد",
            "father_name": "محمد",
            "family_name": "العصيمي",
            "is_male": True,
        },
    )
    cases.append(
        Case(
            "api-signup-invalid-email",
            "signup",
            code == 422,
            "422",
            f"{code} {detail(raw)}",
        )
    )

    # --- SIGNUP missing fields ---
    code, raw, _ = req(
        "POST",
        f"{API}/users/signup",
        json_body={"email": f"missing.{stamp}@example.com", "password": password},
    )
    cases.append(
        Case(
            "api-signup-missing-names",
            "signup",
            code == 422,
            "422",
            f"{code} {detail(raw)}",
        )
    )

    # --- LOGIN newly registered ---
    code, raw, _ = req(
        "POST",
        f"{API}/login/access-token",
        form={"username": email, "password": password},
    )
    user_token = None
    try:
        user_token = json.loads(raw).get("access_token")
    except Exception:
        pass
    cases.append(
        Case(
            "api-login-after-signup",
            "signup",
            code == 200 and bool(user_token),
            "200 token for new user",
            f"{code} token={'yes' if user_token else 'no'}",
        )
    )

    # --- RECOVERY: unknown email (anti-enumeration) ---
    code, raw, _ = req("POST", f"{API}/password-recovery/unknown-{stamp}@example.com")
    cases.append(
        Case(
            "api-recover-unknown-email",
            "recover",
            code == 200 and "If a user" in raw,
            "200 generic message",
            f"{code} {raw[:160]}",
        )
    )

    # --- RECOVERY: known email ---
    before = len(json.loads(urllib.request.urlopen(f"{MAIL}/messages").read()))
    code, raw, _ = req("POST", f"{API}/password-recovery/{urllib.parse.quote(email)}")
    time.sleep(1.5)
    messages = json.loads(urllib.request.urlopen(f"{MAIL}/messages").read())
    after = len(messages)
    mail_found = None
    reset_link = None
    for m in reversed(messages):
        recipients = " ".join(m.get("recipients") or [])
        if email in recipients:
            mail_found = m
            mid = m["id"]
            html = urllib.request.urlopen(f"{MAIL}/messages/{mid}.html").read().decode(
                errors="replace"
            )
            links = re.findall(r'href="([^"]*reset-password[^"]*)"', html)
            if links:
                reset_link = links[0]
            break
    cases.append(
        Case(
            "api-recover-known-email",
            "recover",
            code == 200,
            "200",
            f"{code} mail_delta={after - before}",
        )
    )
    cases.append(
        Case(
            "api-recover-email-delivered",
            "recover",
            mail_found is not None,
            "MailCatcher message to user",
            f"found={mail_found is not None} id={mail_found and mail_found.get('id')}",
        )
    )
    cases.append(
        Case(
            "api-recover-email-has-link",
            "recover",
            bool(reset_link),
            "reset-password?token=… link in HTML",
            f"link={reset_link}",
        )
    )
    if reset_link:
        uses_admin = "5173" in reset_link or "dashboard" in reset_link
        uses_student = "5174" in reset_link or "/student" in reset_link
        cases.append(
            Case(
                "api-recover-link-targets-student",
                "recover",
                uses_student and not uses_admin,
                "Link should point at student FRONTEND_STUDENT_HOST (:5174)",
                f"admin={uses_admin} student={uses_student} link={reset_link}",
                notes="generate_reset_password_email uses FRONTEND_ADMIN_HOST",
            )
        )

    # --- RESET: invalid token ---
    code, raw, _ = req(
        "POST",
        f"{API}/reset-password/",
        json_body={"token": "not-a-real-token", "new_password": "NewPassword1!"},
    )
    cases.append(
        Case(
            "api-reset-invalid-token",
            "reset",
            code == 400 and "Invalid" in detail(raw),
            "400 Invalid token",
            f"{code} {detail(raw)}",
        )
    )

    # --- RESET: short password ---
    token_q = None
    if reset_link:
        parsed = urllib.parse.urlparse(reset_link)
        token_q = urllib.parse.parse_qs(parsed.query).get("token", [None])[0]
    if token_q:
        code, raw, _ = req(
            "POST",
            f"{API}/reset-password/",
            json_body={"token": token_q, "new_password": "short"},
        )
        cases.append(
            Case(
                "api-reset-password-too-short",
                "reset",
                code == 422,
                "422 min length 8",
                f"{code} {detail(raw)}",
            )
        )

        new_password = "NewPassword2!"
        code, raw, _ = req(
            "POST",
            f"{API}/reset-password/",
            json_body={"token": token_q, "new_password": new_password},
        )
        cases.append(
            Case(
                "api-reset-ok",
                "reset",
                code == 200 and "updated" in raw.lower(),
                "200 Password updated",
                f"{code} {raw[:120]}",
            )
        )

        # old password fails
        code, raw, _ = req(
            "POST",
            f"{API}/login/access-token",
            form={"username": email, "password": password},
        )
        cases.append(
            Case(
                "api-login-old-password-after-reset",
                "reset",
                code == 400,
                "400 old password rejected",
                f"{code} {detail(raw)}",
            )
        )

        # new password works
        code, raw, _ = req(
            "POST",
            f"{API}/login/access-token",
            form={"username": email, "password": new_password},
        )
        cases.append(
            Case(
                "api-login-new-password-after-reset",
                "reset",
                code == 200,
                "200 with new password",
                f"{code}",
            )
        )

        # reuse token
        code, raw, _ = req(
            "POST",
            f"{API}/reset-password/",
            json_body={"token": token_q, "new_password": "AnotherPass3!"},
        )
        cases.append(
            Case(
                "api-reset-token-reuse",
                "reset",
                code in (200, 400),  # JWT may still be valid until expiry
                "Document behavior: JWT reset tokens are reusable until expiry",
                f"{code} {detail(raw)}",
                notes="Reset tokens are JWTs — typically reusable until EMAIL_RESET_TOKEN_EXPIRE_HOURS",
            )
        )

    # --- CHANGE PASSWORD while logged in (users/me/password) ---
    if user_token:
        # re-login after reset may have invalidated — get fresh if needed
        pass

    # fresh login as admin for change-password path on a new user
    email2 = f"e2e.pwd.{stamp}@example.com"
    req(
        "POST",
        f"{API}/users/signup",
        json_body={
            "email": email2,
            "password": "Password1!",
            "first_name": "سارة",
            "father_name": "علي",
            "family_name": "نجدي",
            "is_male": False,
        },
    )
    code, raw, _ = req(
        "POST",
        f"{API}/login/access-token",
        form={"username": email2, "password": "Password1!"},
    )
    t2 = json.loads(raw).get("access_token") if code == 200 else None
    if t2:
        code, raw, _ = req(
            "PATCH",
            f"{API}/users/me/password",
            headers={"Authorization": f"Bearer {t2}"},
            json_body={
                "current_password": "Password1!",
                "new_password": "Password2!",
            },
        )
        cases.append(
            Case(
                "api-change-password-ok",
                "password",
                code == 200,
                "200",
                f"{code} {raw[:100]}",
            )
        )
        code, raw, _ = req(
            "PATCH",
            f"{API}/users/me/password",
            headers={"Authorization": f"Bearer {t2}"},
            json_body={
                "current_password": "wrong-current",
                "new_password": "Password3!",
            },
        )
        cases.append(
            Case(
                "api-change-password-wrong-current",
                "password",
                code in (400, 401, 403),
                "4xx wrong current",
                f"{code} {detail(raw)}",
            )
        )

    report = {
        "email_under_test": email,
        "summary": {
            "total": len(cases),
            "passed": sum(1 for c in cases if c.ok),
            "failed": sum(1 for c in cases if not c.ok),
        },
        "cases": [asdict(c) for c in cases],
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["summary"]["failed"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
