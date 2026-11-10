(function () {
  "use strict";
  var root = document.documentElement;
  var content = document.querySelector(".content");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function cssVar(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }

  /* ---------- Theme toggle ---------- */
  var themeListeners = [];
  (function () {
    var media = window.matchMedia("(prefers-color-scheme: dark)");
    var button = document.querySelector(".theme-toggle");
    function set(theme) {
      root.setAttribute("data-theme", theme);
      themeListeners.forEach(function (fn) { fn(); });
      if (button) button.setAttribute("aria-label", "Switch to " + (theme === "dark" ? "light" : "dark") + " mode");
    }
    if (button) button.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      set(next);
      // Picking the system's own theme goes back to following the system
      try {
        if (next === (media.matches ? "dark" : "light")) localStorage.removeItem("theme");
        else localStorage.setItem("theme", next);
      } catch (e) {}
    });
    media.addEventListener("change", function (e) {
      var saved = null;
      try { saved = localStorage.getItem("theme"); } catch (e2) {}
      if (!saved) set(e.matches ? "dark" : "light");
    });
  })();

  /* ---------- Home: build the hero from the page's own heading, links and About text ---------- */
  (function () {
    if (!document.body.classList.contains("home") || !content) return;
    var h1 = content.querySelector("h1");
    var projects = document.getElementById("projects");
    if (!h1 || !projects) return;
    var parts = h1.textContent.split("|");
    var name = parts[0].trim(), role = (parts[1] || "").trim();
    var links = h1.nextElementSibling && h1.nextElementSibling.tagName === "P" ? h1.nextElementSibling : null;
    var aboutH = document.getElementById("about-me");
    var about = aboutH && aboutH.nextElementSibling && aboutH.nextElementSibling.tagName === "P" ? aboutH.nextElementSibling : null;

    var hero = el("section", "hero");
    content.insertBefore(hero, h1);
    if (role) hero.appendChild(el("p", "kicker")).textContent = "PORTFOLIO / " + role.toUpperCase();

    h1.className = "hero-name";
    h1.setAttribute("aria-label", name);
    h1.textContent = "";
    var i = 0;
    name.split("").forEach(function (c) {
      var s = el("span", c === " " ? "sp" : "ch");
      s.setAttribute("aria-hidden", "true");
      if (c !== " ") { s.textContent = c; s.style.setProperty("--i", i++); }
      h1.appendChild(s);
    });
    hero.appendChild(h1);

    // Dimension line that reports the name's real width, like a drawing annotation
    var dim = el("div", "dim", "<i></i><span></span><i></i>");
    dim.setAttribute("aria-hidden", "true");
    hero.appendChild(dim);
    function measure() {
      var w = h1.getBoundingClientRect().width;
      dim.style.width = w + "px";
      dim.children[1].textContent = (w * 0.2646).toFixed(2) + " MM";
    }
    measure();
    window.addEventListener("resize", measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    // Typed role line, cycling through the interests named in the About text
    if (role) {
      var words = [role];
      if (about) {
        var m = about.textContent.match(/all things ([^.]+)/i);
        if (m) m[1].split(/,| and /).forEach(function (w) {
          w = w.trim();
          if (w) words.push(w.charAt(0).toUpperCase() + w.slice(1));
        });
      }
      var line = el("p", "hero-role", '<span class="typed"></span><span class="caret"></span>');
      hero.appendChild(line);
      var typed = line.firstChild;
      if (reduced || words.length === 1) typed.textContent = role;
      else {
        var wi = 0, ci = 0, dir = 1;
        (function tick() {
          var word = words[wi];
          ci += dir;
          typed.textContent = word.slice(0, ci);
          var wait = dir > 0 ? 70 : 35;
          if (dir > 0 && ci === word.length) { dir = -1; wait = 1700; }
          else if (dir < 0 && ci === 0) { dir = 1; wi = (wi + 1) % words.length; wait = 300; }
          setTimeout(tick, wait);
        })();
      }
    }
    if (about) { about.className = "hero-about"; hero.appendChild(about); aboutH.remove(); }
    if (links) { links.classList.add("hero-links"); hero.appendChild(links); }

    var hint = el("a", "scroll-hint",
      '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="4"><circle cx="32" cy="32" r="14"/><path d="M32 6v10M32 48v10M6 32h10M48 32h10M13.600 13.600l7.100 7.100M43.300 43.300l7.100 7.100M50.400 13.600l-7.100 7.100M20.700 43.300l-7.100 7.100"/></svg>' +
      "SCROLL TO DRIVE THE GEAR TRAIN");
    hint.href = "#projects";
    hero.appendChild(hint);

    // Ticker of the topics the projects cover
    var topics = ["Robotics", "Racing", "Automation", "Parametric CAD", "CFD", "Stress analysis", "Inverse kinematics", "3D printing", "Controls"];
    var ticker = el("div", "ticker"), run = el("div");
    ticker.setAttribute("aria-hidden", "true");
    for (var r = 0; r < 4; r++) topics.forEach(function (t) { run.appendChild(el("span")).textContent = t; });
    ticker.appendChild(run);
    content.insertBefore(ticker, projects);

    // Project cards: grid, index numbers, whole card clickable
    var cards = Array.prototype.slice.call(content.querySelectorAll(".proj"));
    if (cards.length) {
      projects.appendChild(el("span", "count")).textContent = ("0" + cards.length).slice(-2) + " FILES";
      var grid = el("div", "proj-grid");
      cards[0].parentNode.insertBefore(grid, cards[0]);
      cards.forEach(function (card, n) {
        grid.appendChild(card);
        card.appendChild(el("span", "proj-index", "<b>" + ("0" + (n + 1)).slice(-2) + "</b>/" + ("0" + cards.length).slice(-2)));
        card.classList.add("reveal");
        card.style.setProperty("--d", (n % 2) * 90 + "ms");
        var link = card.querySelector("a[href]");
        if (link) card.addEventListener("click", function (e) {
          if (!e.target.closest("a")) window.location.href = link.href;
        });
      });
    }
  })();

  /* ---------- 3D tilt + cursor glow on project cards ---------- */
  if (finePointer && !reduced) {
    document.querySelectorAll(".proj").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", x * 100 + "%");
        card.style.setProperty("--my", y * 100 + "%");
        card.style.setProperty("--ry", (x - 0.5) * 12 + "deg");
        card.style.setProperty("--rx", (0.5 - y) * 12 + "deg");
      });
      card.addEventListener("mouseleave", function () {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* ---------- Mobile carousel for rows of images (video rows keep stacking) ---------- */
  document.querySelectorAll(".content div").forEach(function (row) {
    var cards = Array.prototype.filter.call(row.children, function (c) { return c.classList.contains("card"); });
    if (cards.length < 2 || cards.length !== row.children.length) return;
    if (row.querySelector("video")) return;
    var wrap = el("div", "carousel");
    row.parentNode.insertBefore(wrap, row);
    wrap.appendChild(row);
    row.classList.add("carousel-track");
    var nav = el("div", "carousel-nav", '<button type="button" aria-label="Previous image">&lsaquo;</button><span></span><button type="button" aria-label="Next image">&rsaquo;</button>');
    wrap.appendChild(nav);
    var prev = nav.children[0], count = nav.children[1], next = nav.children[2];
    function update() {
      var i = Math.round(row.scrollLeft / Math.max(row.clientWidth, 1));
      count.textContent = (i + 1) + " / " + cards.length;
      prev.disabled = i === 0;
      next.disabled = i === cards.length - 1;
    }
    prev.addEventListener("click", function () { row.scrollBy({ left: -row.clientWidth, behavior: "smooth" }); });
    next.addEventListener("click", function () { row.scrollBy({ left: row.clientWidth, behavior: "smooth" }); });
    row.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  });

  /* ---------- Scroll reveal ---------- */
  (function () {
    document.querySelectorAll(".project .content .card, .project .content h2").forEach(function (e) { e.classList.add("reveal"); });
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || reduced) {
      items.forEach(function (e) { e.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (e) { io.observe(e); });
  })();

  /* ---------- Lightbox for project images ---------- */
  (function () {
    var imgs = Array.prototype.slice.call(document.querySelectorAll(".project .content .card img"));
    if (!imgs.length) return;
    var box = el("div", "lightbox",
      '<button class="lb-close" type="button" aria-label="Close">&times;</button>' +
      '<button class="lb-prev" type="button" aria-label="Previous image">&lsaquo;</button>' +
      '<img alt=""><p></p>' +
      '<button class="lb-next" type="button" aria-label="Next image">&rsaquo;</button>');
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    document.body.appendChild(box);
    var big = box.querySelector("img"), cap = box.querySelector("p"), at = 0;
    function show(i) {
      at = (i + imgs.length) % imgs.length;
      var src = imgs[at], label = src.parentNode.querySelector("p");
      big.src = src.currentSrc || src.src;
      cap.textContent = (label ? label.textContent + "  ·  " : "") + (at + 1) + " / " + imgs.length;
      box.classList.add("open");
    }
    function close() { box.classList.remove("open"); }
    imgs.forEach(function (img, i) { img.addEventListener("click", function () { show(i); }); });
    box.addEventListener("click", function (e) { if (e.target === box || e.target === big) close(); });
    box.querySelector(".lb-close").addEventListener("click", close);
    box.querySelector(".lb-prev").addEventListener("click", function () { show(at - 1); });
    box.querySelector(".lb-next").addEventListener("click", function () { show(at + 1); });
    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(at - 1);
      else if (e.key === "ArrowRight") show(at + 1);
    });
  })();

  /* ---------- Project page: dimension label under the title ---------- */
  (function () {
    var h = document.querySelector(".page-hero h1"), dim = document.querySelector(".page-hero .dim");
    if (!h || !dim) return;
    function measure() {
      var w = h.getBoundingClientRect().width;
      dim.style.width = Math.min(w, content.clientWidth - 40) + "px";
      dim.style.maxWidth = "none";
      dim.children[1].textContent = (w * 0.2646).toFixed(2) + " MM";
    }
    measure();
    window.addEventListener("resize", measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  })();

  /* ---------- HUD: scroll progress, cursor coordinates, CAD crosshair ---------- */
  var scrollY = window.scrollY, mouse = { x: 0.5, y: 0.5 };
  function onScroll() {
    scrollY = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    root.style.setProperty("--scroll", max > 0 ? Math.min(scrollY / max, 1) : 0);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (finePointer) {
    var hx = document.getElementById("hud-x"), hy = document.getElementById("hud-y");
    var lx = document.querySelector(".crosshair-x"), ly = document.querySelector(".crosshair-y");
    var pending = null;
    window.addEventListener("mousemove", function (e) {
      pending = e;
      mouse.x = e.clientX / window.innerWidth;
      mouse.y = e.clientY / window.innerHeight;
      root.classList.add("mouse");
    }, { passive: true });
    document.addEventListener("mouseleave", function () { root.classList.remove("mouse"); });
    (function frame() {
      if (pending) {
        var e = pending; pending = null;
        if (lx) lx.style.transform = "translateY(" + e.clientY + "px)";
        if (ly) ly.style.transform = "translateX(" + e.clientX + "px)";
        if (hx) hx.textContent = ("000" + (e.clientX * 0.2646).toFixed(1)).slice(-6);
        if (hy) hy.textContent = ("000" + ((e.clientY + scrollY) * 0.2646).toFixed(1)).slice(-6);
      }
      requestAnimationFrame(frame);
    })();
  }

  /* ---------- Background gear train: idles slowly, and scrolling drives it ---------- */
  (function () {
    var canvas = document.getElementById("gears");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d"), W = 0, H = 0, dpr = 1, trains = [], color = "";

    function gearPath(N, m) {
      var p = new Path2D(), pitch = (2 * Math.PI) / N, r = (N * m) / 2, ra = r + m, rr = r - 1.25 * m;
      for (var k = 0; k < N; k++) {
        var a = k * pitch;
        p.arc(0, 0, rr, a - 0.75 * pitch, a - 0.25 * pitch);              // root land before this tooth
        p.lineTo(ra * Math.cos(a - 0.12 * pitch), ra * Math.sin(a - 0.12 * pitch));
        p.arc(0, 0, ra, a - 0.12 * pitch, a + 0.12 * pitch);               // tooth tip
        p.lineTo(rr * Math.cos(a + 0.25 * pitch), rr * Math.sin(a + 0.25 * pitch));
      }
      p.closePath();
      var hub = Math.max(rr * 0.2, m * 1.6);
      p.moveTo(hub, 0); p.arc(0, 0, hub, 0, 2 * Math.PI);
      p.moveTo(hub * 0.45, 0); p.arc(0, 0, hub * 0.45, 0, 2 * Math.PI);
      if (N >= 18) {                                                       // lightening holes
        var n = N >= 30 ? 6 : 5, hr = rr * 0.2, hd = rr * 0.6;
        for (var j = 0; j < n; j++) {
          var b = (j * 2 * Math.PI) / n, cx = hd * Math.cos(b), cy = hd * Math.sin(b);
          p.moveTo(cx + hr, cy); p.arc(cx, cy, hr, 0, 2 * Math.PI);
        }
      }
      return { path: p, r: r, N: N };
    }
    // A train is a root gear plus children that mesh with their parent at a given angle
    function train(x, y, m, dir, spec) {
      var gears = [];
      spec.forEach(function (s) {
        var g = gearPath(s.N, m);
        g.parent = s.parent == null ? null : gears[s.parent];
        g.phi = ((s.angle || 0) * Math.PI) / 180;
        if (g.parent) {
          g.x = g.parent.x + (g.parent.r + g.r) * Math.cos(g.phi);
          g.y = g.parent.y + (g.parent.r + g.r) * Math.sin(g.phi);
        } else { g.x = x; g.y = y; }
        gears.push(g);
      });
      return { gears: gears, dir: dir };
    }
    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      // Keep the two trains in opposite corners; phones get just one, smaller
      var small = W < 760, m = small ? 6 : Math.max(8, Math.min(Math.min(W, H) / 88, 13));
      trains = [
        train(W - m * 6, H - m * 3, m, 1, [
          { N: 44 }, { N: 16, parent: 0, angle: 207 }, { N: 28, parent: 1, angle: 262 }, { N: 12, parent: 2, angle: 195 }, { N: 20, parent: 2, angle: 318 }
        ])
      ];
      if (!small) trains.push(train(m * 3, m * 14, m, -1, [
        { N: 34 }, { N: 13, parent: 0, angle: 12 }, { N: 22, parent: 1, angle: 74 }
      ]));
    }
    function readColor() { color = cssVar("--gear") || "rgba(0,229,255,.16)"; }
    themeListeners.push(function () { readColor(); if (reduced) draw(0); });

    function draw(t) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      var base = t * 0.00012 + scrollY * 0.0035;
      trains.forEach(function (tr, ti) {
        var ox = (0.5 - mouse.x) * 26 * (ti ? -1 : 1), oy = (0.5 - mouse.y) * 26 * (ti ? -1 : 1);
        tr.gears.forEach(function (g) {
          // parent tooth centred at the contact point must meet a gap on the child
          g.theta = g.parent
            ? g.phi + Math.PI - Math.PI / g.N + ((g.phi - g.parent.theta) * g.parent.N) / g.N
            : base * tr.dir;
          ctx.save();
          ctx.translate(g.x + ox, g.y + oy);
          ctx.rotate(g.theta);
          ctx.stroke(g.path);
          ctx.restore();
          // pitch circle and centre mark, drawn as dashed centrelines
          ctx.save();
          ctx.translate(g.x + ox, g.y + oy);
          ctx.setLineDash([10, 4, 2, 4]);
          ctx.globalAlpha = 0.55;
          ctx.beginPath();
          ctx.arc(0, 0, g.r, 0, 2 * Math.PI);
          ctx.moveTo(-g.r - 14, 0); ctx.lineTo(g.r + 14, 0);
          ctx.moveTo(0, -g.r - 14); ctx.lineTo(0, g.r + 14);
          ctx.stroke();
          ctx.restore();
        });
      });
    }
    build(); readColor();
    window.addEventListener("resize", function () { build(); if (reduced) draw(0); });
    if (reduced) { draw(0); window.addEventListener("scroll", function () { draw(0); }, { passive: true }); return; }
    (function loop(t) {
      if (!document.hidden) draw(t);
      requestAnimationFrame(loop);
    })(0);
  })();

  /* ---------- Weld sparks on click ---------- */
  (function () {
    var canvas = document.getElementById("sparks");
    if (!canvas || !canvas.getContext || reduced || !finePointer) return;
    var ctx = canvas.getContext("2d"), parts = [], running = false, dpr = 1;
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr; canvas.height = window.innerHeight * dpr;
    }
    size();
    window.addEventListener("resize", size);
    function loop() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      parts = parts.filter(function (p) { return p.life > 0; });
      parts.forEach(function (p) {
        var px = p.x, py = p.y;
        p.vy += 0.32; p.vx *= 0.985;
        p.x += p.vx; p.y += p.vy; p.life -= 1;
        ctx.globalAlpha = Math.max(p.life / p.max, 0);
        ctx.strokeStyle = p.c; ctx.lineWidth = p.w; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(p.x, p.y); ctx.stroke();
      });
      ctx.globalAlpha = 1;
      if (parts.length) requestAnimationFrame(loop); else running = false;
    }
    window.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse") return;
      var colors = [cssVar("--accent2") || "#ff7a1a", "#ffd166", cssVar("--accent") || "#00e5ff"];
      for (var i = 0; i < 18; i++) {
        var a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 7, life = 22 + Math.random() * 24;
        parts.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 3, life: life, max: life, c: colors[i % 3], w: 1 + Math.random() * 1.6 });
      }
      if (!running) { running = true; requestAnimationFrame(loop); }
    });
  })();
})();
