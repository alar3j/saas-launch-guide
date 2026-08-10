const STORAGE_KEY = "atlqiha-saas-guide-progress-v1";
const FINAL_KEY = "atlqiha-saas-guide-final-v1";

const stageInputs = Array.from(document.querySelectorAll("[data-check]"));
const finalInputs = Array.from(document.querySelectorAll("[data-final-check]"));
const progressText = document.querySelector("#progressText");
const headerProgressText = document.querySelector("#headerProgressText");
const progressBar = document.querySelector("#progressBar");
const progressTrack = progressBar ? progressBar.parentElement : null;
const resetStatus = document.querySelector("#resetStatus");

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

function updateProgress() {
  const complete = stageInputs.filter(function (input) {
    return input.checked;
  }).length;
  const readable = arabicNumber(complete) + " من ٧";
  const percent = stageInputs.length ? (complete / stageInputs.length) * 100 : 0;

  if (progressText) progressText.textContent = readable;
  if (headerProgressText) headerProgressText.textContent = readable;
  if (progressBar) progressBar.style.width = percent + "%";
  if (progressTrack) progressTrack.setAttribute("aria-valuenow", String(complete));

  stageInputs.forEach(function (input) {
    const stageNumber = input.dataset.check;
    const link = document.querySelector('[data-stage-link="' + stageNumber + '"]');
    const stage = input.closest(".stage");
    const labelText = input.closest("label").querySelector("span:last-child");

    if (link) link.classList.toggle("done", input.checked);
    if (stage) stage.classList.toggle("is-complete", input.checked);
    if (labelText) labelText.textContent = input.checked ? "المرحلة مكتملة" : "أكملت المرحلة";
  });
}

const stageState = readState(STORAGE_KEY);

stageInputs.forEach(function (input) {
  input.checked = Boolean(stageState[input.dataset.check]);
  input.addEventListener("change", function () {
    stageState[input.dataset.check] = input.checked;
    writeState(STORAGE_KEY, stageState);
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
    writeState(STORAGE_KEY, stageState);
    updateProgress();

    if (resetStatus) {
      resetStatus.textContent = "تمت إعادة ضبط تقدّم الدليل.";
      window.setTimeout(function () {
        resetStatus.textContent = "";
      }, 3000);
    }
  });
}

function setActiveStage(stageNumber) {
  document.querySelectorAll("[data-stage-link]").forEach(function (link) {
    const active = link.dataset.stageLink === stageNumber;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "step");
    else link.removeAttribute("aria-current");
  });
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      setActiveStage(entry.target.dataset.stage);
    });
  }, {
    rootMargin: "-18% 0px -68% 0px",
    threshold: 0.01
  });

  document.querySelectorAll(".stage").forEach(function (stage) {
    observer.observe(stage);
  });
} else {
  document.querySelectorAll(".stage").forEach(function (stage) {
    stage.classList.add("visible");
  });
}

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

const copyButton = document.querySelector("#copyLaunchText");

if (copyButton) {
  copyButton.addEventListener("click", async function () {
    const launchText = "بنيت أداة تساعد [الفئة] على [النتيجة]. أبحث عن خمسة أشخاص يجربونها ويخبرونني بصدق بما لا يعمل.";
    const status = document.querySelector("#copyStatus");

    try {
      await copyText(launchText);
      if (status) status.textContent = "تم النسخ. عدّل الأقواس ثم أرسل الرسالة.";
    } catch (error) {
      if (status) status.textContent = "تعذّر النسخ التلقائي. انسخ النص من مرحلة الإطلاق.";
    }

    window.setTimeout(function () {
      if (status) status.textContent = "";
    }, 4000);
  });
}

updateProgress();
