const APPS_SCRIPT_URL = "PASTE_YOUR_DEPLOYED_WEB_APP_URL_HERE";
const BOOKING_WINDOW_DAYS = 60; // mirrors BOOKINGWINDOW in the Config sheet until an /action=bounds endpoint exists

const params = new URLSearchParams(window.location.search);
const service = params.get('service') || 'astrology';
let selectedDuration = null;

function initBookingTitle_() {
  const title = document.getElementById('bookingTitle');
  if (!title) return;
  title.textContent = service === 'tarot' ? 'Book a Tarot Reading' : 'Book an Astrology Reading';
}

function setStatus_(message) {
  document.getElementById('bookingStatus').textContent = message;
}

function showStep_(id) {
  document.getElementById(id).hidden = false;
}

function setupDateInput_() {
  const dateInput = document.getElementById('bookingDate');
  const today = new Date();
  const max = new Date(today.getTime() + BOOKING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  dateInput.min = today.toISOString().split('T')[0];
  dateInput.max = max.toISOString().split('T')[0];
}

async function fetchSlots_(dateStr, duration) {
  const url = `${APPS_SCRIPT_URL}?action=slots&date=${dateStr}&duration=${duration}`;
  const response = await fetch(url);
  return response.json();
}

function renderSlots_(result) {
  const list = document.getElementById('slotsList');
  list.innerHTML = '';
  const slots = result.slots || [];

  if (slots.length === 0) {
    setStatus_('No times available that day — try another date.');
    return;
  }

  setStatus_('');
  slots.forEach(time => {
    const button = document.createElement('button');
    button.className = 'service-button slot-button';
    button.type = 'button';
    button.textContent = time;
    button.addEventListener('click', () => selectSlot_(time));
    list.appendChild(button);
  });
}

function selectSlot_(time) {
  setStatus_(`Selected ${time} — reservation and payment coming next.`);
}

function onDurationChosen_(duration) {
  selectedDuration = duration;
  showStep_('dateStep');
  setupDateInput_();
}

function onDateChosen_(dateStr) {
  showStep_('slotsStep');
  setStatus_('Loading available times…');
  fetchSlots_(dateStr, selectedDuration)
    .then(renderSlots_)
    .catch(() => setStatus_('Could not load availability — try again shortly.'));
}

document.addEventListener('DOMContentLoaded', () => {
  initBookingTitle_();
  document.querySelectorAll('#durationStep .service-button').forEach(button => {
    button.addEventListener('click', () => onDurationChosen_(Number(button.dataset.duration)));
  });
  document.getElementById('bookingDate').addEventListener('change', e => onDateChosen_(e.target.value));
});
