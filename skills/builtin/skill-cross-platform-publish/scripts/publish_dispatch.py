#!/usr/bin/env python3
"""publish_dispatch.py — 跨平台一键发布的派发规划（平台约束注册表 + 派发计划）。

一份内容 → 多平台发布。本脚本提供：各平台的格式约束（字数/比例/标签上限/内容类型）、
平台→发布 SKILL 的路由、以及"派发计划"生成（校验内容是否越限、给出每个平台该调哪个 publisher）。

实际的按平台改写（标题/正文/标签本地化）由 LLM 完成；实际发布由各平台 publisher SKILL 执行。
本脚本是确定性的"约束检查 + 路由 + 计划"，可离线测试。

子命令：
    platforms  列出支持的平台及约束
    plan       读内容清单 → 输出每平台派发计划（校验越限 + 路由到 publisher）
    selftest   自检

用法举例：
    publish_dispatch.py platforms
    publish_dispatch.py plan --manifest content.json
    echo '{...}' | publish_dispatch.py plan --manifest -
"""
from __future__ import annotations

import argparse
import json
import sys

# 平台注册表：约束 + 对应发布 SKILL
# title/body 上限为字符数；0 表示无硬限或不适用。aspect 为推荐视频比例。
PLATFORMS: dict[str, dict] = {
    # Postloop: Instagram/TikTok/YouTube laufen über das Export-Paket (Web: Veröffentlichen →
    # Export-Tab, Backend easel/manual_publish.py). Limits müssen dort identisch sein.
    "instagram": {"publisher": "manual-export", "types": ["image", "video"],
                  "title": 0, "body": 2200, "tags": 5, "aspect": "4:5/9:16",
                  "note": "Kein Titelfeld; Karussell 4:5, Reel 9:16; wenige gezielte Hashtags; KI-Label setzen"},
    "tiktok": {"publisher": "manual-export", "types": ["video", "image"],
               "title": 0, "body": 4000, "tags": 5, "aspect": "9:16",
               "note": "Hochformat 9:16; erste Sekunde = Hook; Schalter „KI-generierte Inhalte“ setzen"},
    "youtube-shorts": {"publisher": "manual-export", "types": ["video"],
                       "title": 100, "body": 5000, "tags": 5, "aspect": "9:16",
                       "note": "Nur Video, vertikal; Titel ≤100; synthetische Inhalte im Upload angeben"},
    "twitter-x": {"publisher": "web_publisher", "types": ["image", "video"],
                  "title": 0, "body": 280, "tags": 3, "aspect": "16:9/1:1",
                  "note": "Post = Titel + Text, max. 280 Zeichen"},
}


def _die(msg: str, code: int = 1) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(code)


def cmd_platforms(_a) -> int:
    print(f"支持 {len(PLATFORMS)} 个平台：\n")
    for name, c in PLATFORMS.items():
        tl = f"标题≤{c['title']}" if c["title"] else "标题无限"
        print(f"  {name:16s} → {c['publisher']}")
        print(f"    类型 {'/'.join(c['types'])} · {tl} · 标签≤{c['tags']} · 比例 {c['aspect']}")
        print(f"    {c['note']}")
    return 0


def _check_platform(name: str, content: dict) -> dict:
    """对单平台做约束检查，返回派发条目（含 warnings）。"""
    if name not in PLATFORMS:
        return {"platform": name, "ok": False,
                "error": f"未知平台（支持：{', '.join(PLATFORMS)}）"}
    c = PLATFORMS[name]
    warns: list[str] = []
    title = content.get("title", "") or ""
    body = content.get("body", "") or ""
    tags = content.get("tags", []) or []
    mtype = content.get("media_type", "")

    if c["title"] and len(title) > c["title"]:
        warns.append(f"标题 {len(title)}>{c['title']} 字，需精简/截断")
    if c["body"] and len(body) > c["body"]:
        warns.append(f"正文 {len(body)}>{c['body']} 字，需精简")
    if c["tags"] and len(tags) > c["tags"]:
        warns.append(f"标签 {len(tags)}>{c['tags']} 个，需删减")
    if mtype and mtype not in c["types"]:
        warns.append(f"内容类型 {mtype} 与该平台支持 {c['types']} 不符（需换形式或转制）")

    return {"platform": name, "ok": True, "publisher": c["publisher"],
            "recommend_aspect": c["aspect"], "constraints_note": c["note"],
            "warnings": warns,
            "action": f"按约束适配后调用 {c['publisher']} 发布"}


def cmd_plan(a) -> int:
    raw = sys.stdin.read() if a.manifest == "-" else _read(a.manifest)
    try:
        m = json.loads(raw)
    except json.JSONDecodeError as e:
        _die(f"manifest 不是有效 JSON：{e}")
    content = m.get("content", {})
    platforms = m.get("platforms", [])
    if not platforms:
        _die("manifest.platforms 为空（需目标平台列表）")
    plan = [_check_platform(p, content) for p in platforms]
    out = {"content_title": content.get("title", ""),
           "target_count": len(platforms),
           "dispatch": plan,
           "hint": "对每个平台：按 constraints_note 用 LLM 适配标题/正文/标签/比例，"
                   "再调用 publisher 发布；发布后可接 skill-publish-notify / skill-publish-log。"}
    print(json.dumps(out, ensure_ascii=False, indent=2))
    return 0


def _read(path: str) -> str:
    from pathlib import Path
    p = Path(path).expanduser()
    if not p.is_file():
        _die(f"manifest 不存在：{p}")
    return p.read_text(encoding="utf-8")


def cmd_selftest(_a) -> int:
    print("publish_dispatch 自检 ...", file=sys.stderr)
    assert PLATFORMS["twitter-x"]["publisher"] == "web_publisher"
    assert PLATFORMS["instagram"]["publisher"] == "manual-export"
    yt = _check_platform("youtube-shorts", {"title": "T" * 101, "media_type": "image"})
    assert any("标题" in w for w in yt["warnings"]) and any("类型" in w for w in yt["warnings"])
    ok = _check_platform("twitter-x", {"title": "", "body": "kurz", "tags": ["a"],
                                       "media_type": "image"})
    assert ok["ok"] and not ok["warnings"], f"合规内容不应告警：{ok}"
    bad = _check_platform("nope", {})
    assert not bad["ok"], "未知平台应 ok=False"
    print("✅ selftest 通过（约束检查/路由）")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description="跨平台一键发布派发规划（平台约束注册表 + 路由 + 计划）",
        formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd")

    sub.add_parser("platforms", help="列出支持平台及约束").set_defaults(func=cmd_platforms)

    p = sub.add_parser("plan", help="内容清单 → 派发计划")
    p.add_argument("--manifest", required=True, help="内容清单 JSON 路径（- 为 stdin）")
    p.set_defaults(func=cmd_plan)

    sub.add_parser("selftest", help="自检").set_defaults(func=cmd_selftest)

    a = ap.parse_args()
    if not getattr(a, "func", None):
        ap.print_help()
        return 1
    return a.func(a)


if __name__ == "__main__":
    sys.exit(main())
