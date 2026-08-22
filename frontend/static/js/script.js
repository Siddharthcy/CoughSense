document.addEventListener('DOMContentLoaded', function(){
  const form = document.getElementById('screening-form');
  const resultDiv = document.getElementById('result');
  const errorDiv = document.getElementById('error');
  const submitBtn = document.getElementById('submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.hidden = true;
    resultDiv.hidden = true;

    const audioInput = document.getElementById('audio');
    const age = document.getElementById('age').value;
    const gender = document.getElementById('gender').value;
    const smoker = document.getElementById('smoker').value;

    if (!audioInput.files.length) {
      errorDiv.textContent = 'Please upload an audio file.';
      errorDiv.hidden = false;
      return;
    }

    const fd = new FormData();
    fd.append('audio', audioInput.files[0]);
    fd.append('age', age);
    fd.append('gender', gender);
    fd.append('smoker', smoker);

    submitBtn.disabled = true;
    submitBtn.textContent = 'Analyzing...';

    try {
      const resp = await fetch('/predict', { method: 'POST', body: fd });
      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || 'Server error');
      }

      const res = data.result;
      document.getElementById('probability').textContent = `Probability: ${(res.probability*100).toFixed(1)}%`;
      document.getElementById('recommendation').textContent = res.recommendation;
      document.getElementById('message').textContent = res.message;

      resultDiv.hidden = false;

    } catch (err) {
      errorDiv.textContent = err.message || 'Unexpected error';
      errorDiv.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Run Screening';
    }
  });
});
