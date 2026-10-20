const $ = (id) => document.getElementById(id);
const layers = [
  { key: "idle", audio: $("idleAudio"), name: "Idle", rpm: 850 },
  { key: "low", audio: $("lowAudio"), name: "Low RPM", rpm: 1400 },
  { key: "mid", audio: $("midAudio"), name: "Mid RPM", rpm: 2400 },
  { key: "high", audio: $("highAudio"), name: "High RPM", rpm: 3600 }
];
const fileInputs = [
  ["idleFile", "idleAudio"], ["lowFile", "lowAudio"], ["midFile", "midAudio"],
  ["highFile", "highAudio"], ["startFile", "startAudio"]
];
let engineOn = false, sensorOn = false, lastMagnitude = null, motion = 0, filteredMotion = 0;
let virtualRpm = 0, currentLayer = -1, raf = null, lastFrame = 0;
let audioReady = false;
const sensitivity = () => Number($("sensitivity").value);
const volume = () => Number($("volume").value) / 100;

fileInputs.forEach(([inputId, audioId]) => {
  $(inputId).addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const audio = $(audioId);
    if (audio.dataset.objectUrl) URL.revokeObjectURL(audio.dataset.objectUrl);
    const url = URL.createObjectURL(file);
    audio.src = url;
    audio.dataset.objectUrl = url;
    audio.load();
    event.target.parentElement.style.color = "#a3ff6b";
  });
});

$("sensitivity").addEventListener("input", () => {
  const v = sensitivity();
  $("sensitivityLabel").textContent = v <= 3 ? "High" : v <= 7 ? "Medium" : "Low";
});
$("volume").addEventListener("input", () => $("volumeLabel").textContent = `${$("volume").value}%`);

function setStatus(text, on = false) {
  $("statusText").textContent = text;
  $("statusDot").classList.toggle("on", on);
}
function availableLayers() {
  return layers.map((l, i) => ({...l, i})).filter(l => l.audio.src);
}
function stopLayer(layer) {
  if (!layer) return;
  layer.audio.pause();
  try { layer.audio.currentTime = 0; } catch (_) {}
  layer.audio.volume = 0;
}
async function playLayer(index) {
  const layer = layers[index];
  if (!layer || !layer.audio.src) return;
  if (currentLayer === index && !layer.audio.paused) return;
  const old = currentLayer >= 0 ? layers[currentLayer] : null;
  currentLayer = index;
  layer.audio.loop = true;
  layer.audio.volume = 0;
  try {
    await layer.audio.play();
    const start = performance.now();
    const duration = 280;
    function fade(now) {
      const t = Math.min(1, (now - start) / duration);
      layer.audio.volume = Math.min(volume(), volume() * t);
      if (old && old !== layer) old.audio.volume = Math.max(0, volume() * (1 - t));
      if (t < 1) requestAnimationFrame(fade);
      else if (old && old !== layer) old.audio.pause();
    }
    requestAnimationFrame(fade);
  } catch (err) {
    currentLayer = -1;
    setStatus("TAP START TO ALLOW AUDIO", false);
  }
}
function chooseLayer(rpm) {
  if (rpm < 1200) return 0;
  if (rpm < 2000) return 1;
  if (rpm < 3000) return 2;
  return 3;
}
function updateDashboard() {
  const shown = engineOn ? Math.round(virtualRpm) : 0;
  $("rpm").textContent = shown.toLocaleString();
  $("rpmBand").textContent = !engineOn ? "OFF" : shown < 1200 ? "IDLE" : shown < 2000 ? "LOW" : shown < 3000 ? "MID" : "HIGH";
  $("meterFill").style.width = `${Math.max(0, Math.min(100, (shown / 4200) * 100))}%`;
  $("motionValue").textContent = filteredMotion.toFixed(2);
  $("layerName").textContent = engineOn ? layers[chooseLayer(virtualRpm)].name : "None";
}
function tick(now) {
  if (!engineOn) return;
  const dt = Math.min(0.05, (now - (lastFrame || now)) / 1000);
  lastFrame = now;
  // Motion is a relative movement score, not measured wheel speed.
  const targetRpm = 850 + Math.min(3000, filteredMotion * (520 / (sensitivity() / 5)));
  const rate = targetRpm > virtualRpm ? 2.6 : 1.15;
  virtualRpm += (targetRpm - virtualRpm) * Math.min(1, dt * rate);
  virtualRpm = Math.max(850, Math.min(3850, virtualRpm));
  const desired = chooseLayer(virtualRpm);
  if (desired !== currentLayer) playLayer(desired);
  layers.forEach(l => { if (!l.audio.paused) l.audio.volume = volume() * (l === layers[currentLayer] ? 1 : 0); });
  updateDashboard();
  raf = requestAnimationFrame(tick);
}
async function startEngine() {
  engineOn = true;
  virtualRpm = 850;
  $("startBtn").disabled = true;
  $("stopBtn").disabled = false;
  setStatus("ENGINE RUNNING", true);
  if ($("startAudio").src) {
    try { $("startAudio").currentTime = 0; $("startAudio").volume = volume(); await $("startAudio").play(); } catch (_) {}
  }
  const first = layers.findIndex(l => l.audio.src);
  if (first >= 0) {
    currentLayer = -1;
    await playLayer(0);
  } else {
    setStatus("LOAD DIESEL AUDIO FILES", true);
  }
  lastFrame = 0;
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(tick);
  updateDashboard();
}
function stopEngine() {
  engineOn = false;
  cancelAnimationFrame(raf);
  layers.forEach(stopLayer);
  currentLayer = -1;
  if ($("startAudio").src) { $("startAudio").pause(); try {$("startAudio").currentTime = 0;} catch (_) {} }
  virtualRpm = 0;
  $("startBtn").disabled = false;
  $("stopBtn").disabled = true;
  setStatus("ENGINE OFF", false);
  updateDashboard();
}
$("startBtn").addEventListener("click", startEngine);
$("stopBtn").addEventListener("click", stopEngine);

async function enableMotion() {
  if (!("DeviceMotionEvent" in window)) {
    $("motionStatus").textContent = "NO MOTION API";
    setStatus("SENSOR NOT SUPPORTED");
    return;
  }
  try {
    if (typeof DeviceMotionEvent.requestPermission === "function") {
      const permission = await DeviceMotionEvent.requestPermission();
      if (permission !== "granted") throw new Error("Motion permission denied");
    }
    window.addEventListener("devicemotion", onMotion, {passive:true});
    sensorOn = true;
    $("sensorBtn").textContent = "Motion sensor enabled";
    $("sensorBtn").disabled = true;
    $("motionStatus").textContent = "SENSOR ACTIVE";
  } catch (err) {
    $("motionStatus").textContent = "SENSOR PERMISSION NEEDED";
    alert("Motion sensor permission was not granted. Open this page over HTTPS in Chrome and try again.");
  }
}
function onMotion(event) {
  const a = event.accelerationIncludingGravity || event.acceleration;
  if (!a || a.x == null || a.y == null || a.z == null) return;
  const magnitude = Math.sqrt(a.x*a.x + a.y*a.y + a.z*a.z);
  if (lastMagnitude !== null) {
    const delta = Math.abs(magnitude - lastMagnitude);
    // Ignore tiny sensor noise; sensitivity changes the detection threshold.
    const threshold = 0.035 + (10 - sensitivity()) * 0.012;
    const detected = Math.max(0, delta - threshold) * 18;
    motion = Math.min(6, detected);
    filteredMotion = filteredMotion * 0.82 + motion * 0.18;
    if (filteredMotion < 0.025) filteredMotion = 0;
  }
  lastMagnitude = magnitude;
  if (!engineOn && filteredMotion > 0.1) {
    // Do not auto-start the engine: user must press START.
  }
}
$("sensorBtn").addEventListener("click", enableMotion);
updateDashboard();