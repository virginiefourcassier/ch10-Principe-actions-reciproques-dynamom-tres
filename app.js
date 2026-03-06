(() => {
  "use strict";

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");

  const handL = document.getElementById("handL");
  const handR = document.getElementById("handR");

  const W = canvas.width;
  const H = canvas.height;

  // Contraintes de déplacement
  const minVzdalenost = 308;
  const maxVzdalenost = minVzdalenost + 200;

  const vlevo = 20;
  const vpravo = W - 20;
  const nahore = 20;
  const dole = H - 60;

  // Images
  const scaleImg = new Image();
  scaleImg.src = "scale_center.png";

  // Poignées : rapprochées au départ pour cacher complètement la bande graduée
  const p1 = { x: 150, y: 200 };
  const p2 = { x: 490, y: 200 };

  let drag = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  // Réglages visuels
  const handleRadius = 20;
  const bodyLength = 122;
  const bodyHeight = 28;
  const scaleDrawWidth = 238;

  // Décalages entre poignées et anneaux
  const sideRingOffset = 18;

  // Au départ, la bande doit être totalement masquée par les deux corps noirs :
  // on choisit un recouvrement suffisant.
  const bodyGapFromScale = -10;

  // Points d’ancrage des mains
  const leftHandAnchor = { x: 198, y: 192 };
  const rightHandAnchor = { x: 18, y: 128 };

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function dist(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
  }

  function getMouse(evt) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (evt.clientX - r.left) * (canvas.width / r.width),
      y: (evt.clientY - r.top) * (canvas.height / r.height),
    };
  }

  function hitHandle(mx, my, p, r = 23) {
    return dist(mx, my, p.x, p.y) <= r;
  }

  function angleBetween(a, b) {
    return Math.atan2(b.y - a.y, b.x - a.x);
  }

  function enforceLeftDrag() {
    const d = dist(p1.x, p1.y, p2.x, p2.y);
    const a = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    if (d < minVzdalenost) {
      p1.x = p2.x - Math.cos(a) * minVzdalenost;
      p1.y = p2.y - Math.sin(a) * minVzdalenost;
    }
    if (d > maxVzdalenost) {
      p1.x = p2.x - Math.cos(a) * maxVzdalenost;
      p1.y = p2.y - Math.sin(a) * maxVzdalenost;
    }

    p1.x = clamp(p1.x, vlevo, vpravo);
    p1.y = clamp(p1.y, nahore, dole);
  }

  function enforceRightDrag() {
    const d = dist(p1.x, p1.y, p2.x, p2.y);
    const a = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    if (d < minVzdalenost) {
      p2.x = p1.x + Math.cos(a) * minVzdalenost;
      p2.y = p1.y + Math.sin(a) * minVzdalenost;
    }
    if (d > maxVzdalenost) {
      p2.x = p1.x + Math.cos(a) * maxVzdalenost;
      p2.y = p1.y + Math.sin(a) * maxVzdalenost;
    }

    p2.x = clamp(p2.x, vlevo, vpravo);
    p2.y = clamp(p2.y, nahore, dole);
  }

  canvas.addEventListener("mousedown", (evt) => {
    const m = getMouse(evt);

    if (hitHandle(m.x, m.y, p1)) {
      drag = "left";
      dragOffsetX = m.x - p1.x;
      dragOffsetY = m.y - p1.y;
      return;
    }

    if (hitHandle(m.x, m.y, p2)) {
      drag = "right";
      dragOffsetX = m.x - p2.x;
      dragOffsetY = m.y - p2.y;
    }
  });

  canvas.addEventListener("mousemove", (evt) => {
    const m = getMouse(evt);

    if (!drag) {
      const overLeft = hitHandle(m.x, m.y, p1);
      const overRight = hitHandle(m.x, m.y, p2);
      canvas.style.cursor = (overLeft || overRight) ? "pointer" : "default";
      return;
    }

    if (drag === "left") {
      p1.x = clamp(m.x - dragOffsetX, vlevo, vpravo);
      p1.y = clamp(m.y - dragOffsetY, nahore, dole);
      enforceLeftDrag();
    }

    if (drag === "right") {
      p2.x = clamp(m.x - dragOffsetX, vlevo, vpravo);
      p2.y = clamp(m.y - dragOffsetY, nahore, dole);
      enforceRightDrag();
    }
  });

  window.addEventListener("mouseup", () => {
    drag = null;
  });

  function drawPastille(x, y, colorA, colorB, stroke) {
    const g = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, 22);
    g.addColorStop(0, colorA);
    g.addColorStop(1, colorB);

    ctx.beginPath();
    ctx.arc(x, y, handleRadius, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    ctx.lineWidth = 3.5;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }

  function drawSideRing(x, y, angle, side) {
    const dir = side === "left" ? 1 : -1;
    const rx = x + Math.cos(angle) * sideRingOffset * dir;
    const ry = y + Math.sin(angle) * sideRingOffset * dir;

    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(angle);

    const grad = ctx.createLinearGradient(-14, 0, 14, 0);
    grad.addColorStop(0, "#5b5b5b");
    grad.addColorStop(0.22, "#dddddd");
    grad.addColorStop(0.5, "#ffffff");
    grad.addColorStop(0.78, "#a9a9a9");
    grad.addColorStop(1, "#595959");

    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = "#555";
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#f1f1f1";
    ctx.fill();
    ctx.strokeStyle = "#8d8d8d";
    ctx.stroke();

    ctx.restore();
  }

  function drawBody(cx, cy, angle, label) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const w = bodyLength;
    const h = bodyHeight;

    const bodyGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    bodyGrad.addColorStop(0, "#111");
    bodyGrad.addColorStop(0.2, "#7f7f7f");
    bodyGrad.addColorStop(0.45, "#4a4a4a");
    bodyGrad.addColorStop(0.72, "#202020");
    bodyGrad.addColorStop(1, "#080808");

    ctx.fillStyle = bodyGrad;
    ctx.fillRect(-w / 2, -h / 2, w, h);

    ctx.fillStyle = "#4f4f4f";
    ctx.fillRect(-w / 2 - 4, -17, 8, 34);
    ctx.fillRect(w / 2 - 4, -17, 8, 34);

    ctx.strokeStyle = "#1b1b1b";
    ctx.lineWidth = 1;
    ctx.strokeRect(-w / 2, -h / 2, w, h);

    ctx.fillStyle = "#efefef";
    ctx.font = "bold 15px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 0, 0);

    ctx.restore();
  }

  function drawCenterScale(angle, centerX, centerY) {
    if (!scaleImg.complete || !scaleImg.naturalWidth) return;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);

    const drawW = scaleDrawWidth;
    const drawH = Math.round(scaleImg.naturalHeight * (drawW / scaleImg.naturalWidth));

    ctx.drawImage(
      scaleImg,
      -drawW / 2,
      -drawH / 2,
      drawW,
      drawH
    );

    ctx.restore();
  }

  function updateHands(angle) {
    handL.style.transformOrigin = `${leftHandAnchor.x}px ${leftHandAnchor.y}px`;
    handR.style.transformOrigin = `${rightHandAnchor.x}px ${rightHandAnchor.y}px`;

    handL.style.left = `${p1.x - leftHandAnchor.x}px`;
    handL.style.top = `${p1.y - leftHandAnchor.y}px`;
    handL.style.transform = `rotate(${angle}rad)`;

    handR.style.left = `${p2.x - rightHandAnchor.x}px`;
    handR.style.top = `${p2.y - rightHandAnchor.y}px`;
    handR.style.transform = `rotate(${angle}rad)`;
  }

  function drawScene() {
    ctx.clearRect(0, 0, W, H);

    const a = angleBetween(p1, p2);

    const centerX = (p1.x + p2.x) / 2;
    const centerY = (p1.y + p2.y) / 2;

    // Corps noirs rapprochés pour masquer complètement la bande au départ
    const leftBodyCenter = {
      x: centerX - Math.cos(a) * (scaleDrawWidth / 2 - bodyLength / 2 + bodyGapFromScale),
      y: centerY - Math.sin(a) * (scaleDrawWidth / 2 - bodyLength / 2 + bodyGapFromScale)
    };

    const rightBodyCenter = {
      x: centerX + Math.cos(a) * (scaleDrawWidth / 2 - bodyLength / 2 + bodyGapFromScale),
      y: centerY + Math.sin(a) * (scaleDrawWidth / 2 - bodyLength / 2 + bodyGapFromScale)
    };

    // Bande centrale derrière les corps
    drawCenterScale(a, centerX, centerY);

    // Corps noirs devant, pour cacher la bande au repos
    drawBody(leftBodyCenter.x, leftBodyCenter.y, a, "10 N");
    drawBody(rightBodyCenter.x, rightBodyCenter.y, a, "10 N");

    drawSideRing(p1.x, p1.y, a, "left");
    drawSideRing(p2.x, p2.y, a, "right");

    drawPastille(p1.x, p1.y, "#ffd8d8", "#ff2323", "#ff3434");
    drawPastille(p2.x, p2.y, "#dff3ff", "#2233ff", "#1b93ff");

    updateHands(a);

    requestAnimationFrame(drawScene);
  }

  function start() {
    drawScene();
  }

  if (scaleImg.complete) {
    start();
  } else {
    scaleImg.onload = start;
    scaleImg.onerror = start;
  }
})();
