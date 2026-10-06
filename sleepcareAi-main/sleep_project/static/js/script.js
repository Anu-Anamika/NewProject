// SleepCare AI — small client-side UX helpers.
// This does NOT replace server-side validation (see predictor/forms.py);
// it only gives faster feedback and a clear loading state on submit.

document.addEventListener('DOMContentLoaded', function () {
  var forms = document.querySelectorAll('#sleepQualityForm, #sleepDisorderForm');

  forms.forEach(function (form) {
    form.addEventListener('submit', function (event) {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');

      if (form.checkValidity()) {
        var submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML =
            '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Analyzing…';
        }
      }
    });
  });
});
