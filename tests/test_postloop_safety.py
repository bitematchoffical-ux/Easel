"""Postloop (Paket C): Netzwerk-Erreichbarkeit, Kostenschutz und KI-Kennzeichnung."""
from __future__ import annotations

import inspect
from pathlib import Path

import pytest

import web.app as web
from easel import persona

ROOT = Path(__file__).resolve().parents[1]


# ---- Weboberfläche nur lokal ----

def test_web_listens_only_on_this_machine_by_default():
    assert web.listen_host({}) == "127.0.0.1"
    assert web.listen_host({"EASEL_HOST": "  "}) == "127.0.0.1"


@pytest.mark.parametrize("value", ["0.0.0.0", "127.0.0.1", "::1", "192.168.1.20"])
def test_explicit_host_override_is_respected(value):
    assert web.listen_host({"EASEL_HOST": value}) == value


@pytest.mark.parametrize("value", ["everyone", "0.0.0.0; rm -rf /", "http://0.0.0.0"])
def test_invalid_host_falls_back_to_local_instead_of_network(value):
    assert web.listen_host({"EASEL_HOST": value}) == "127.0.0.1"


def test_server_start_uses_listen_host_not_hardcoded_wildcard():
    source = (ROOT / "web" / "app.py").read_text(encoding="utf-8")
    assert 'host="0.0.0.0"' not in source
    assert "uvicorn.run(app, host=listen_host()" in source


# ---- Kostenschutz ----

def test_turn_reminder_allows_answering_without_tools():
    reminder = persona.turn_reminder()
    assert "ohne Tools" in reminder
    assert "anhalten" in reminder
    # alte Pflicht „vor jedem Schritt erst die Skill-Bibliothek durchsuchen“ ist weg
    assert "本轮动手前先查技能库" not in reminder


def test_turn_reminder_requires_ai_labelling_instead_of_hiding_it():
    reminder = persona.turn_reminder()
    assert "nie verschleiern" in reminder
    assert "自曝" not in reminder


def test_agent_rules_put_cost_protection_first():
    agents = (ROOT / "agents" / "workspace" / "AGENTS.md").read_text(encoding="utf-8")
    assert agents.index("## Kostenschutz") < agents.index("## 核心执行规则")
    assert "Exec completed" in agents


@pytest.mark.parametrize("installer", ["setup.sh", "setup.ps1"])
def test_installers_enable_openclaw_loop_protection(installer):
    text = (ROOT / installer).read_text(encoding="utf-8")
    assert "tools.loopDetection.enabled" in text
    assert "tools.exec.notifyOnExit" in text


def test_chat_message_carries_new_reminder():
    message = persona.chat_turn_message("Hallo", None)
    assert message.startswith("Hallo")
    assert message.endswith(persona.turn_reminder())
    assert "local_write_guard" in inspect.getsource(web)
