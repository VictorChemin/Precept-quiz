export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

export function $$(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}

export function el(tag, attrs = {}, ...children) {
  const elem = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'className') { elem.className = val; }
    else if (key === 'html') { elem.innerHTML = val; }
    else if (key.startsWith('on')) { elem.addEventListener(key.slice(2).toLowerCase(), val); }
    else if (val != null && val !== false) { elem.setAttribute(key, val); }
  }
  for (const child of children) {
    if (typeof child === 'string') { elem.appendChild(document.createTextNode(child)); }
    else if (child instanceof Node) { elem.appendChild(child); }
  }
  return elem;
}

export function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function show(el) { el?.classList.remove('hidden'); }
export function hide(el) { el?.classList.add('hidden'); }
export function toggle(el) { el?.classList.toggle('hidden'); }

export function setHTML(el, html) { if (el) el.innerHTML = html; }
export function setText(el, text) { if (el) el.textContent = text; }

export function fixOrphans(text) {
  if (!text) return text;
  return text.replace(/ ([!?;:])/g, '\u00A0$1');
}

export function downloadFile(filename, content, mimeType = 'application/json') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

export function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
