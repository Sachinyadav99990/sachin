(function () {
  "use strict";

  const storageKey = "decisionMirrorState";
  const simulatorDraftKey = "decisionMirrorSimulatorDraft";

  const biasRules = [
    {
      name: "Loss aversion",
      keywords: ["lose", "loss", "afraid", "safe", "risk", "worried", "terrified", "scared", "fail", "cost"],
      reframe: "Separate the cost of losing from the value of gaining. What would you choose if both outcomes felt emotionally neutral?",
      missingEvidence: "List 3 potential long-term benefits of taking this risk that you might be downplaying."
    },
    {
      name: "Anchoring",
      keywords: ["first", "initial", "original", "salary", "price", "budget", "baseline", "starting", "quoted"],
      reframe: "List two fresh reference points before accepting the first number or first story as your baseline framework.",
      missingEvidence: "Seek out an alternative vendor, quote, or case study completely outside of this current ecosystem."
    },
    {
      name: "Herd mentality",
      keywords: ["everyone", "team", "market", "popular", "others", "trend", "peer", "crowd", "vogue", "hype"],
      reframe: "Name the core evidence you would still trust if absolutely nobody else agreed with this choice.",
      missingEvidence: "Find a contrarian expert viewpoint or data point that actively pushes against the current trend."
    },
    {
      name: "Instant gratification",
      keywords: ["quick", "today", "now", "urgent", "soon", "immediate", "fast", "rush", "shortcut"],
      reframe: "Run a 30-day version of this choice. What advantage still matters after the initial urgency fades?",
      missingEvidence: "Map out the compounding technical or emotional debt this speed might create 6 months from now."
    },
    {
      name: "Confirmation bias",
      keywords: ["sure", "obvious", "prove", "right", "already", "believe", "clear", "undeniable", "certain"],
      reframe: "Write the strongest possible adversarial argument against your preferred option before you click commit.",
      missingEvidence: "Actively try to disprove your core hypothesis. What is one piece of data that says you are wrong?"
    }
  ];

  const defaultLog = [
    { id: "log-1", title: "Product launch timing", bias: "Instant gratification", risk: 42, next: "Validate with two customers", pressure: 70, clarity: 60, reviewed: false, createdAt: "2026-05-18T09:00:00Z" },
    { id: "log-2", title: "Hiring senior analyst", bias: "Anchoring", risk: 35, next: "Re-score interview evidence", pressure: 40, clarity: 80, reviewed: false, createdAt: "2026-05-16T13:30:00Z" },
    { id: "log-3", title: "Reduce marketing spend", bias: "Loss aversion", risk: 51, next: "Model downside separately", pressure: 80, clarity: 50, reviewed: false, createdAt: "2026-05-14T11:20:00Z" },
    { id: "log-4", title: "Choose analytics vendor", bias: "Confirmation bias", risk: 29, next: "Review rejected vendors", pressure: 30, clarity: 85, reviewed: false, createdAt: "2026-05-12T15:45:00Z" }
  ];

  const themeIcons = {
    dark: "Dark",
    light: "Light"
  };

  let DOM = {};
  let simulatorStep = 0;
  const state = loadState();

  function storageAvailable() {
    try {
      const testKey = '__decisionMirrorStorageTest__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  function loadState() {
    const defaultTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    if (!storageAvailable()) {
      return { theme: defaultTheme, log: [...defaultLog] };
    }

    try {
      const saved = localStorage.getItem(storageKey);
      const parsed = saved ? JSON.parse(saved) : null;
      const rawLog = Array.isArray(parsed?.log) && parsed.log.length ? parsed.log : [...defaultLog];
      return {
        theme: parsed?.theme || defaultTheme,
        log: rawLog.map((entry) => ({
          id: entry.id || String(Date.now()) + Math.random().toString(16).slice(2),
          reviewed: entry.reviewed || false,
          createdAt: entry.createdAt || new Date().toISOString(),
          ...entry
        }))
      };
    } catch (error) {
      console.warn("DecisionMirror State recovery triggered due to corruption:", error);
      return {
        theme: defaultTheme,
        log: [...defaultLog].map((entry) => ({
          id: String(Date.now()) + Math.random().toString(16).slice(2),
          reviewed: false,
          createdAt: entry.createdAt || new Date().toISOString(),
          ...entry
        }))
      };
    }
  }

  function saveState() {
    if (!storageAvailable()) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to persist state to localStorage:", error);
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function tokenizeText(text) {
    return (text.match(/\b[a-zA-Z']+\b/g) || []).map((token) => token.toLowerCase());
  }

  function setThemeGlyph() {
    const glyph = DOM.themeGlyph;
    const theme = document.documentElement.dataset.theme || state.theme || 'dark';
    if (glyph) glyph.textContent = themeIcons[theme] || themeIcons.dark;
  }

  function scoreText(text, stakes, timeline) {
    const normalized = text.toLowerCase();
    const tokens = tokenizeText(normalized);
    const tokenSet = new Set(tokens);
    const totalWords = tokens.length || 1;

    const matches = biasRules.map((rule) => {
      const hits = rule.keywords.reduce((count, keyword) => count + (tokenSet.has(keyword) ? 1 : 0), 0);
      const densityMultiplier = hits / (totalWords * 0.15 + 1);
      const confidence = Math.min(95, Math.round(25 + hits * 18 + densityMultiplier * 10));
      return { ...rule, hits, confidence };
    });

    const detected = matches.filter((item) => item.hits > 0).sort((a, b) => b.confidence - a.confidence);
    const topMatch = detected.length ? detected[0] : { ...biasRules[4], confidence: 20 };
    const baseRisk = detected.reduce((sum, item) => sum + item.confidence, 0) / Math.max(detected.length, 1);
    const stakesBoost = stakes === "high" ? 15 : stakes === "low" ? -10 : 0;
    const timelineBoost = timeline === "today" ? 12 : timeline === "later" ? -8 : 0;
    const risk = Math.max(10, Math.min(95, Math.round(baseRisk + stakesBoost + timelineBoost)));

    return {
      detected: detected.length ? detected : [topMatch],
      risk,
      topBias: topMatch
    };
  }

  function routeTo(viewId) {
    document.querySelectorAll(".view").forEach((view) => view.classList.toggle("is-active", view.id === viewId));
    document.querySelectorAll(".nav-item").forEach((button) => {
      const isActive = button.dataset.view === viewId;
      button.classList.toggle("is-active", isActive);
      if (isActive) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    window.location.hash = viewId;
    const main = document.getElementById("main");
    if (main) {
      const shouldScrollToWorkspace = window.matchMedia && window.matchMedia("(max-width: 980px)").matches;
      main.focus({ preventScroll: !shouldScrollToWorkspace });
      if (shouldScrollToWorkspace) main.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }

  function animateNumber(element, value, suffix) {
    if (!element) return;
    const start = Number(element.dataset.current || 0);
    const duration = 400;
    const started = performance.now();

    function tick(now) {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (value - start) * eased);
      element.textContent = current + suffix;
      if (progress < 1) requestAnimationFrame(tick);
      else element.dataset.current = String(value);
    }

    requestAnimationFrame(tick);
  }

  function syncDecisionScatterMap() {
    const mapVisual = document.querySelector(".map-visual");
    if (!mapVisual) return;

    document.querySelectorAll(".dynamic-plot-point").forEach((el) => el.remove());

    state.log.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "plot-point dynamic-plot-point";

      const pressureX = item.pressure !== undefined ? item.pressure : Math.max(5, Math.min(90, item.risk + 10));
      const clarityY = item.clarity !== undefined ? item.clarity : Math.max(10, Math.min(90, 100 - item.risk));

      btn.style.left = `${Math.max(5, Math.min(90, pressureX))}%`;
      btn.style.top = `${Math.max(5, Math.min(90, 100 - clarityY))}%`;

      if (item.risk > 60) btn.style.backgroundColor = "var(--coral)";
      else if (item.risk > 35) btn.style.backgroundColor = "var(--amber)";
      else btn.style.backgroundColor = "var(--brand)";

      btn.setAttribute("aria-label", `${item.title} risk ${item.risk}% bias ${item.bias}`);
      btn.addEventListener("click", () => {
        const tooltip = document.getElementById("mapTooltip");
        if (tooltip) {
          tooltip.innerHTML = `<strong>${escapeHtml(item.title)}</strong>: Risk ${item.risk}% driven by ${escapeHtml(item.bias)}. <br/><em>${escapeHtml(item.next)}</em>`;
        }
      });

      mapVisual.appendChild(btn);
    });
  }

  function renderDashboard() {
    const log = [...state.log].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const averageRisk = log.length ? Math.round(log.reduce((sum, item) => sum + item.risk, 0) / log.length) : 0;
    const clarity = log.length ? Math.max(5, Math.min(98, 100 - averageRisk + 12)) : 86;
    const nextReview = log.length
      ? new Date(new Date(log[0].createdAt).getTime() + 7 * 24 * 60 * 60 * 1000)
      : new Date();
    const daysUntilReview = Math.max(1, Math.round((nextReview - new Date()) / (1000 * 60 * 60 * 24)));

    animateNumber(DOM.clarityMetric, clarity, "%");
    animateNumber(DOM.riskMetric, averageRisk, "%");
    animateNumber(DOM.trackedMetric, log.length, "");
    if (DOM.nextReviewMetric) DOM.nextReviewMetric.textContent = daysUntilReview === 1 ? "Tomorrow" : `${daysUntilReview} days`;

    const counts = log.reduce((acc, item) => {
      acc[item.bias] = (acc[item.bias] || 0) + 1;
      return acc;
    }, {});

    if (DOM.biasList) {
      DOM.biasList.innerHTML = Object.entries(counts).length
        ? Object.entries(counts)
            .map(([bias, count]) => {
              const width = Math.max(15, Math.round((count / Math.max(...Object.values(counts), 1)) * 100));
              return `
                <article class="bias-item">
                  <div><strong>${escapeHtml(bias)}</strong><span>${count} logged</span></div>
                  <span class="bar" aria-hidden="true"><span style="width:${width}%"></span></span>
                </article>`;
            })
            .join("")
        : `<div class="empty-state">No bias signals yet. Run the simulator to populate the dashboard.</div>`;
    }

    const rows = DOM.decisionRows;
    if (rows) {
      rows.innerHTML = log.length
        ? log
            .slice(0, 6)
            .map((item) => {
              const rowClass = item.reviewed ? 'reviewed' : '';
              return `
                <tr class="${rowClass}">
                  <td><strong>${escapeHtml(item.title)}</strong></td>
                  <td><span class="tag">${escapeHtml(item.bias)}</span></td>
                  <td><strong style="color: ${item.risk > 55 ? "var(--coral)" : "inherit"}">${item.risk}%</strong></td>
                  <td>${escapeHtml(item.next)}</td>
                  <td><time>${escapeHtml(formatDate(item.createdAt))}</time></td>
                  <td class="action-cell">
                    <button class="button button-secondary compact review-toggle" type="button" data-entry-id="${item.id}">${item.reviewed ? 'Unreview' : 'Mark reviewed'}</button>
                    <button class="button button-secondary compact delete-decision" type="button" data-entry-id="${item.id}">Delete</button>
                  </td>
                </tr>`;
            })
            .join("")
        : `<tr><td colspan="6"><p class="empty-state">No recent decisions yet. Run the simulator to get started.</p></td></tr>`;

      rows.querySelectorAll('.delete-decision').forEach((button) => {
        button.addEventListener('click', () => deleteLogEntry(button.dataset.entryId));
      });

      rows.querySelectorAll('.review-toggle').forEach((button) => {
        button.addEventListener('click', () => toggleLogReview(button.dataset.entryId));
      });
    }

    syncDecisionScatterMap();
  }

  function deleteLogEntry(entryId) {
    state.log = state.log.filter((item) => item.id !== entryId);
    saveState();
    renderDashboard();
  }

  function toggleLogReview(entryId) {
    const entry = state.log.find((item) => item.id === entryId);
    if (!entry) return;
    entry.reviewed = !entry.reviewed;
    saveState();
    renderDashboard();
  }

  function renderSimulatorResult(result) {
    const container = DOM.simulatorResult;
    const score = DOM.riskScore;
    if (score) score.textContent = result.risk + "%";
    if (!container) return;

    container.classList.remove("empty-state");
    container.innerHTML = `
      <p><span class="tag" style="background: var(--surface-2)">Strategic vector</span></p>
      <h3>${escapeHtml(result.summary)}</h3>
      <ul class="report-list">
        ${result.detected.map((bias) => `
            <li>
              <strong>Warning: ${escapeHtml(bias.name)} - ${bias.confidence}% confidence</strong>
              <span>${escapeHtml(bias.reframe || bias.missingEvidence)}</span>
            </li>`).join("")}
      </ul>
      <ul class="report-list">
        <li><strong>Reflective checkpoint</strong><span>${escapeHtml(result.question)}</span></li>
        <li><strong>Micro mitigation action</strong><span>${escapeHtml(result.next)}</span></li>
      </ul>`;
  }

  function handleSimulatorSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = collectSimulatorData();
    const title = data.decisionTitle;
    const context = data.decisionContext;
    const goal = data.primaryGoal;
    const error = DOM.simulatorError;
    const errors = validateSimulatorStep("all", true);

    if (Object.keys(errors).length) {
      if (error) error.textContent = "Complete the highlighted fields before running analysis.";
      const firstError = Object.keys(errors)[0];
      const firstField = getField(form, firstError);
      const firstStep = firstField?.closest(".form-step");
      if (firstStep) showSimulatorStep(Number(firstStep.dataset.step || 0));
      if (firstField) firstField.focus();
      return;
    }

    if (error) error.textContent = "";
    const combinedText = [
      context,
      goal,
      data.preferredOption,
      data.alternatives,
      data.bestCase,
      data.worstCase,
      data.evidenceCollected,
      data.missingEvidenceInput,
      data.affectedPeople
    ].join(" ");
    const analysis = scoreText(combinedText, data.stakes, data.timeline);
    const confidence = Number(data.confidence || 55);
    const pressureValue = data.timeline === "today" ? 85 : data.timeline === "soon" ? 60 : 35;
    const reversibilityPenalty = data.reversibility === "low" ? 12 : data.reversibility === "high" ? -8 : 0;
    const clarityValue = Math.max(10, Math.min(95, 100 - analysis.risk + Math.round(confidence / 10) - reversibilityPenalty));
    const createdAt = new Date().toISOString();

    const result = {
      ...analysis,
      summary: analysis.risk + reversibilityPenalty > 60
        ? "High volatility risk flagged. Implement friction breaks before deployment authorization."
        : "Operational clearance baseline met. Proceed with minor validation checks.",
      question: data.missingEvidenceInput
        ? `Which missing evidence item is fastest to test: "${data.missingEvidenceInput}"?`
        : "If this choice fails immediately post-launch, what pre-existing assumption was responsible?",
      next: goal
        ? `Validate tracking alignment against objective: "${goal}"`
        : "Draft one small reversible experiment with zero blast radius before final commit."
    };

    state.log.unshift({
      id: String(Date.now()) + Math.random().toString(16).slice(2),
      title,
      bias: analysis.topBias.name,
      risk: result.risk,
      next: result.next,
      pressure: pressureValue,
      clarity: clarityValue,
      reviewed: false,
      createdAt
    });

    if (state.log.length > 25) state.log.pop();
    saveState();
    clearSimulatorDraft();
    renderSimulatorResult(result);
    renderDashboard();
    form.reset();
    syncRangeDisplays();
    showSimulatorStep(0);
  }

  function loadSimulatorSample() {
    const form = DOM.simulatorForm;
    if (!form) return;

    form.decisionTitle.value = "Launch critical v2 feature path";
    form.decisionContext.value = "The team is rushing to deploy now because competitor benchmarks look aggressive. I'm afraid we lose market momentum, but initial data streams indicate onboarding optimization is incomplete.";
    form.primaryGoal.value = "Minimize user churn metrics while securing immediate feedback velocity.";
    form.preferredOption.value = "Launch a controlled rollout this week";
    form.alternatives.value = "Delay full launch, release to a smaller cohort, or run one more onboarding test.";
    form.bestCase.value = "We learn quickly, keep momentum, and catch onboarding issues before broad rollout.";
    form.worstCase.value = "Users churn because the incomplete onboarding path creates confusion.";
    form.evidenceCollected.value = "Competitor benchmarks, early onboarding data, and team capacity signals.";
    form.missingEvidenceInput.value = "Two customer walkthroughs and one rollback plan review.";
    form.confidence.value = "62";
    form.reversibility.value = "medium";
    form.affectedPeople.value = "New users, support, product, engineering, and sales.";
    form.stakes.value = "high";
    form.timeline.value = "soon";
    const error = document.getElementById("simulatorError");
    if (error) error.textContent = "";
    handleSimulatorInput();
    showSimulatorStep(0);
    form.decisionTitle.focus();
  }

  function resetSimulator() {
    const form = DOM.simulatorForm;
    if (!form) return;
    form.reset();
    clearSimulatorDraft();
    if (DOM.simulatorError) DOM.simulatorError.textContent = "";
    if (DOM.riskScore) DOM.riskScore.textContent = "0%";
    if (DOM.simulatorResult) {
      DOM.simulatorResult.classList.add("empty-state");
      DOM.simulatorResult.textContent = "Run an analysis to see bias signals, confidence, and the next best question.";
    }
    syncRangeDisplays();
    showSimulatorStep(0);
  }

  function resetComparison() {
    const form = DOM.compareForm;
    if (!form) return;
    form.reset();
    if (DOM.compareResult) DOM.compareResult.innerHTML = "Add both options, set priorities, and DecisionMirror will score the tradeoff.";
    syncRangeDisplays();
  }

  function syncRangeDisplays() {
    document.querySelectorAll("[data-range-value]").forEach((output) => {
      const range = document.querySelector(`input[type="range"][name="${output.dataset.rangeValue}"]`);
      if (range) output.textContent = range.value + "%";
    });
  }

  function getField(form, name) {
    return form?.elements?.[name] || null;
  }

  function collectSimulatorData() {
    const form = DOM.simulatorForm;
    if (!form) return {};
    const fieldNames = [
      "decisionTitle",
      "decisionContext",
      "stakes",
      "timeline",
      "primaryGoal",
      "preferredOption",
      "alternatives",
      "bestCase",
      "worstCase",
      "evidenceCollected",
      "missingEvidenceInput",
      "confidence",
      "reversibility",
      "affectedPeople"
    ];

    return fieldNames.reduce((data, name) => {
      const field = getField(form, name);
      data[name] = field ? field.value.trim() : "";
      return data;
    }, {});
  }

  function setFieldError(name, message) {
    const error = document.querySelector(`[data-error-for="${name}"]`);
    const field = DOM.simulatorForm ? getField(DOM.simulatorForm, name) : null;
    if (error) error.textContent = message || "";
    if (field) field.classList.toggle("field-warning", Boolean(message));
  }

  function validateSimulatorStep(step = simulatorStep, showErrors = true) {
    const data = collectSimulatorData();
    const errors = {};

    if (step === 0 || step === "all") {
      if ((data.decisionTitle || "").length < 4) errors.decisionTitle = "Use at least 4 characters.";
      if ((data.decisionContext || "").split(/\s+/).filter(Boolean).length < 12) {
        errors.decisionContext = "Add at least 12 words of context.";
      }
    }

    if (step === 1 || step === "all") {
      if (data.stakes === "high" && (data.primaryGoal || "").length < 8) {
        errors.primaryGoal = "High-stakes decisions need a clear goal.";
      }
    }

    if (step === 2 || step === "all") {
      if (data.reversibility === "low" && (data.missingEvidenceInput || "").length < 12) {
        errors.missingEvidenceInput = "Hard-to-reverse choices need missing evidence named.";
      }
    }

    if (showErrors) {
      ["decisionTitle", "decisionContext", "primaryGoal", "missingEvidenceInput"].forEach((name) => {
        setFieldError(name, errors[name]);
      });
    }

    return errors;
  }

  function saveSimulatorDraft() {
    if (!storageAvailable()) return;
    try {
      localStorage.setItem(simulatorDraftKey, JSON.stringify(collectSimulatorData()));
      if (DOM.draftStatus) DOM.draftStatus.textContent = "Draft autosaved";
    } catch (error) {
      if (DOM.draftStatus) DOM.draftStatus.textContent = "Draft not saved";
    }
  }

  function loadSimulatorDraft() {
    if (!storageAvailable() || !DOM.simulatorForm) return;
    try {
      const saved = JSON.parse(localStorage.getItem(simulatorDraftKey) || "null");
      if (!saved || typeof saved !== "object") return;
      Object.entries(saved).forEach(([name, value]) => {
        const field = getField(DOM.simulatorForm, name);
        if (field && value !== undefined) field.value = value;
      });
    } catch (error) {
      console.warn("Unable to restore simulator draft:", error);
    }
  }

  function clearSimulatorDraft() {
    if (!storageAvailable()) return;
    localStorage.removeItem(simulatorDraftKey);
  }

  function updateSimulatorPreview() {
    const data = collectSimulatorData();
    const combinedText = [
      data.decisionContext,
      data.primaryGoal,
      data.preferredOption,
      data.alternatives,
      data.bestCase,
      data.worstCase,
      data.evidenceCollected,
      data.missingEvidenceInput
    ].join(" ");
    const analysis = scoreText(combinedText || "", data.stakes || "medium", data.timeline || "soon");
    const errors = validateSimulatorStep("all", false);
    const readiness = Math.max(10, Math.min(98,
      100 - Object.keys(errors).length * 18 - (data.reversibility === "low" ? 8 : 0) + (Number(data.confidence || 0) > 70 ? 4 : 0)
    ));

    if (DOM.riskScore) DOM.riskScore.textContent = analysis.risk + "%";
    if (!DOM.simulatorPreview) return;

    DOM.simulatorPreview.innerHTML = `
      <div class="preview-grid">
        <article class="preview-card"><strong>${readiness}%</strong><span>Readiness</span></article>
        <article class="preview-card"><strong>${analysis.risk}%</strong><span>Estimated bias risk</span></article>
        <article class="preview-card"><strong>${escapeHtml(analysis.topBias.name)}</strong><span>Most likely bias</span></article>
        <article class="preview-card"><strong>${escapeHtml(data.reversibility || "medium")}</strong><span>Reversibility</span></article>
      </div>
      <p>${Object.keys(errors).length ? "Complete the highlighted fields before running the full analysis." : "The decision frame is ready for analysis."}</p>
      <p><strong>Next useful question:</strong> ${escapeHtml(analysis.topBias.missingEvidence)}</p>`;
  }

  function showSimulatorStep(step) {
    const steps = Array.from(document.querySelectorAll(".form-step"));
    simulatorStep = Math.max(0, Math.min(steps.length - 1, step));
    steps.forEach((section, index) => section.classList.toggle("is-active", index === simulatorStep));
    document.querySelectorAll("[data-step-indicator]").forEach((item) => {
      const index = Number(item.dataset.stepIndicator);
      item.classList.toggle("is-active", index === simulatorStep);
      item.classList.toggle("is-complete", index < simulatorStep);
      if (index === simulatorStep) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    });
    if (DOM.prevSimulatorStep) DOM.prevSimulatorStep.disabled = simulatorStep === 0;
    if (DOM.nextSimulatorStep) DOM.nextSimulatorStep.textContent = simulatorStep === steps.length - 1 ? "Review ready" : "Next";
    updateSimulatorPreview();
  }

  function handleSimulatorInput() {
    validateSimulatorStep(simulatorStep, true);
    updateSimulatorPreview();
    saveSimulatorDraft();
    syncRangeDisplays();
  }

  function requestSimulatorStep(targetStep) {
    if (targetStep <= simulatorStep) {
      showSimulatorStep(targetStep);
      return;
    }

    for (let step = simulatorStep; step < targetStep; step += 1) {
      const errors = validateSimulatorStep(step, true);
      if (Object.keys(errors).length) return;
    }
    showSimulatorStep(targetStep);
  }

  function scoreOption(text, weights, direction) {
    const normalized = text.toLowerCase();
    const tokens = tokenizeText(normalized);
    const positive = ["growth", "learn", "impact", "stable", "aligned", "support", "clear", "customer", "revenue", "safety"];
    const risky = ["unclear", "urgent", "expensive", "burnout", "lose", "delay", "pressure", "debt", "risk"];
    const negations = ["not", "never", "no", "dont", "wont", "without", "avoid", "cannot", "can't"];

    let posScore = 0;
    let negScore = 0;

    tokens.forEach((token, index) => {
      const prev = tokens[index - 1] || "";
      const isNegated = negations.includes(prev);

      if (positive.includes(token)) {
        if (isNegated) negScore += 1;
        else posScore += 1;
      }
      if (risky.includes(token)) {
        if (isNegated) posScore += 1;
        else negScore += 1;
      }
    });

    const base = 50 + posScore * 8 - negScore * 6;
    const weighted = base +
      ((weights.impact - 50) * 0.2) +
      ((weights.alignment - 50) * 0.25) +
      direction * ((weights.timeline - 50) * 0.1) -
      direction * ((weights.risk - 50) * 0.12);

    return Math.max(5, Math.min(98, Math.round(weighted)));
  }

  function handleCompareSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form) return;

    const weights = {
      impact: Number(form.impact.value),
      risk: Number(form.risk.value),
      timeline: Number(form.timeline.value),
      alignment: Number(form.alignment.value)
    };

    const optionA = form.optionA.value.trim();
    const optionB = form.optionB.value.trim();
    const scoreA = scoreOption(form.optionADesc.value, weights, -1);
    const scoreB = scoreOption(form.optionBDesc.value, weights, 1);
    const winner = scoreA >= scoreB ? optionA || "Option A" : optionB || "Option B";
    const gap = Math.abs(scoreA - scoreB);
    const confidence = Math.min(96, 50 + gap * 2.5);

    const container = DOM.compareResult;
    if (!container) return;

    container.innerHTML = `
      <div>
        <span class="tag">Mathematical Vector Analysis</span>
        <h3 style="margin-top: 10px;">Optimal Pathway: ${escapeHtml(winner)}</h3>
        <p>${gap < 6 ? "The margin is highly narrow. We suggest spinning up a dual-track parallel test before permanent bifurcation." : "The variance metrics distinctly support this execution path under current weight calibrations."}</p>
      </div>
      <div class="score-grid">
        <div class="score-card" style="border-left: 4px solid var(--brand)"><strong>${scoreA}%</strong><span>${escapeHtml(optionA || "Option A")}</span></div>
        <div class="score-card" style="border-left: 4px solid var(--brand-2)"><strong>${scoreB}%</strong><span>${escapeHtml(optionB || "Option B")}</span></div>
      </div>
      <p style="margin: 0; font-size: 0.86rem; color: var(--muted);"><strong>Analytical Confidence:</strong> ${confidence}%. Re-run model matrix inputs if strategic alignment settings shift.</p>`;
  }

  function handleCoachSubmit(event) {
    event.preventDefault();
    const prompt = event.currentTarget.coachPrompt.value.trim();
    if (!prompt) return;

    const analysis = scoreText(prompt, "medium", "soon");
    const matchedBias = analysis.topBias;
    const container = DOM.coachResult;
    if (!container) return;

    container.innerHTML = `
      <p><span class="tag">Cognitive workspace lens</span></p>
      <ul class="coach-list">
        <li><strong>Contextual Reframe</strong><span>${escapeHtml(matchedBias.reframe)}</span></li>
        <li><strong>Counter-Evidence Checklist</strong><span>${escapeHtml(matchedBias.missingEvidence)}</span></li>
        <li><strong>Active Cognitive Trap Profile</strong><span>System matches high probability for <strong>${escapeHtml(matchedBias.name)}</strong> patterns shaping this narrative entry.</span></li>
        <li><strong>High-velocity Next Step</strong><span>Trigger a strict 20-minute sandbox countdown. Isolation-write one granular, safe-to-fail fallback mechanism for this dilemma.</span></li>
      </ul>`;
  }

  function init() {
    DOM = {
      main: document.getElementById('main'),
      dashboard: document.getElementById('dashboard'),
      clarityMetric: document.getElementById('clarityMetric'),
      riskMetric: document.getElementById('riskMetric'),
      trackedMetric: document.getElementById('trackedMetric'),
      nextReviewMetric: document.getElementById('nextReviewMetric'),
      biasList: document.getElementById('biasList'),
      decisionRows: document.getElementById('decisionRows'),
      simulatorForm: document.getElementById('simulatorForm'),
      simulatorResult: document.getElementById('simulatorResult'),
      riskScore: document.getElementById('riskScore'),
      simulatorError: document.getElementById('simulatorError'),
      simulatorPreview: document.getElementById('simulatorPreview'),
      draftStatus: document.getElementById('draftStatus'),
      prevSimulatorStep: document.getElementById('prevSimulatorStep'),
      nextSimulatorStep: document.getElementById('nextSimulatorStep'),
      compareForm: document.getElementById('compareForm'),
      compareResult: document.getElementById('compareResult'),
      coachForm: document.getElementById('coachForm'),
      coachResult: document.getElementById('coachResult'),
      themeGlyph: document.querySelector('.theme-glyph'),
      themeToggle: document.getElementById('themeToggle'),
      clearData: document.getElementById('clearData'),
      loadSimulatorSample: document.getElementById('loadSimulatorSample'),
      resetSimulator: document.getElementById('resetSimulator'),
      resetComparison: document.getElementById('resetComparison')
    };

    document.documentElement.dataset.theme = state.theme;
    if (DOM.main) {
      if (DOM.dashboard) renderDashboard();
      if (document.querySelector('.map-visual')) syncDecisionScatterMap();
    }

    document.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => routeTo(button.dataset.view));
    });

    if (DOM.themeToggle) {
      DOM.themeToggle.setAttribute('aria-pressed', state.theme === 'light' ? 'true' : 'false');
      DOM.themeToggle.addEventListener("click", () => {
        state.theme = state.theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = state.theme;
        DOM.themeToggle.setAttribute('aria-pressed', state.theme === 'light' ? 'true' : 'false');
        setThemeGlyph();
        saveState();
      });
    }

    if (DOM.clearData) {
      DOM.clearData.addEventListener("click", () => {
        if (confirm("Confirm action: Do you wish to clean local data metrics caches?")) {
          state.log = [...defaultLog].map((entry) => ({
            ...entry,
            id: String(Date.now()) + Math.random().toString(16).slice(2),
            reviewed: false,
            createdAt: entry.createdAt || new Date().toISOString()
          }));
          saveState();
          renderDashboard();
        }
      });
    }

    document.querySelectorAll(".plot-point").forEach((point) => {
      point.addEventListener("click", () => {
        const tooltip = document.getElementById("mapTooltip");
        if (tooltip) tooltip.textContent = point.dataset.insight;
      });
    });

    document.querySelectorAll("input[type='range']").forEach((range) => {
      range.addEventListener("input", () => {
        const output = document.querySelector(`[data-range-value="${range.name}"]`);
        if (output) output.textContent = range.value + "%";
      });
    });

    if (DOM.loadSimulatorSample) DOM.loadSimulatorSample.addEventListener("click", loadSimulatorSample);
    if (DOM.resetSimulator) DOM.resetSimulator.addEventListener("click", resetSimulator);
    if (DOM.simulatorForm) {
      loadSimulatorDraft();
      DOM.simulatorForm.addEventListener("input", handleSimulatorInput);
      DOM.simulatorForm.addEventListener("change", handleSimulatorInput);
      DOM.simulatorForm.addEventListener("submit", handleSimulatorSubmit);
    }
    if (DOM.prevSimulatorStep) {
      DOM.prevSimulatorStep.addEventListener("click", () => requestSimulatorStep(simulatorStep - 1));
    }
    if (DOM.nextSimulatorStep) {
      DOM.nextSimulatorStep.addEventListener("click", () => {
        requestSimulatorStep(simulatorStep + 1);
      });
    }
    document.querySelectorAll("[data-step-indicator]").forEach((button) => {
      button.addEventListener("click", () => {
        requestSimulatorStep(Number(button.dataset.stepIndicator));
      });
    });
    if (DOM.compareForm) DOM.compareForm.addEventListener("submit", handleCompareSubmit);
    if (DOM.resetComparison) DOM.resetComparison.addEventListener("click", resetComparison);
    if (DOM.coachForm) DOM.coachForm.addEventListener("submit", handleCoachSubmit);

    syncRangeDisplays();
    showSimulatorStep(0);
    setThemeGlyph();

    const initialView = window.location.hash.replace("#", "") || "dashboard";
    if (document.getElementById(initialView)) routeTo(initialView);
  }

  window.addEventListener("error", (event) => {
    console.error("DecisionMirror isolated runtime core safety boundary trap:", event.error || event.message);
  });

  document.addEventListener("DOMContentLoaded", init);
})();
