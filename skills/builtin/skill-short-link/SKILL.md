---
name: skill-short-link
description: "Kurzlinks mit UTM-Parametern: hängt Quelle, Medium und Kampagne an Links an und kürzt sie, um Herkunft und Kampagnenerfolg auf Instagram, TikTok und Co. zu messen. Verwenden bei: Kurzlink, UTM, Tracking-Link, Link mit Parametern. Nutzt einen öffentlichen Kurzlinkdienst ohne Schlüssel."
layer: publish
---

# 短链 + UTM 追踪

> 给链接拼 UTM 追踪参数并缩短，追踪各平台引流效果。走 `scripts/shortlink.py`（纯标准库无依赖，
> 短链用免 key 公共服务 TinyURL / is.gd / v.gd）。

## 输入

| 字段 | 必填 | 说明 |
|------|------|------|
| URL | 是 | 落地页/商品/表单链接 |
| source | UTM 时必填 | 来源平台，如 xiaohongshu/douyin/wechat |
| medium | UTM 时必填 | 媒介，如 social/video/cpc |
| campaign | UTM 时必填 | 活动名，如 618/newproduct |

## 执行

脚本路径（相对项目根）：`skills/builtin/skill-short-link/scripts/shortlink.py`（各子命令 `-h`）。

```bash
# 一步到位：拼 UTM + 缩短（最常用）
python <skill>/scripts/shortlink.py both --url "https://shop.example.com/item/123" \
  --source xiaohongshu --medium social --campaign 618

# 只拼 UTM 参数
python <skill>/scripts/shortlink.py utm --url "https://a.com/p" \
  --source douyin --medium video --campaign summer --content 视频A

# 只缩短
python <skill>/scripts/shortlink.py short --url "https://a.com/very/long/url" --provider tinyurl
```

- 默认短链服务 `tinyurl`（最稳、任意 URL 均可）；也可 `--provider isgd`/`vgd`（支持 `--alias` 自定义短码，
  但对部分域名有黑名单）。
- 多平台投放建议**每个平台一条短链**（source 不同），这样后台能分平台看流量。

## 规则

1. 每个投放渠道生成独立短链（utm_source 区分），否则无法分平台归因。
2. campaign 用统一命名规范（如 `618`、`产品名-月份`），方便后续聚合。
3. `--content` 用于同活动多素材 A/B（如"视频A"/"图文B"）。
4. 短链服务为第三方公共服务，重要投放建议自建短链域名（本 SKILL 便于快速出链）。

## 参考来源

UTM 是 GA/各分析平台通用的来源追踪参数标准（utm_source/medium/campaign/term/content）。
短链用 TinyURL / is.gd / v.gd 的免 key 公共 API。纯 urllib 实现。
