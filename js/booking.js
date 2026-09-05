const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyBI6jaZ9DrEjPssE-L10fBaOStNvzuWM9c4krezfkLoZrRx-sMxVSK_-dL3bKAEBSB/exec";
const BOOKING_WINDOW_DAYS = 60; // mirrors BOOKINGWINDOW
const OUR_EMAIL = 'astromnesis@gmail.com';

const params = new URLSearchParams(window.location.search);
const service = params.get('service') || 'astrology';
let selectedDuration = null;

function sendConfirmationEmails_(booking, conflict) {
  const wifeSubject = conflict
    ? `Conflict flagged — ${booking.date} ${booking.start}`
    : `New booking — ${booking.date} ${booking.start}`;
  const wifeBody = conflict
    ? `A double-booking was detected for ${booking.date} ${booking.start}-${booking.end} (${booking.service}, ${booking.duration}min).\nClient: ${booking.name} (${booking.email}).\nPlease check the sheet and resolve manually.`
    : `New confirmed booking:\n${booking.date} ${booking.start}-${booking.end}\nService: ${booking.service} (${booking.duration}min)\nClient: ${booking.name} (${booking.email})`;

  MailApp.sendEmail(WIFE_EMAIL, wifeSubject, wifeBody);
  MailApp.sendEmail(
    booking.email,
    'Your astromnesis reading is confirmed',
    `Hi ${booking.name},\n\nYour ${booking.service} reading (${booking.duration} min) is confirmed for ${booking.date} at ${booking.start}.\n\nSee you then!\nastromnesis`
  );
}

function finalizeBooking(booking) {
  const sheet = getSheet_();
  const config = readConfig();
  const rows = getBookingRows_(sheet);
  const headerRow = findRow_(sheet, 'ClientName');

  const conflict = rows.some(row =>
    row.HoldKey !== booking.holdKey &&
    !row.PendingUntil &&
    !(row.Notes && String(row.Notes).toLowerCase().includes('cancelled')) &&
    normalizeDate_(row.Date, config.timezone) === booking.date &&
    timeToMinutes_(row.Start, config.timezone) < timeToMinutes_(booking.end, config.timezone) &&
    timeToMinutes_(row.End, config.timezone) > timeToMinutes_(booking.start, config.timezone)
  );

  const matchIndex = rows.findIndex(row => row.HoldKey === booking.holdKey);

  if (matchIndex === -1) {
    // Hold row is gone (expired, or overwritten) — payment already succeeded, so write it anyway
    appendBookingRow_(sheet, {
      ClientName: booking.name,
      Date: booking.date,
      Service: booking.service,
      Duration: booking.duration,
      Start: booking.start,
      End: booking.end,
      Email: booking.email,
      Booking: new Date(),
      HoldKey: booking.holdKey,
      PendingUntil: '',
      Notes: conflict ? 'CONFLICT - hold missing, verify manually' : '',
    });
  } else {
    const headers = sheet.getRange(headerRow, 1, 1, sheet.getLastColumn()).getValues()[0];
    const sheetRow = headerRow + 1 + matchIndex;
    sheet.getRange(sheetRow, headers.indexOf('PendingUntil') + 1).setValue('');
    if (conflict) {
      sheet.getRange(sheetRow, headers.indexOf('Notes') + 1).setValue('CONFLICT - double booked, verify manually');
    }
  }

  sendConfirmationEmails_(booking, conflict);
  return { status: 'confirmed', conflict: conflict };
}

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
