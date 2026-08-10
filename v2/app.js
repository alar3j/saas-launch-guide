/* ══════════════════════════════════════════════════════════════
   أطلِقها ٢٫٠ — interaction layer
   Storage keys carry a -v2- segment so progress never collides
   with the first version of the guide living at the repo root.
   ══════════════════════════════════════════════════════════════ */

const STAGE_KEY = "atlqiha-v2-stages";
const FINAL_KEY = "atlqiha-v2-final";
const THEME_KEY = "atlqiha-v2-theme";
const MODE_KEY = "atlqiha-v2-mode";

const root = document.documentElement;
const liveStatus = document.querySelector("#liveStatus");

function announce(message, clearAfter) {
  if (!liveStatus) return;
  liveStatus.textContent = message;
  window.setTimeout(function () {
    liveStatus.textContent = "";
  }, clearAfter || 3500);
}

function arabicNumber(value) {
  return String(value).replace(/\d/g, function (digit) {
    return "٠١٢٣٤٥٦٧٨٩"[digit];
  });
}

function readState(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch (error) {
    return {};
  }
}

function writeState(key, state) {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    // The guide stays fully usable when local storage is unavailable.
  }
}

function writeValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    // Same as above — a blocked store only costs persistence.
  }
}

/* ─── Progress ─────────────────────────────────────────── */

const stageInputs = Array.from(document.querySelectorAll("[data-check]"));
const finalInputs = Array.from(document.querySelectorAll("[data-final-check]"));
const progressCount = document.querySelector("#progressCount");
const progressNote = document.querySelector("#progressNote");
const headerRingText = document.querySelector("#headerRingText");
const rings = [document.querySelector("#mainRing"), document.querySelector("#headerRing")];

rings.forEach(function (ring) {
  if (!ring) return;
  const length = ring.getTotalLength();
  ring.style.strokeDasharray = String(length);
  ring.style.strokeDashoffset = String(length);
  ring.dataset.length = String(length);
});

const NOTES = [
  "علّم كل مرحلة عند إنهائها — يُحفظ التقدّم في متصفحك وحده.",
  "بداية موفقة. المرحلة التالية أقصر مما تظن.",
  "مرحلتان خلفك. الآن تعرف ما تبنيه ولمن.",
  "ثلاث من سبع — أنت في منتصف الطريق تقريبًا.",
  "أربع مراحل. المنتج بدأ يشبه المنتج.",
  "خمس مراحل. بقي التشغيل والقياس ثم الإطلاق.",
  "ست مراحل. لم يعد بينك وبين أول مستخدم سوى خطوة.",
  "سبع من سبع. أرسل الدعوات الآن — لا تنتظر تحسينًا أخيرًا."
];

function updateProgress() {
  const done = stageInputs.filter(function (input) {
    return input.checked;
  }).length;
  const ratio = stageInputs.length ? done / stageInputs.length : 0;

  if (progressCount) progressCount.textContent = arabicNumber(done);
  if (headerRingText) headerRingText.textContent = arabicNumber(done);
  if (progressNote) progressNote.textContent = NOTES[done] || NOTES[0];

  rings.forEach(function (ring) {
    if (!ring) return;
    const length = Number(ring.dataset.length);
    ring.style.strokeDashoffset = String(length * (1 - ratio));
  });

  stageInputs.forEach(function (input) {
    const number = input.dataset.check;
    const stage = input.closest(".stage");
    const link = document.querySelector('[data-stage-link="' + number + '"]');
    const card = document.querySelector('[data-stage-card="' + number + '"]');
    const text = input.parentElement.querySelector(".done-text");

    if (stage) stage.classList.toggle("is-complete", input.checked);
    if (link) link.classList.toggle("done", input.checked);
    if (card) card.classList.toggle("done", input.checked);
    if (text) text.textContent = input.checked ? "المرحلة مكتملة" : "أكملت المرحلة";
  });
}

const stageState = readState(STAGE_KEY);

stageInputs.forEach(function (input) {
  input.checked = Boolean(stageState[input.dataset.check]);
  input.addEventListener("change", function () {
    stageState[input.dataset.check] = input.checked;
    writeState(STAGE_KEY, stageState);
    updateProgress();
  });
});

const finalState = readState(FINAL_KEY);

finalInputs.forEach(function (input) {
  input.checked = Boolean(finalState[input.dataset.finalCheck]);
  input.addEventListener("change", function () {
    finalState[input.dataset.finalCheck] = input.checked;
    writeState(FINAL_KEY, finalState);
  });
});

const resetButton = document.querySelector("#resetProgress");

if (resetButton) {
  resetButton.addEventListener("click", function () {
    stageInputs.forEach(function (input) {
      input.checked = false;
      stageState[input.dataset.check] = false;
    });
    writeState(STAGE_KEY, stageState);
    updateProgress();
    announce("تمت إعادة ضبط تقدّم الدليل.");
  });
}

updateProgress();

/* ─── Theme ────────────────────────────────────────────── */

const themeToggle = document.querySelector("#themeToggle");

if (themeToggle) {
  themeToggle.addEventListener("click", function () {
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const current = root.getAttribute("data-theme") || (systemDark ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    writeValue(THEME_KEY, next);
    announce(next === "dark" ? "تم تفعيل الوضع الداكن." : "تم تفعيل الوضع الفاتح.");
  });
}

/* ─── Reading mode ─────────────────────────────────────── */

const modeButtons = Array.from(document.querySelectorAll("[data-mode]"));

function applyMode(mode) {
  root.classList.toggle("mode-quick", mode === "quick");
  modeButtons.forEach(function (button) {
    button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
  });
}

applyMode(root.classList.contains("mode-quick") ? "quick" : "full");

modeButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    applyMode(button.dataset.mode);
    writeValue(MODE_KEY, button.dataset.mode);
  });
});

/* ─── Active stage tracking ────────────────────────────── */

function setActiveStage(number) {
  document.querySelectorAll("[data-stage-link]").forEach(function (link) {
    const active = link.dataset.stageLink === number;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "step");
    else link.removeAttribute("aria-current");
  });
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActiveStage(entry.target.dataset.stage);
      });
    },
    { rootMargin: "-20% 0px -66% 0px", threshold: 0.01 }
  );

  document.querySelectorAll(".stage").forEach(function (stage) {
    observer.observe(stage);
  });
}

/* ─── Clipboard ────────────────────────────────────────── */

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Copy failed");
}

document.querySelectorAll("[data-copy]").forEach(function (button) {
  const label = button.querySelector("span");

  button.addEventListener("click", async function () {
    try {
      await copyText(button.dataset.copy);
      button.classList.add("copied");
      if (label) label.textContent = "تم النسخ";
      announce("تم نسخ النص إلى الحافظة.");
    } catch (error) {
      if (label) label.textContent = "تعذّر النسخ";
      announce("تعذّر النسخ التلقائي — حدّد النص وانسخه يدويًا.");
    }

    window.setTimeout(function () {
      button.classList.remove("copied");
      if (label) label.textContent = "نسخ";
    }, 2600);
  });
});

const copyLaunch = document.querySelector("#copyLaunchText");

if (copyLaunch) {
  copyLaunch.addEventListener("click", async function () {
    const status = document.querySelector("#copyStatus");
    const text =
      "بنيت أداة تساعد [الفئة] على [النتيجة]. تذكّرتك لأنك ذكرت لي هذه المشكلة سابقًا. " +
      "أبحث عن خمسة أشخاص يجربونها ويخبرونني بصدق بما لا يعمل — عشر دقائق تكفي.";

    try {
      await copyText(text);
      if (status) status.textContent = "تم النسخ. عدّل ما بين الأقواس ثم أرسل الرسالة.";
    } catch (error) {
      if (status) status.textContent = "تعذّر النسخ التلقائي. انسخ النص من المرحلة السابعة.";
    }

    window.setTimeout(function () {
      if (status) status.textContent = "";
    }, 4500);
  });
}

/* ─── Stack filters ────────────────────────────────────── */

const stackItems = Array.from(document.querySelectorAll(".stack-item"));
const stackEmpty = document.querySelector("#stackEmpty");
const stageChips = Array.from(document.querySelectorAll("[data-filter-stage]"));
const priceChips = Array.from(document.querySelectorAll("[data-filter-price]"));

let activeStage = "all";
let activePrice = "all";

function applyStackFilters() {
  let shown = 0;

  stackItems.forEach(function (item) {
    const stageOk = activeStage === "all" || item.dataset.stage === activeStage;
    const priceOk = activePrice === "all" || item.dataset.price === activePrice;
    const visible = stageOk && priceOk;
    item.hidden = !visible;
    if (visible) shown += 1;
  });

  if (stackEmpty) stackEmpty.hidden = shown > 0;
}

function bindChips(chips, onPick) {
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      chips.forEach(function (other) {
        other.classList.toggle("is-on", other === chip);
      });
      onPick(chip);
      applyStackFilters();
    });
  });
}

bindChips(stageChips, function (chip) {
  activeStage = chip.dataset.filterStage;
});

bindChips(priceChips, function (chip) {
  activePrice = chip.dataset.filterPrice;
});

/* ─── Search ───────────────────────────────────────────── */

const STAGE_HUES = ["", "var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)", "var(--s5)", "var(--s6)", "var(--s7)"];

// Arabic normalisation: strip diacritics and fold the letter shapes people
// type inconsistently, so «ميسر» matches «ميسّر» and «مساله» matches «مسألة».
function normalise(value) {
  return String(value)
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[ىي]/g, "ي")
    .replace(/[ؤئ]/g, "ء")
    .replace(/\s+/g, " ")
    .trim();
}

const searchIndex = [];

document.querySelectorAll(".stage").forEach(function (stage) {
  const number = stage.dataset.stage;
  const title = stage.querySelector("h2");
  const kicker = stage.querySelector(".stage-kicker");
  const why = stage.querySelector(".stage-why");
  const action = stage.querySelector(".action-card h3");

  searchIndex.push({
    kind: "مرحلة",
    badge: arabicNumber(String(number).padStart(2, "0")),
    hue: STAGE_HUES[Number(number)],
    title: title ? title.textContent.trim() : "",
    sub: kicker ? kicker.textContent.trim() : "",
    href: "#" + stage.id,
    haystack: normalise(
      [
        title ? title.textContent : "",
        kicker ? kicker.textContent : "",
        why ? why.textContent : "",
        action ? action.textContent : ""
      ].join(" ")
    )
  });
});

stackItems.forEach(function (item) {
  const name = item.querySelector(".si-name");
  const use = item.querySelector(".si-use");
  const tag = item.querySelector(".si-tag");

  searchIndex.push({
    kind: "أداة",
    badge: "↗",
    hue: STAGE_HUES[Number(item.dataset.stage)],
    title: name ? name.textContent.trim() : "",
    sub: [tag ? tag.textContent.trim() : "", use ? use.textContent.trim() : ""].filter(Boolean).join(" — "),
    href: item.href,
    external: true,
    haystack: normalise([name ? name.textContent : "", use ? use.textContent : "", tag ? tag.textContent : ""].join(" "))
  });
});

const overlay = document.querySelector("#searchOverlay");
const searchInput = document.querySelector("#searchInput");
const searchResults = document.querySelector("#searchResults");
const searchTrigger = document.querySelector("#searchTrigger");

let activeResult = -1;

function renderResults(query) {
  if (!searchResults) return;

  const needle = normalise(query);
  const matches = needle
    ? searchIndex.filter(function (entry) {
        return entry.haystack.indexOf(needle) !== -1;
      })
    : searchIndex.slice(0, 7);

  searchResults.innerHTML = "";
  activeResult = -1;

  if (!matches.length) {
    const empty = document.createElement("p");
    empty.className = "search-empty";
    empty.textContent = "لا توجد نتيجة لـ «" + query + "». جرّب كلمة أخرى مثل: دفع، تحليلات، تصميم.";
    searchResults.appendChild(empty);
    return;
  }

  matches.forEach(function (entry) {
    const link = document.createElement("a");
    link.href = entry.href;
    link.setAttribute("role", "option");
    if (entry.hue) link.style.setProperty("--hue", entry.hue);
    if (entry.external) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }

    const badge = document.createElement("span");
    badge.className = "sr-badge";
    badge.textContent = entry.badge;

    const text = document.createElement("span");
    text.className = "sr-text";
    const strong = document.createElement("strong");
    strong.textContent = entry.title;
    const small = document.createElement("small");
    small.textContent = entry.sub;
    text.append(strong, small);

    const kind = document.createElement("span");
    kind.className = "sr-kind";
    kind.textContent = entry.kind;

    link.append(badge, text, kind);
    link.addEventListener("click", closeSearch);
    searchResults.appendChild(link);
  });
}

function moveActive(step) {
  const links = Array.from(searchResults.querySelectorAll("a"));
  if (!links.length) return;

  activeResult = (activeResult + step + links.length) % links.length;
  links.forEach(function (link, index) {
    link.classList.toggle("is-active", index === activeResult);
  });
  links[activeResult].scrollIntoView({ block: "nearest" });
}

function openSearch() {
  if (!overlay) return;
  overlay.hidden = false;
  document.body.classList.add("no-scroll");
  renderResults("");
  if (searchInput) {
    searchInput.value = "";
    searchInput.focus();
  }
}

function closeSearch() {
  if (!overlay || overlay.hidden) return;
  overlay.hidden = true;
  document.body.classList.remove("no-scroll");
  if (searchTrigger) searchTrigger.focus();
}

if (searchTrigger) searchTrigger.addEventListener("click", openSearch);

document.querySelectorAll("[data-search-close]").forEach(function (element) {
  element.addEventListener("click", closeSearch);
});

if (searchInput) {
  searchInput.addEventListener("input", function () {
    renderResults(searchInput.value);
  });

  searchInput.addEventListener("keydown", function (event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === "Enter") {
      const active = searchResults.querySelector("a.is-active") || searchResults.querySelector("a");
      if (active) {
        event.preventDefault();
        active.click();
      }
    }
  });
}

document.addEventListener("keydown", function (event) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    if (overlay && overlay.hidden) openSearch();
    else closeSearch();
  } else if (event.key === "Escape") {
    closeSearch();
  }
});

// Keep focus inside the dialog while it is open.
if (overlay) {
  overlay.addEventListener("keydown", function (event) {
    if (event.key !== "Tab") return;

    const focusable = overlay.querySelectorAll("input, button, a[href]");
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}
