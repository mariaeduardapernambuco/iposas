'use strict';

/* ========== Configuração ========== */
const WEDDING_DATE = '2026-11-26T12:30:00-03:00';
const PIX_KEY = '+5581997686460';
const COUNTDOWN_LABELS = ['dias', 'horas', 'minutos', 'segundos'];

const GIFTS = [
  { title: 'Abasteça nossa adega',             category: 'Lua de mel',   price: 50,  image: 'assets/presente-adega.webp' },
  { title: 'Café da manhã bonito',             category: 'Lua de mel',   price: 100, image: 'assets/presente-cafe.webp' },
  { title: 'Jantar à luz de velas',            category: 'Lua de mel',   price: 200, image: 'assets/presente-jantar.webp' },
  { title: 'Prioridade no quarto de hóspedes', category: 'Brincadeiras', price: 250, image: 'assets/presente-quarto.webp' },
  { title: 'SPA para as noivas', category: 'Carinho para as noivas', price: 400, image: 'assets/spa.webp', cardLinks: [{ label: 'R$ 400 ↗', url: 'https://pag.ae/82i6XhqVp' }] }
];
const DEFAULT_CARD_LINKS = [
  { label: 'R$ 50 ↗', url: 'https://pag.ae/82hdM58jp' },
  { label: 'R$ 100 ↗', url: 'https://pag.ae/82hdWCx7J' },
  { label: 'R$ 200 ↗', url: 'https://pag.ae/82he6LjQp' }
];

/* ========== Utilidades ========== */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const brl = value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

let toastTimer;
function toast(message) {
  const el = $('.toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 5500);
}

/* ========== Contagem regressiva ========== */
function tickCountdown() {
  const timer = $('#countdown');
  const delta = Math.max(0, new Date(WEDDING_DATE) - Date.now());
  const values = [
    Math.floor(delta / 86400000),
    Math.floor(delta / 3600000) % 24,
    Math.floor(delta / 60000) % 60,
    Math.floor(delta / 1000) % 60
  ];

  timer.setAttribute('aria-label', delta
    ? values.map((n, i) => `${n} ${COUNTDOWN_LABELS[i]}`).join(', ')
    : 'Chegou o grande dia!');

  $$('.time-number', timer).forEach((el, i) => {
    const next = String(values[i]).padStart(2, '0');
    if (el.textContent === next) return;
    el.textContent = next;
    const card = el.parentElement;
    card.classList.remove('changed');
    void card.offsetWidth; // reinicia a animação
    card.classList.add('changed');
  });
}

/* ========== Menu ========== */
function setupMenu() {
  const nav = $('nav');
  const toggle = $('.menu-toggle');
  const setOpen = open => {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
  };
  toggle.onclick = () => setOpen(!nav.classList.contains('open'));
  $$('nav a').forEach(a => { a.onclick = () => setOpen(false); });
}

/* ========== Presentes ========== */
function renderGifts() {
  const root = $('#gift-grid');
  root.replaceChildren();
  GIFTS.forEach(gift => {
    const card = document.createElement('article');
    card.className = 'gift';
    card.innerHTML = `
      <img loading="lazy" src="${gift.image}" alt="${gift.title}">
      <div class="gift-body">
        <small>${gift.category}</small>
        <h3>${gift.title}</h3>
        <div class="gift-bottom">
          <span>${`A partir de ${brl(gift.price)}`}</span>
          <button class="btn" type="button">Presentear ↗</button>
        </div>
      </div>`;
    $('button', card).onclick = () => openGift(gift);
    root.append(card);
  });
}

function openGift(gift) {
  const minimum = gift.price || 50;
  const amount = $('#gift-amount');

  $('#gift-title').textContent = gift.title;
  $('#gift-price').textContent = gift.price
    ? `Um carinho a partir de ${brl(minimum)}. Você pode oferecer mais.`
    : 'Escolha um valor para fazer parte dessa memória.';

  amount.min = minimum;
  amount.value = gift.price || '';
  amount.placeholder = brl(minimum);

  const cardLinks = gift.cardLinks || DEFAULT_CARD_LINKS;
  const cardLinkRoot = $('.card-links');
  cardLinkRoot.replaceChildren(...cardLinks.map(link => {
    const anchor = document.createElement('a');
    anchor.className = 'btn outline';
    anchor.href = link.url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.textContent = link.label;
    return anchor;
  }));

  const choices = [minimum, minimum + 50, minimum + 100, minimum + 200];
  $$('[data-amount]').forEach((button, i) => {
    button.dataset.amount = choices[i];
    button.textContent = brl(choices[i]);
  });

  amount.dispatchEvent(new Event('input'));
  $('#checkout').showModal();
}

function updatePixInstruction() {
  const value = Number($('#gift-amount').value);
  const amountText = value > 0
    ? `No aplicativo do banco, informe ${brl(value)}. `
    : 'No aplicativo do banco, informe o valor que desejar. ';
  $('#pix-instruction').textContent = amountText +
    'Escaneie ou importe o QR Code e confira o nome de Rafaela antes de concluir. O site não confirma o pagamento automaticamente.';
}

function setupGifts() {
  renderGifts();

  $('#free-gift').onclick = () => openGift({ title: 'Um presente de valor livre', price: null });
  $('#gift-amount').oninput = updatePixInstruction;
  $('#gift-form').onsubmit = e => e.preventDefault();

  $$('[data-amount]').forEach(button => {
    button.onclick = () => {
      $('#gift-amount').value = button.dataset.amount;
      $('#gift-amount').dispatchEvent(new Event('input'));
    };
  });

  $('#copy-pix').onclick = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      toast('Chave PIX copiada!');
    } catch {
      toast('Copie a chave PIX: ' + PIX_KEY);
    }
  };
}

/* ========== Diálogos e fotos ========== */
function setupDialogs() {
  $$('dialog .close').forEach(button => {
    button.onclick = () => button.closest('dialog').close();
  });

  $$('.photo').forEach(photo => {
    const img = photo.tagName === 'IMG' ? photo : $('img', photo);
    photo.onclick = () => {
      $('#lightbox img').src = img.src;
      $('#lightbox img').alt = img.alt;
      $('#lightbox').showModal();
    };
  });
}

/* ========== Formulários (FormSubmit) ========== */
const SUBMIT_LABELS = {
  'rsvp-form': 'Enviar confirmação ↗',
  'guest-form': 'Deixar meu recado ♡'
};

function setupForms() {
  Object.keys(SUBMIT_LABELS).forEach(id => {
    const form = document.getElementById(id);
    const button = $('button', form);
    const feedback = $('.form-feedback', form);
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (feedback) {
        feedback.hidden = true;
        feedback.textContent = '';
      }
      button.disabled = true;
      button.textContent = 'Enviando…';
      try {
        const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent('rafaetham@gmail.com')}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(form)))
        });
        const result = await response.json();
        if (!response.ok || ![true, 'true'].includes(result.success)) throw new Error('Formulário não aceito');
        const message = id === 'rsvp-form'
          ? 'Confirmação enviada com sucesso. Obrigadas pelo carinho!'
          : 'Recado enviado com sucesso. Obrigadas pelo carinho!';
        if (feedback) feedback.textContent = message;
        form.reset();
        toast(message);
      } catch {
        const message = 'Não foi possível enviar agora. Verifique sua conexão e tente novamente.';
        if (feedback) feedback.textContent = message;
        toast(message);
      } finally {
        if (feedback) feedback.hidden = false;
        button.disabled = false;
        button.textContent = SUBMIT_LABELS[id];
      }
    });
  });
}

/* ========== Inicialização ========== */
tickCountdown();
setInterval(tickCountdown, 1000);
setupMenu();
setupGifts();
setupDialogs();
setupForms();
