chrome.runtime.onInstalled.addListener(() => {
  console.log('SYRKA Extension installed');
  chrome.alarms.create('checkLearningPath', { periodInMinutes: 1440 });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'checkLearningPath') return;

  const { syrka_token, syrka_orchestration_score, last_signal } =
    await chrome.storage.local.get(['syrka_token', 'syrka_orchestration_score', 'last_signal']);
  if (!syrka_token) return;

  try {
    const res = await fetch('https://syrka.co/api/extension/profile', {
      headers: { 'Authorization': `Bearer ${syrka_token}` }
    });
    const profile = await res.json();
    if (!profile.authenticated) return;

    const newScore = profile.orchestrationScore;
    if (newScore && syrka_orchestration_score && newScore !== syrka_orchestration_score) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Syrka — Your profile updated',
        message: `AI Orchestration Score: ${syrka_orchestration_score} → ${newScore}. This week: ${profile.weeklySignal?.skill_to_drop_everything_for || 'check your path'}`
      });
      await chrome.storage.local.set({ syrka_orchestration_score: newScore });
    }

    if (profile.weeklySignal?.skill_to_drop_everything_for) {
      const newSignal = profile.weeklySignal.skill_to_drop_everything_for;
      if (newSignal !== last_signal) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Syrka — New weekly learning signal',
          message: `Drop everything for: ${newSignal}`
        });
        await chrome.storage.local.set({ last_signal: newSignal });
      }
    }
  } catch {}
});
