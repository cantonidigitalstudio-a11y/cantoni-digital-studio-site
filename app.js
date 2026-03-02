(function () {
  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  var leadForm = document.getElementById('leadForm');
  var leadNote = document.getElementById('formNote');
  if (leadForm && leadNote) {
    leadForm.addEventListener('submit', function (event) {
      event.preventDefault();
      leadNote.textContent = 'Request received. We reply within 24 hours.';
      leadForm.reset();
    });
  }

  var quoteForm = document.getElementById('quoteForm');
  var quoteNote = document.getElementById('quoteNote');
  if (quoteForm && quoteNote) {
    quoteForm.addEventListener('submit', function (event) {
      event.preventDefault();
      quoteNote.textContent = 'Preventivo ricevuto. Ti rispondiamo entro 24 ore con proposta dettagliata.';
      quoteForm.reset();
    });
  }
})();
