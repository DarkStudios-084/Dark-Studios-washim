// modal.js — login -> payment -> manual verification instructions (no auto-unlock)
document.addEventListener('DOMContentLoaded', () => {
  const openBtns = Array.from(document.querySelectorAll('.modal-open'));
  const previewBtns = Array.from(document.querySelectorAll('.preview-open'));
  const overlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalClose');
  const cancelBtn = document.getElementById('modalCancel');
  const payCancel = document.getElementById('payCancel');
  const loginContinue = document.getElementById('loginContinue');
  const iHavePaidBtn = document.getElementById('iHavePaid');
  const modalStepLogin = document.getElementById('modalStepLogin');
  const modalStepPayment = document.getElementById('modalStepPayment');
  const modalStepVerify = document.getElementById('modalStepVerify');
  const loginName = document.getElementById('loginName');
  const loginEmail = document.getElementById('loginEmail');
  const payAmountSpan = document.getElementById('payAmount');

  const UPI_ID = '7620298854@fam';
  const WHATSAPP = '+91 7620298854 (WhatsApp)';

  let activeTemplate = null;
  let activePrice = 0;

  function openModalForTemplate(templateId, price) {
    activeTemplate = templateId;
    activePrice = price || 0;
    // reset to login step by default
    showStep('login');
    payAmountSpan.textContent = `₹${activePrice}`;
    // show overlay
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    setTimeout(() => loginName && loginName.focus(), 80);
  }

  function closeModal() {
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    activeTemplate = null;
  }

  function showStep(step) {
    modalStepLogin.style.display = step === 'login' ? 'block' : 'none';
    modalStepPayment.style.display = step === 'payment' ? 'block' : 'none';
    modalStepVerify.style.display = step === 'verify' ? 'block' : 'none';
  }

  // open buttons
  openBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tpl = btn.dataset.template;
      const price = parseInt(btn.dataset.price || '0', 10);
      // if already unlocked (admin verified earlier) trigger download
      if (isUnlocked(tpl)) {
        triggerDownload(tpl);
        return;
      }
      openModalForTemplate(tpl, price);
    });
  });

  // preview buttons: open modal if not unlocked
  previewBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tpl = btn.dataset.template;
      const price = parseInt(btn.dataset.price || '0', 10);
      if (isUnlocked(tpl)) {
        openLivePreview(tpl);
      } else {
        openModalForTemplate(tpl, price);
      }
    });
  });

  // modal close handlers
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  payCancel?.addEventListener('click', closeModal);

  // login continue
  loginContinue?.addEventListener('click', () => {
    const name = loginName.value && loginName.value.trim();
    const email = loginEmail.value && loginEmail.value.trim();
    if (!name || !email) {
      alert('Please enter name and email to continue.');
      return;
    }
    localStorage.setItem('ds_user', JSON.stringify({ name, email }));
    // proceed to payment step
    showStep('payment');
    const upiIdEl = document.getElementById('upiId');
    if (upiIdEl) upiIdEl.textContent = UPI_ID;
  });

  // I Have Paid button -> show manual verification instructions and save pending record
  iHavePaidBtn?.addEventListener('click', () => {
    if (!activeTemplate) return alert('Template not selected.');
    // save a pending record (for admin to verify later)
    const user = JSON.parse(localStorage.getItem('ds_user') || '{}');
    const record = {
      template: activeTemplate,
      price: activePrice,
      name: user.name || 'unknown',
      email: user.email || 'unknown',
      when: new Date().toISOString(),
      status: 'pending'
    };

    // store pending list
    try {
      const existing = JSON.parse(localStorage.getItem('ds_pending_list') || '[]');
      existing.push(record);
      localStorage.setItem('ds_pending_list', JSON.stringify(existing));
      // also store per-template pending for convenience
      localStorage.setItem('ds_pending_' + activeTemplate, JSON.stringify(record));
    } catch (e) {
      console.warn('Could not store pending record locally.', e);
    }

    // show verification instructions step
    showStep('verify');

    // set clipboard-friendly text (attempt)
    const message = `Paid ₹${activePrice} for ${activeTemplate}. Name: ${record.name}. Email: ${record.email}. UPI ID: ${UPI_ID}. Time: ${new Date(record.when).toLocaleString()}`;
    // Try to copy to clipboard for user's convenience (may require user gesture)
    try {
      navigator.clipboard?.writeText(message).catch(()=>{});
    } catch(e){}

    // you can also display the whatsapp number in a clickable link (not automatic messaging in some browsers)
  });

  // verify done / close
  document.getElementById('verifyDone')?.addEventListener('click', () => {
    alert('Thanks — send the payment screenshot + your email/username to ' + WHATSAPP + '. Our team will verify and send credentials.');
    closeModal();
  });
  document.getElementById('verifyCancel')?.addEventListener('click', closeModal);

  // helper: check unlocked
  function isUnlocked(tpl) {
    try {
      return localStorage.getItem('ds_unlocked_' + tpl) === '1';
    } catch (e) {
      return false;
    }
  }

  // helper: trigger download (if unlocked)
  function triggerDownload(tpl) {
    const url = `assets/templates/${tpl}.zip`;
    const a = document.createElement('a');
    a.href = url;
    a.download = tpl + '.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // helper: open live preview (if unlocked)
  function openLivePreview(tpl) {
    window.open(`preview/${tpl}.html`, '_blank', 'noopener');
  }

  // refresh unlocked UI (if admin verified later)
  function refreshUnlockedUI() {
    document.querySelectorAll('.modal-open').forEach(btn => {
      const tpl = btn.dataset.template;
      if (isUnlocked(tpl)) {
        btn.textContent = 'Download';
        btn.classList.remove('btn-outline');
        btn.classList.add('btn-solid');
        btn.onclick = () => triggerDownload(tpl);
      }
    });
    document.querySelectorAll('.preview-open').forEach(btn => {
      const tpl = btn.dataset.template;
      if (isUnlocked(tpl)) {
        btn.textContent = 'Live';
        btn.onclick = () => openLivePreview(tpl);
      }
    });
  }

  // initial refresh
  refreshUnlockedUI();

  // overlay click to close (but not when clicking modal content)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // expose small admin helper on window (optional)
  window.dsAdmin = {
    listPending: () => {
      try {
        return JSON.parse(localStorage.getItem('ds_pending_list') || '[]');
      } catch (e) { return []; }
    },
    unlock: (tpl) => {
      localStorage.setItem('ds_unlocked_' + tpl, '1');
      refreshUnlockedUI();
    }
  };
});