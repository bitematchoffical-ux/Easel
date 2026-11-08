from __future__ import annotations

import json
import zipfile
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from easel.manual_publish import build_package, publishing_mode
from web import app as web


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(web, "OUTPUTS_DIR", tmp_path)
    env_file = tmp_path / ".env"
    env_file.write_text("", encoding="utf-8")
    monkeypatch.setattr(web, "ENV_FILE", env_file)
    monkeypatch.delenv("EASEL_PUBLISH_MODE", raising=False)
    def unexpected_publish(*args, **kwargs):
        pytest.fail("Manual publishing must never run a platform subprocess")
    monkeypatch.setattr(web.subprocess, "run", unexpected_publish)
    return TestClient(web.app, base_url="http://localhost:7860", headers={"Origin": "http://localhost:7860"})


@pytest.mark.parametrize("endpoint,payload", [
    ("/api/publish/twitter-x", {"title": "Test", "body": "Draft"}),
    ("/api/publish/twitter-x/sms", {"code": "123456"}),
])
def test_legacy_submission_is_blocked_before_any_platform_call(client, endpoint, payload):
    web.ENV_FILE.write_text("EASEL_PUBLISH_MODE=manual\n", encoding="utf-8")
    response = client.post(endpoint, json=payload)
    assert response.status_code == 403


def test_export_requires_explicit_review(client):
    response = client.post("/api/manual-publish/instagram/export", json={"title": "Draft"})
    assert response.status_code == 400


def test_export_does_not_mark_content_as_published(client, tmp_path):
    media = tmp_path / "my-project" / "cover.png"
    media.parent.mkdir()
    media.write_bytes(b"example-image")
    response = client.post("/api/manual-publish/instagram/export", json={
        "title": "人工审核稿", "body": "第一段\n\n第二段", "tags": "工具,日常",
        "media": ["my-project/cover.png"], "reviewed": True, "aiGenerated": False,
    })
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["published"] is False
    with zipfile.ZipFile(tmp_path / payload["path"]) as archive:
        assert archive.read("title.txt").decode() == "人工审核稿"
        assert archive.read("media/01_cover.png") == b"example-image"
        manifest = json.loads(archive.read("manifest.json"))
        assert manifest["status"] == "ready_for_manual_submission"
        assert "cookie" not in " ".join(archive.namelist()).lower()
    assert not (tmp_path / "_schedule.json").exists()


@pytest.mark.parametrize('platform',['instagram','tiktok','twitter-x'])
def test_new_channels_support_manual_export_without_platform_calls(client,tmp_path,platform):
    web.ENV_FILE.write_text('EASEL_PUBLISH_MODE=manual\n',encoding='utf-8')
    assert client.post(f'/api/publish/{platform}',json={'title':'test','body':'draft'}).status_code==403
    response=client.post(f'/api/manual-publish/{platform}/export',json={'title':'test','body':'draft','reviewed':True,'aiGenerated':False})
    assert response.status_code==200,response.text
    assert response.json()['published'] is False
    with zipfile.ZipFile(tmp_path/response.json()['path']) as archive:
        meta=json.loads(archive.read('manifest.json'))
        assert meta['platform']==platform and meta['status']=='ready_for_manual_submission'
    assert not (tmp_path/'_schedule.json').exists()


@pytest.mark.parametrize("relative", ["../outside.png", "_login/qr.png", "project/secret.json", "project/.hidden.png"])
def test_export_rejects_system_files_and_path_escape(tmp_path, relative):
    outputs = tmp_path / "outputs"
    outputs.mkdir()
    path = (outputs / relative).resolve()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b"private-data")
    with pytest.raises(ValueError):
        build_package(outputs, "instagram", "Title", "Body", "", [relative], True, False)
    assert not (outputs / "_publish").exists()


def test_policy_reports_manual_mode(client):
    web.ENV_FILE.write_text("EASEL_PUBLISH_MODE=manual\n", encoding="utf-8")
    assert client.get("/api/publishing-policy").json() == {"mode": "manual", "automaticSubmission": False}


def test_policy_preserves_automatic_default(client):
    assert client.get("/api/publishing-policy").json() == {"mode": "automated", "automaticSubmission": True}
    assert web._publishing_message("draft") == "draft"


@pytest.mark.parametrize("value", ["manual", " MANUAL ", "invalid", "true"])
def test_manual_or_unknown_configuration_disables_automatic_submission(value):
    assert publishing_mode({"EASEL_PUBLISH_MODE": value}) == "manual"


@pytest.mark.parametrize("settings", [{}, {"EASEL_PUBLISH_MODE": ""}, {"EASEL_PUBLISH_MODE": " automated "}])
def test_missing_empty_or_automatic_configuration_preserves_existing_mode(settings):
    assert publishing_mode(settings) == "automated"


@pytest.mark.parametrize("configuration", ["", "EASEL_PUBLISH_MODE=automated\n"])
def test_default_and_configured_automatic_workflow_use_existing_publisher(client, monkeypatch, configuration):
    web.ENV_FILE.write_text(configuration, encoding="utf-8")
    calls = []
    def fake_publish(command, **kwargs):
        calls.append(command)
        return SimpleNamespace(returncode=1, stdout="", stderr="mocked platform failure")
    monkeypatch.setattr(web.subprocess, "run", fake_publish)
    assert client.get("/api/publishing-policy").json() == {"mode": "automated", "automaticSubmission": True}
    response = client.post("/api/publish/twitter-x", json={"title": "Test", "body": "Draft"})
    assert response.status_code == 200, response.text
    assert response.json()["ok"] is False
    assert len(calls) == 1 and "--exec" in calls[0]


def test_manual_policy_is_included_in_agent_messages(client):
    web.ENV_FILE.write_text("EASEL_PUBLISH_MODE=manual\n", encoding="utf-8")
    message = web._chat_message(web.ChatRequest(message="排版这个草稿"))
    assert "人工提交" in message and "不要调用发布脚本" in message
    assert "排版这个草稿" in message
    web.ENV_FILE.write_text("EASEL_PUBLISH_MODE=automated\n", encoding="utf-8")
    assert web._publishing_message("draft") == "draft"


def test_environment_can_override_mode_in_dotenv(client, monkeypatch):
    web.ENV_FILE.write_text("EASEL_PUBLISH_MODE=automated\n", encoding="utf-8")
    monkeypatch.setenv("EASEL_PUBLISH_MODE", "manual")
    assert client.post("/api/publish/twitter-x", json={"title": "Draft"}).status_code == 403


def test_backend_rechecks_policy_after_automatic_page_was_loaded(client):
    assert client.get("/api/publishing-policy").json()["automaticSubmission"] is True
    web.ENV_FILE.write_text("EASEL_PUBLISH_MODE=manual\n", encoding="utf-8")
    assert client.post("/api/publish/twitter-x", json={"title": "Draft"}).status_code == 403
    assert client.post("/api/publish/twitter-x/sms", json={"code": "123456"}).status_code == 403


def test_export_is_available_with_automatic_policy_without_changing_it(client):
    response = client.post("/api/manual-publish/instagram/export", json={
        "title": "人工审核稿", "reviewed": True, "aiGenerated": False,
    })
    assert response.status_code == 200
    assert response.json()["published"] is False
    assert client.get("/api/publishing-policy").json() == {"mode": "automated", "automaticSubmission": True}
    assert web.ENV_FILE.read_text(encoding="utf-8") == ""


def test_unknown_platform_is_rejected_without_creating_package(client, tmp_path):
    response = client.post("/api/manual-publish/unknown/export", json={"title": "Draft", "reviewed": True, "aiGenerated": False})
    assert response.status_code == 400
    assert not (tmp_path / "_publish").exists()


# ---- Postloop: KI-Kennzeichnung und EU-Plattformen ----

def test_export_requires_explicit_ai_answer(client):
    response = client.post("/api/manual-publish/instagram/export", json={"title": "Draft", "reviewed": True})
    assert response.status_code == 400
    assert "KI" in response.json()["detail"]


def test_ai_generated_export_contains_platform_label_steps(tmp_path):
    package = build_package(tmp_path, "tiktok", "Wo essen wir?", "Match2Eat entscheidet.", "food,app",
                            [], True, True)
    with zipfile.ZipFile(package) as archive:
        manifest = json.loads(archive.read("manifest.json"))
        guide = archive.read("ANLEITUNG.txt").decode()
        assert archive.read("ki-hinweis.txt").decode().strip() == "Mit KI erstellt"
        caption = archive.read("caption.txt").decode()
    assert manifest["aiGenerated"] is True
    assert "KI-generierte Inhalte" in manifest["aiDisclosure"]["platformSetting"]
    assert "KI-Kennzeichnung" in guide
    assert caption.startswith("Wo essen wir?") and "Match2Eat" in caption
    assert package.name.startswith("postloop-tiktok-")


def test_non_ai_export_has_no_label_file(tmp_path):
    package = build_package(tmp_path, "instagram", "", "Nur Text", "", [], True, False)
    with zipfile.ZipFile(package) as archive:
        assert "ki-hinweis.txt" not in archive.namelist()
        assert json.loads(archive.read("manifest.json"))["aiGenerated"] is False


def test_youtube_shorts_requires_video(tmp_path):
    image = tmp_path / "p" / "cover.png"
    image.parent.mkdir()
    image.write_bytes(b"img")
    with pytest.raises(ValueError, match="Video"):
        build_package(tmp_path, "youtube-shorts", "Titel", "Text", "", ["p/cover.png"], True, False)
    video = tmp_path / "p" / "clip.mp4"
    video.write_bytes(b"vid")
    package = build_package(tmp_path, "youtube-shorts", "Titel", "Text", "", ["p/clip.mp4"], True, False)
    with zipfile.ZipFile(package) as archive:
        assert archive.read("caption.txt").decode() == "Text"
        assert archive.read("media/01_clip.mp4") == b"vid"


def test_limit_warnings_are_reported_not_silently_cut(tmp_path):
    package = build_package(tmp_path, "twitter-x", "", "x" * 300, "", [], True, False)
    with zipfile.ZipFile(package) as archive:
        manifest = json.loads(archive.read("manifest.json"))
        guide = archive.read("ANLEITUNG.txt").decode()
        assert len(archive.read("caption.txt").decode()) == 300
    assert manifest["warnings"] and "280" in manifest["warnings"][0]
    assert "Achtung" in guide


def test_frontend_and_backend_limits_match():
    from pathlib import Path
    from easel.manual_publish import PLATFORMS
    page = (Path(__file__).resolve().parents[1] / "web/frontend/src/components/ManualPublishPage.tsx").read_text(encoding="utf-8")
    for key, target in PLATFORMS.items():
        assert f"key: '{key}'" in page, key
        assert f"bodyLimit: {target.body_limit}," in page
        assert target.url in page
