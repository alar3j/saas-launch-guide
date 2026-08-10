const STORAGE_KEY = "atlqiha-saas-guide-progress-v1";
const FINAL_KEY = "atlqiha-saas-guide-final-v1";
const stageInputs = [...document.querySelectorAll("[data-check]")];
const finalInputs = [...document.querySelectorAll("[data-final-check]")];
const progressText = document.querySelector("#progressText");
const progressBar = document.querySelector("#progressBar");

function arabicNumber(value) {
  return String(value).replace(/\d/g, digit => "٠١٢٣٤٥٦٧٨٩"[digit]);
}

function readState(key) {
  try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
}

function writeState(key, state) {
  try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* local storage is optional */ }
}

function updateProgress() {
  const complete = stageInputs.filter(input => input.checked).length;
  progressText.textContent = `${arabicNumber(complete)} / ٧`;
  progressBar.style.width = `${(complete / stageInputs.length) * 100}%`;
  stageInputs.forEach(input => {
    const link = document.querySelector(`[data-stage-link="${input.dataset.check}"]`);
    if (link) link.classList.toggle("done", input.checked);
  });
}

const stageState = readState(STORAGE_KEY);
stageInputs.forEach(input => {
  input.checked = Boolean(stageState[input.dataset.check]);
  input.addEventListener("change", () => {
    stageState[input.dataset.check] = input.checked;
    writeState(STORAGE_KEY, stageState);
    updateProgress();
  });
});

const finalState = readState(FINAL_KEY);
finalInputs.forEach(input => {
  input.checked = Boolean(finalState[input.dataset.finalCheck]);
  input.addEventListener("change", () => {
    finalState[input.dataset.finalCheck] = input.checked;
    writeState(FINAL_KEY, finalState);
  });
});

document.querySelector("#resetProgress").addEventListener("click", () => {
  stageInputs.forEach(input => { input.checked = false; });
  writeState(STORAGE_KEY, {});
  updateProgress();
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      const stage = entry.target.dataset.stage;
      document.querySelectorAll("[data-stage-link]").forEach(link => link.classList.toggle("active", link.dataset.stageLink === stage));
    }
  });
}, { rootMargin: "-25% 0px -65% 0px", threshold: 0.05 });

document.querySelectorAll(".reveal").forEach(stage => observer.observe(stage));
updateProgress();

document.querySelector("#copyLaunchText").addEventListener("click", async () => {
  const launchText = "بنيت أداة تساعد [الفئة] على [النتيجة]. أبحث عن ٥ أشخاص يجربونها ويخبرونني بما لا يعمل.";
  const status = document.querySelector("#copyStatus");
  try {
    await navigator.clipboard.writeText(launchText);
    status.textContent = "تم النسخ — عدّل النص وأرسله.";
  } catch {
    status.textContent = "انسخ النص من محطة الإطلاق.";
  }
  window.setTimeout(() => { status.textContent = ""; }, 3500);
});
