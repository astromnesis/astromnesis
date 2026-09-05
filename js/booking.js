const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyBI6jaZ9DrEjPssE-L10fBaOStNvzuWM9c4krezfkLoZrRx-sMxVSK_-dL3bKAEBSB/exec";
const BOOKING_WINDOW_DAYS = 60; // mirrors BOOKINGWINDOW
const OUR_EMAIL = 'astromnesis@gmail.com';

const params = new URLSearchParams(window.location.search);
const service = params.get('service') || 'astrology';
let selectedDuration = null;
let selectedDate = null;
let selectedStart = null;
 
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
 
function computeEnd_(start, duration) {
  const [h, m] = start.split(':').map(Number);
  const total = h * 60 + m + duration;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
 
function selectSlot_(time) {
  selectedStart = time;
  showStep_('contactStep');
  setStatus_(`Selected ${time} — enter your details to confirm.`);
}
 
async function postJson_(action, payload) {
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload }),
  });
  return response.json();
}
 
async function confirmBooking_() {
  const name = document.getElementById('clientName').value.trim();
  const email = document.getElementById('clientEmail').value.trim();
  if (!name || !email) {
    setStatus_('Please fill in your name and email.');
    return;
  }
 
  const booking = {
    service,
    duration: selectedDuration,
    date: selectedDate,
    start: selectedStart,
    end: computeEnd_(selectedStart, selectedDuration),
    name,
    email,
  };
 
  try {
    setStatus_('Reserving your slot…');
    const reserved = await postJson_('reserve', booking);
    if (reserved.error) {
      setStatus_('That slot was just taken — please pick another time.');
      return;
    }
 
    setStatus_('Confirming booking…');
    // TODO: this is where real payment goes, once a provider's chosen —
    // finalize should only run after payment succeeds, not immediately after reserve.
    const finalized = await postJson_('finalize', { ...booking, holdKey: reserved.holdKey });
    setStatus_(finalized.conflict
      ? 'Booked — though a scheduling conflict was flagged for manual review.'
      : 'Booking confirmed! Check your email for details.');
  } catch (err) {
    console.error(err);
    setStatus_('Something went wrong — please try again.');
  }
}
 
function onDurationChosen_(duration) {
  selectedDuration = duration;
  showStep_('dateStep');
  setupDateInput_();
}
 
function onDateChosen_(dateStr) {
  selectedDate = dateStr;
  showStep_('slotsStep');
  setStatus_('Loading available times…');
  fetchSlots_(dateStr, selectedDuration)
    .then(renderSlots_)
    .catch(err => {
      console.error(err);
      setStatus_('Could not load availability — try again shortly.');
    });
}
 
document.addEventListener('DOMContentLoaded', () => {
  initBookingTitle_();
  document.querySelectorAll('#durationStep .service-button').forEach(button => {
    button.addEventListener('click', () => onDurationChosen_(Number(button.dataset.duration)));
  });
  document.getElementById('bookingDate').addEventListener('change', e => onDateChosen_(e.target.value));
  document.getElementById('confirmBookingButton').addEventListener('click', confirmBooking_);
});