"""CLI flags for the development seed."""

from __future__ import annotations

import argparse
from dataclasses import dataclass


@dataclass(frozen=True)
class SeedConfig:
    clean: bool
    users_only: bool
    content_only: bool
    verbose: bool


def parse_seed_config(argv: list[str] | None = None) -> SeedConfig:
    parser = argparse.ArgumentParser(
        prog="python -m app.seed",
        description=(
            "Idempotent local development seed. "
            "Refuses non-local ENVIRONMENT / database hosts. "
            "Never run in staging or production."
        ),
    )
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Delete seed-owned rows (demo emails + seed program/books) then reseed.",
    )
    parser.add_argument(
        "--users-only",
        action="store_true",
        help="Seed demo users only (no program graph).",
    )
    parser.add_argument(
        "--content-only",
        action="store_true",
        help="Seed program graph only (requires demo users to already exist).",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Log skip/create decisions.",
    )
    args = parser.parse_args(argv)

    if args.users_only and args.content_only:
        parser.error("Use only one of --users-only or --content-only.")

    return SeedConfig(
        clean=args.clean,
        users_only=args.users_only,
        content_only=args.content_only,
        verbose=args.verbose,
    )
