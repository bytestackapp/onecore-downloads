(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = matchMedia("(pointer: coarse)").matches;
  const mouse = { x: -999, y: -999 };

  /* ---- release.js data (same as before) ---- */
  $("#download").href = $("#download2").href = RELEASE.apkUrl;
  $("#version").textContent = $("#notes-version").textContent = RELEASE.version;
  if (RELEASE.date) $("#notes-date").textContent = "Released " + new Date(RELEASE.date + "T00:00:00").toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const ul = document.createElement("ul");
  RELEASE.notes.forEach(t => { const li = document.createElement("li"); li.textContent = t; ul.appendChild(li); });
  $("#notes-body").appendChild(ul);
  const notes = $("#notes");
  $("#open-notes").onclick = () => notes.showModal();
  $("#close-notes").onclick = () => notes.close();
  notes.onclick = e => { if (e.target === notes) notes.close(); };

  /* ---- role switcher: the phone changes with the person using it ---- */
  const ROLES = {
    admin: ["Admin", [["clock", "Attendance", "Today's check-ins at a glance"], ["leave", "Leave", "3 requests waiting for you"], ["chart", "Reports", "Export attendance as CSV"]]],
    teacher: ["Teacher", [["clock", "Attendance", "Mark your class in seconds"], ["cal", "Events", "Staff meeting at 2:00 PM"], ["leave", "Leave", "Apply and track your leave"]]],
    student: ["Student", [["clock", "Attendance", "You're marked present"], ["cal", "Calendar", "Sports day on Thursday"], ["mega", "Announcements", "1 new notice"]]],
    parent: ["Parent", [["user", "Children", "2 of 2 checked in today"], ["cal", "Events", "RSVP for orientation"], ["mega", "Announcements", "New notice from school"]]],
  };
  const rows = $("#rows");
  const show = key => {
    const [label, items] = ROLES[key];
    $("#role-label").textContent = label;
    rows.innerHTML = items.map(([i, t, s]) => `<div class="row"><svg class="ic"><use href="#i-${i}"/></svg><div><b>${t}</b><small>${s}</small></div></div>`).join("");
    $$(".roles button").forEach(b => b.setAttribute("aria-selected", b.dataset.role === key));
  };
  $$(".roles button").forEach(b => b.onclick = () => show(b.dataset.role));
  show("admin");

  /* ---- scroll progress + install line ---- */
  const steps = $$("#steps li"), line = $("#steps");
  const onScroll = () => {
    const h = document.documentElement;
    $("#progress").style.setProperty("--p", h.scrollTop / (h.scrollHeight - h.clientHeight || 1));
    const r = line.getBoundingClientRect(), f = Math.min(1, Math.max(0, (innerHeight * 0.7 - r.top) / r.height));
    line.style.setProperty("--fill", f);
    steps.forEach((li, i) => li.classList.toggle("on", f > (i + 0.35) / steps.length || (i === 0 && f > 0.02)));
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---- spotlight on cards ---- */
  $$(".card").forEach(c => c.addEventListener("pointermove", e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty("--cx", e.clientX - r.left + "px"); c.style.setProperty("--cy", e.clientY - r.top + "px");
  }));

  if (calm) return;

  /* ---- cursor glow, phone tilt, chip parallax, magnetic buttons ---- */
  const glow = $("#glow"), phone = $("#phone"), stage = $("#stage");
  addEventListener("pointermove", e => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    glow.style.setProperty("--gx", e.clientX + "px"); glow.style.setProperty("--gy", e.clientY + "px");
    const r = stage.getBoundingClientRect(), nx = (e.clientX - (r.left + r.width / 2)) / innerWidth, ny = (e.clientY - (r.top + r.height / 2)) / innerHeight;
    phone.style.setProperty("--ry", nx * 26 + "deg"); phone.style.setProperty("--rx", -ny * 22 + "deg");
    stage.style.setProperty("--mx", nx); stage.style.setProperty("--my", ny);
  });
  $$("[data-magnet]").forEach(b => {
    b.addEventListener("pointermove", e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px,${(e.clientY - r.top - r.height / 2) * .3}px)`; });
    b.addEventListener("pointerleave", () => b.style.transform = "");
  });

  /* ---- living star field: drifting points that connect and bend away from the cursor ---- */
  const cv = $("#space"), g = cv.getContext("2d");
  let W, H, P = [];
  const fit = () => {
    const d = Math.min(devicePixelRatio || 1, 2);
    W = cv.width = innerWidth * d; H = cv.height = innerHeight * d; g.setTransform(d, 0, 0, d, 0, 0);
    P = Array.from({ length: Math.round(Math.min(110, innerWidth / 14)) }, () => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35 }));
  };
  fit(); addEventListener("resize", fit);
  let live = true; document.addEventListener("visibilitychange", () => { live = !document.hidden; if (live) tick(); });
  function tick() {
    if (!live) return;
    g.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of P) {
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
      if (d < 140) { p.x += dx / d * 1.4; p.y += dy / d * 1.4; }
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > innerWidth) p.vx *= -1; if (p.y < 0 || p.y > innerHeight) p.vy *= -1;
    }
    for (let i = 0; i < P.length; i++) {
      const a = P[i]; g.fillStyle = "#9db0ff"; g.globalAlpha = .8; g.fillRect(a.x, a.y, 1.8, 1.8);
      for (let j = i + 1; j < P.length; j++) {
        const b = P[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 120) { g.globalAlpha = (1 - d / 120) * .35; g.strokeStyle = "#26e0d2"; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
      }
    }
    requestAnimationFrame(tick);
  }
  tick();
})();
