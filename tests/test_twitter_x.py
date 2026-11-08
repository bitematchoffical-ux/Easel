"""推特 X / 掘金平台接入的契约测试。

覆盖三层接线：
1. web_publisher.PLATFORMS 配置完整（窗口登录、代理、媒体规则、关键步骤）；
2. web.app LOGIN_RUNNERS 注册 + 登录命令带 --headed（窗口模式）+ 发布走通用 web 分支；
3. 媒体要求集合：YouTube 必须有视频，X 媒体可选。
"""
import asyncio
import sys
import threading
from pathlib import Path
from types import SimpleNamespace

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "skills" / "shared" / "scripts"))
import web_publisher  # noqa: E402

import web.app as web  # noqa: E402


# ---------- 1. web_publisher 平台配置 ----------

def test_platforms_registered():
    assert "twitter-x" in web_publisher.PLATFORMS
    assert "youtube" not in web_publisher.PLATFORMS, "YouTube 平台已移除"


def test_x_window_login_and_proxy_and_optional_media():
    cfg = web_publisher.PLATFORMS["twitter-x"]
    # 无扫码 → 窗口登录；国际站 → needs_proxy；纯文字推文合法 → media_optional
    assert cfg["login_mode"] == "window"
    assert cfg["needs_proxy"] is True
    assert cfg["media_optional"] is True
    assert cfg["login_check"] and cfg["login_strict"] is True
    # 关键步骤：编辑器 type + 发布钮 click(commit)；附件等待步标 needs_media（无媒体可跳）
    actions = [s["action"] for s in cfg["steps"]]
    assert "type" in actions and "click" in actions
    assert any(s.get("commit") for s in cfg["steps"])
    assert any(s.get("needs_media") for s in cfg["steps"])
    assert "compose" in cfg["publish_url"]



def test_new_platforms_steps_actions_legal():
    for key in ("twitter-x",):
        cfg = web_publisher.PLATFORMS[key]
        for field in ("name", "login_url", "publish_url", "profile", "steps", "selector_caveat"):
            assert cfg.get(field), f"{key} 缺 {field}"
        for st in cfg["steps"]:
            assert st["action"] in web_publisher._ACTIONS, f"{key} 非法 action {st['action']}"


def test_launch_kwargs_proxy_routing(monkeypatch):
    for var in ("EASEL_PROXY", "TWITTER_X_PROXY", "https_proxy", "HTTPS_PROXY",
                "all_proxy", "ALL_PROXY"):
        monkeypatch.delenv(var, raising=False)
    # 与项目 .env 隔离：真 .env 里持久化过代理时「未配代理」分支断言会失真
    monkeypatch.setattr(web_publisher, "_env_file_value", lambda *a, **k: "")
    kw = web_publisher._launch_kwargs(web_publisher.PLATFORMS["twitter-x"], "twitter-x")
    assert "--no-proxy-server" not in kw["args"] and "proxy" not in kw, \
        "国际站未配代理时应回退系统代理（不加 --no-proxy-server）"

    # 平台专属变量（TWITTER_X_PROXY）在通用 https_proxy 之前生效
    monkeypatch.setenv("https_proxy", "http://127.0.0.1:9000")
    monkeypatch.setenv("TWITTER_X_PROXY", "http://127.0.0.1:7891")
    kw = web_publisher._launch_kwargs(web_publisher.PLATFORMS["twitter-x"], "twitter-x")
    assert kw["proxy"]["server"] == "http://127.0.0.1:7891", "平台专属代理应优先于通用代理"

    monkeypatch.setenv("EASEL_PROXY", "http://127.0.0.1:7890")
    kw = web_publisher._launch_kwargs(web_publisher.PLATFORMS["twitter-x"], "twitter-x")
    assert kw["proxy"]["server"] == "http://127.0.0.1:7890", "EASEL_PROXY 应最优先"
    assert "--no-proxy-server" not in kw["args"]


def test_x_steps_resolve_without_media():
    steps = web_publisher._resolve_steps(
        "twitter-x", {"media": "", "title": "T", "desc": "D", "tags": "", "cover": ""})
    upload = [s for s in steps if s["action"] == "upload"][0]
    assert upload["value"] == "", "无媒体时 upload 占位符应解析为空串（运行层据此跳过）"
    type_step = [s for s in steps if s["action"] == "type"][0]
    assert "T" in type_step["value"] and "D" in type_step["value"]


# ---------- 2. app.py 注册与登录命令 ----------

@pytest.fixture
def login_state_tmp(tmp_path, monkeypatch):
    monkeypatch.setattr(web, "LOGIN_DIR", tmp_path)
    monkeypatch.setattr(web, "LOGIN_PROCESSES", {})
    monkeypatch.setattr(web, "_WHOAMI_CACHE", {})
    monkeypatch.setattr(web, "_WHOAMI_LOCK", threading.Lock())
    return tmp_path



def test_start_login_appends_headed_for_window_platforms(login_state_tmp, monkeypatch):
    captured = {}

    class _FakeProc:
        def poll(self):
            return None

    def _fake_popen(cmd, **kwargs):
        captured["cmd"] = cmd
        return _FakeProc()

    monkeypatch.setattr(web.subprocess, "Popen", _fake_popen)
    result = asyncio.run(web._start_login("twitter-x"))
    assert result["mode"] == "qr"  # 前端统一走 qr 模式入口，状态值会是 window_login
    cmd = captured["cmd"]
    assert "login-qr" in cmd and "--headed" in cmd, "窗口登录平台必须带 --headed"
    assert cmd[cmd.index("--platform") + 1] == "twitter-x"


# ---------- 3. 媒体要求集合 ----------

def test_media_requirement_sets():
    assert "twitter-x" not in web.MEDIA_REQUIRED, "X 纯文字推文合法"
    assert "twitter-x" not in web.VIDEO_ONLY_PUBLISH, "X 允许发图片"


def test_accounts_endpoint_lists_new_platforms():
    from fastapi.testclient import TestClient
    client = TestClient(web.app, base_url="http://127.0.0.1:7860")
    platforms = {a["platform"]: a for a in client.get("/api/accounts").json()}
    assert "twitter-x" in platforms
    assert platforms["twitter-x"]["supported"]


def test_launch_kwargs_headless_ua_stealth(monkeypatch):
    """headless 校验国际站必须伪装 UA：HeadlessChrome UA 会被 Google/X 风控踢会话
    （实测：YouTube 窗口登录成功后，headless whoami 跑一次会话即被作废）。"""
    monkeypatch.setenv("EASEL_PROXY", "http://127.0.0.1:7890")
    tx = web_publisher.PLATFORMS["twitter-x"]
    headless_kw = web_publisher._launch_kwargs(tx, "twitter-x", headless=True)
    ua = headless_kw.get("user_agent", "")
    assert ua and "Headless" not in ua and "Chrome/" in ua, "headless 国际站必须伪装成正常 Chrome UA"
    # 窗口登录（headed）不伪装——用户手动登录要走真实 UA
    headed_kw = web_publisher._launch_kwargs(tx, "twitter-x", headless=False)
    assert "user_agent" not in headed_kw



# ---------- Auswertung ----------

# ---------- 创作数据采集（analytics）----------

def test_x_in_analytics_platforms():
    assert "twitter-x" in web.ANALYTICS_PLATFORMS


def test_analytics_platforms_endpoint_lists_new_platforms():
    from fastapi.testclient import TestClient
    client = TestClient(web.app, base_url="http://127.0.0.1:7860",
                        headers={"Origin": "http://127.0.0.1:7860"})
    platforms = {p["platform"] for p in client.get("/api/analytics/platforms").json()}
    assert "twitter-x" in platforms


def test_analytics_dispatch_uses_dedicated_scripts():
    """掘金/ X 走各自脚本（API / DOM），不落到 account_stats 的 Playwright 通用路径。"""
    import inspect
    src = inspect.getsource(web._fetch_analytics)
    assert "x_stats.py" in src


def test_x_stats_parse_count():
    import importlib.util
    from pathlib import Path as _P
    spec = importlib.util.spec_from_file_location(
        "x_stats", _P("skills/shared/scripts/x_stats.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    assert mod._parse_count("11 关注者") == 11
    assert mod._parse_count("1,234 正在关注") == 1234
    assert mod._parse_count("1.2万") == 12000
    assert mod._parse_count("") is None


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-v"]))
