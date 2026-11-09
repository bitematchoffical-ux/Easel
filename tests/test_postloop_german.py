"""Postloop: deutsche Texte in Zähl-, Untertitel- und Sprachausgabe-Skripten."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "skills" / "shared" / "scripts"))

import asr  # noqa: E402
import tts  # noqa: E402
import wordcount  # noqa: E402


def test_umlauts_do_not_split_words():
    stats = wordcount.count("Größere Wörter für Mädchen über Straßen")
    assert stats["en_words"] == 6
    assert stats["words"] == 6
    assert stats["punct"] == 0


def test_words_metric_counts_spoken_words_for_speech_rate():
    text = "In 30 Sekunden wisst ihr, wo ihr heute esst."
    assert wordcount.count(text)["words"] == 9
    assert wordcount.check(text, 9, 0.0, "words")["pass"]


def test_total_chars_is_plain_character_count_for_platform_limits():
    text = "Mir egal? Match2Eat entscheidet."
    assert wordcount.count(text)["total_chars"] == len(text)


def test_chinese_counting_is_unchanged():
    stats = wordcount.count("我有 3 只猫 and 2 dogs")
    assert stats["cjk_chars"] == 4 and stats["social_count"] == 8


@pytest.mark.parametrize("language,expected", [("de", 42), ("en", 42), (None, 42), ("zh", 18), ("ja", 18)])
def test_subtitle_line_length_depends_on_language(language, expected):
    assert asr.default_line_chars(language) == expected


def test_german_subtitles_break_only_at_word_boundaries():
    text = ("Ihr diskutiert zwanzig Minuten und landet am Ende wieder beim selben Laden "
            "um die Ecke, obwohl eigentlich keiner Lust darauf hat.")
    lines = asr._wrap_line(text, 42).split("\\N")
    assert len(lines) > 1
    words = set(text.replace(",", "").replace(".", "").split())
    for line in lines:
        for word in line.replace(",", "").replace(".", "").split():
            assert word in words, f"Wort zerschnitten: {word!r}"


def test_long_german_segment_is_split_at_sentence_end():
    text = ("Ihr diskutiert zwanzig Minuten und landet am Ende wieder beim selben Laden um die Ecke. "
            "Match2Eat entscheidet. Und zwar in dreißig Sekunden für alle.")
    cues = asr._split_long_segment(text, 0.0, 10.0, 42)
    assert len(cues) >= 2
    assert all(cue[2].endswith(".") for cue in cues)


def test_default_voice_is_german():
    assert tts.DEFAULT_VOICE.startswith("de-")
    assert tts.COMMON_DE_VOICES[0][0] == tts.DEFAULT_VOICE
