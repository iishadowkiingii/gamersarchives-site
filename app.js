const config = window.GAMERSARCHIVES_CONFIG || {};
const supabaseClient = window.supabase?.createClient?.(config.supabaseUrl, config.supabasePublishableKey) || window.GamersArchivesSupabaseLite?.createClient?.(config.supabaseUrl, config.supabasePublishableKey);

const demoSeed = {
  credits: 0,
  tournaments: [
    { id: 'demo-t1', game: 'Tekken 8', title: 'King of the Archive', mode: '1v1', entries: '28 / 32', reward: '8,000 AC', status: 'Registration', time: 'Sat · 8:00 PM' },
    { id: 'demo-t2', game: 'Rainbow Six Siege', title: 'Vault Breakers', mode: '5v5', entries: '7 / 8', reward: '18,000 AC', status: 'Almost Full', time: 'Sun · 7:00 PM' },
    { id: 'demo-t3', game: 'Call of Duty', title: 'Archive Warfare', mode: '4v4', entries: '12 / 16', reward: '14,000 AC', status: 'Registration', time: 'Fri · 9:30 PM' },
  ],
  duels: [
    { id: 'demo-d1', challenger: 'ShadowKiing', opponent: 'Open Challenge', game: 'Street Fighter 6', mode: '1v1', stake: '500 AC', rank: 'Gold+', live: true },
    { id: 'demo-d2', challenger: 'NovaSquad', opponent: 'Open Challenge', game: 'Rocket League', mode: '3v3', stake: '900 AC', rank: 'Any Rank', live: false },
    { id: 'demo-d3', challenger: 'Vante', opponent: 'RivalCrew', game: 'Tekken 8', mode: '2v2', stake: '1,200 AC', rank: 'Platinum', live: true },
  ],
  clips: [
    { id: 'demo-c1', title: 'Final Round Comeback', game: 'Tekken 8', creator: '@ShadowKiing', views: '2.4K', duration: '0:48', type: 'Highlight', videoUrl: '' },
    { id: 'demo-c2', title: '1v4 Clutch in the Vault', game: 'Rainbow Six Siege', creator: '@ArchiveGhost', views: '1.8K', duration: '1:12', type: 'Moment', videoUrl: '' },
    { id: 'demo-c3', title: 'Cleanest Drift Finish', game: 'Motorfest', creator: '@RoadKing', views: '984', duration: '0:36', type: 'Clip', videoUrl: '' },
  ],
  forums: [
    { id: 'demo-f1', tag: 'Site Update', title: 'GamersArchives beta roadmap', author: 'ArchiveAdmin', replies: 34, ago: '2h ago' },
    { id: 'demo-f2', tag: 'Tournament', title: 'Tekken 8 bracket rules and check-in time', author: 'BracketMaster', replies: 18, ago: '5h ago' },
    { id: 'demo-f3', tag: 'Discussion', title: 'What game should get the next community league?', author: 'NovaSquad', replies: 67, ago: 'Yesterday' },
  ],
  chat: [
    { id: 'demo-m1', user: 'ArchiveAdmin', text: 'Welcome to the GamersArchives connected beta lobby.', time: 'Recently' },
    { id: 'demo-m2', user: 'Vante', text: 'Who is joining the Tekken tournament?', time: 'Recently' },
    { id: 'demo-m3', user: 'NovaSquad', text: 'We need one more team for Siege.', time: 'Recently' },
  ],
};

const state = {
  connected: false,
  user: null,
  profile: null,
  credits: 0,
  tournaments: [],
  duels: [],
  clips: [],
  forums: [],
  chat: [],
  realtimeChannel: null,
};

function $(selector) { return document.querySelector(selector); }
function $$(selector) { return [...document.querySelectorAll(selector)]; }
function escapeHTML(value = '') { return String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char])); }
function formatNumber(value = 0) { return Number(value || 0).toLocaleString(); }
function initials(value = '?') { return String(value || '?').replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || '?'; }
function cleanUrl(value = '') { try { const url = new URL(String(value)); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } }
function ago(value) {
  if (!value) return 'Recently';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
function clock(value) { return value ? new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Recently'; }
function showToast(message) { const toast = $('#toast'); if (!toast) return; toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 4200); }
function setAuthStatus(message, type = 'info') { const box = $('#authStatus'); if (!box) return; box.textContent = message; box.classList.toggle('error', type === 'error'); box.classList.toggle('success', type === 'success'); }
function setConnection(connected, text) { state.connected = connected; $('#connectionDot').classList.toggle('online', connected); $('#connectionDot').classList.toggle('offline', !connected); $('#backendStatus').textContent = text; }

function setView(name) {
  $$('.view').forEach(view => view.classList.toggle('active', view.dataset.view === name));
  $$('[data-view-link]').forEach(button => button.classList.toggle('active', button.dataset.viewLink === name));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function tournamentCard(t) {
  const statusClass = t.status === 'Almost Full' ? 'gold' : '';
  return `<article class="panel tournament-card searchable" data-search="${escapeHTML(`${t.title} ${t.game} ${t.mode} ${t.status}`.toLowerCase())}">
    <div class="card-kicker"><span>${escapeHTML(t.game)}</span><span>♛</span></div>
    <h3>${escapeHTML(t.title)}</h3>
    <div class="card-meta-grid"><div><span>FORMAT</span><b>${escapeHTML(t.mode)}</b></div><div><span>ENTRIES</span><b>${escapeHTML(t.entries)}</b></div><div><span>REWARD POOL</span><b>${escapeHTML(t.reward)}</b></div><div><span>STARTS</span><b>${escapeHTML(t.time)}</b></div></div>
    <div class="card-footer"><span class="pill ${statusClass}">${escapeHTML(t.status)}</span><button class="mini-button" type="button" data-demo-action="Bracket page for ${escapeHTML(t.title)} is the next bracket upgrade.">View bracket</button></div>
  </article>`;
}
function duelCard(d) {
  return `<article class="panel duel-card searchable" data-search="${escapeHTML(`${d.challenger} ${d.opponent} ${d.game} ${d.mode}`.toLowerCase())}">
    <div class="card-kicker"><span class="pill purple">${escapeHTML(d.mode)}</span>${d.live ? '<span class="live">Live lobby</span>' : '<span>Open board</span>'}</div>
    <h3>${escapeHTML(d.game)}</h3><div class="duel-line"><span>${escapeHTML(d.challenger)}</span><i>⚔</i><span>${escapeHTML(d.opponent)}</span></div>
    <div class="duel-details"><span>${escapeHTML(d.rank)}</span><b>${escapeHTML(d.stake)}</b></div>
    <button class="secondary-button full" type="button" data-demo-action="Duel lobby details are planned for the next upgrade.">Open duel</button>
  </article>`;
}
function clipCard(c) {
  const url = cleanUrl(c.videoUrl);
  const button = url ? `<button type="button" data-clip-url="${escapeHTML(url)}" aria-label="Open clip">▶</button>` : `<button type="button" data-demo-action="This starter clip does not have a video link yet.">▶</button>`;
  return `<article class="panel clip-card searchable" data-search="${escapeHTML(`${c.title} ${c.game} ${c.creator} ${c.type}`.toLowerCase())}">
    <div class="clip-thumb">${button}<span class="clip-duration">${escapeHTML(c.duration)}</span></div>
    <div class="clip-body"><span class="pill">${escapeHTML(c.type)}</span><h3>${escapeHTML(c.title)}</h3><div class="clip-info"><span>${escapeHTML(c.game)} · ${escapeHTML(c.creator)}</span><span>${escapeHTML(c.views)} views</span></div></div>
  </article>`;
}
function forumTopic(f) {
  return `<button type="button" class="forum-topic" data-demo-action="Thread pages and replies are planned next: ${escapeHTML(f.title)}"><span class="forum-icon">☷</span><span><span class="pill">${escapeHTML(f.tag)}</span><h3>${escapeHTML(f.title)}</h3><p>${escapeHTML(f.author)} · ${escapeHTML(f.ago)}</p></span><span>${escapeHTML(f.replies)}</span></button>`;
}
function chatMessage(m) {
  return `<article class="chat-message"><div class="chat-avatar">${escapeHTML(initials(m.user))}</div><div><b>${escapeHTML(m.user)}</b><time>${escapeHTML(m.time)}</time><p>${escapeHTML(m.text)}</p></div></article>`;
}

function renderProfile() {
  const profile = state.profile;
  const signedIn = Boolean(state.user && profile);
  const displayName = profile?.display_name || 'Guest visitor';
  const role = profile?.role || 'visitor';
  const avatar = initials(displayName);
  const userClips = signedIn ? state.clips.filter(clip => clip.createdBy === state.user.id).length : 0;
  const rank = signedIn ? 'Beta' : '—';
  const badges = signedIn ? [`✦ Beta Member`, ...(role === 'founder' ? ['♛ Founder'] : []), ...(userClips ? ['▶ Archivist'] : [])] : ['✦ Visitor'];

  $('#authProfileButton').textContent = avatar;
  $('#profileAvatar').textContent = avatar;
  $('#railAvatar').textContent = avatar;
  $('#profileName').textContent = signedIn ? displayName : 'Sign in to create your archive';
  $('#profileHandle').textContent = signedIn ? `@${profile.username} · Connected member profile` : 'Member profiles are saved after account creation.';
  $('#profileRole').textContent = signedIn ? `${role} account` : 'Guest visitor';
  $('#railProfileName').textContent = signedIn ? displayName : 'Guest visitor';
  $('#railProfileRole').textContent = signedIn ? `${role} account` : 'Sign in to join';
  $('#profileWins').textContent = formatNumber(profile?.wins || 0);
  $('#railWins').textContent = formatNumber(profile?.wins || 0);
  $('#profileClipCount').textContent = formatNumber(userClips);
  $('#railClipCount').textContent = formatNumber(userClips);
  $('#profileRank').textContent = rank;
  $('#railRank').textContent = rank;
  $('#profileBadges').innerHTML = badges.map(badge => `<span>${escapeHTML(badge)}</span>`).join('');
  $('#profileAccountStatus').textContent = signedIn ? `Signed in as ${displayName}. Your account can post shared community content.` : 'Sign in to post challenges, chat with members, and save your profile.';
  $('#profileAuthButton').classList.toggle('hidden', signedIn);
  $('#signOutButton').classList.toggle('hidden', !signedIn);
  $('#editProfileButton').classList.toggle('hidden', !signedIn);
}

function render() {
  $('#featuredTournamentGrid').innerHTML = state.tournaments.slice(0, 3).map(tournamentCard).join('');
  $('#tournamentGrid').innerHTML = state.tournaments.map(tournamentCard).join('');
  $('#homeDuelGrid').innerHTML = state.duels.slice(0, 3).map(duelCard).join('');
  $('#duelGrid').innerHTML = state.duels.map(duelCard).join('');
  $('#homeClipGrid').innerHTML = state.clips.slice(0, 3).map(clipCard).join('');
  $('#clipGrid').innerHTML = state.clips.map(clipCard).join('');
  $('#forumList').innerHTML = state.forums.map(forumTopic).join('');
  $('#chatFeed').innerHTML = state.chat.map(chatMessage).join('');
  $('#chatFeed').scrollTop = $('#chatFeed').scrollHeight;
  ['topCredits', 'railCredits', 'profileCredits'].forEach(id => $('#' + id).textContent = formatNumber(state.profile?.credits || 0));
  $('#homeDuelCount').textContent = state.duels.length;
  $('#homeClipCount').textContent = state.clips.length;
  $('#forumThreadCount').textContent = `${state.forums.length} thread${state.forums.length === 1 ? '' : 's'}`;
  renderProfile();
}

function useDemoFallback() {
  state.tournaments = structuredClone(demoSeed.tournaments);
  state.duels = structuredClone(demoSeed.duels);
  state.clips = structuredClone(demoSeed.clips);
  state.forums = structuredClone(demoSeed.forums);
  state.chat = structuredClone(demoSeed.chat);
  setConnection(false, 'Database setup not detected — showing preview content');
  render();
}

async function loadProfile() {
  if (!state.user) { state.profile = null; return; }
  const { data, error } = await supabaseClient.from('profiles').select('*').eq('id', state.user.id).single();
  if (error) throw error;
  state.profile = data;
}

async function loadCommunityData({ quiet = false } = {}) {
  if (!supabaseClient) { useDemoFallback(); return; }
  const [tournaments, duels, clips, forums, chat] = await Promise.all([
    supabaseClient.from('tournaments').select('*').order('created_at', { ascending: false }).limit(80),
    supabaseClient.from('duels').select('*').order('created_at', { ascending: false }).limit(80),
    supabaseClient.from('clips').select('*').order('created_at', { ascending: false }).limit(80),
    supabaseClient.from('forum_threads').select('*').order('created_at', { ascending: false }).limit(80),
    supabaseClient.from('chat_messages').select('*').order('created_at', { ascending: true }).limit(100),
  ]);
  const errors = [tournaments, duels, clips, forums, chat].map(result => result.error).filter(Boolean);
  if (errors.length) {
    console.warn('Supabase setup incomplete:', errors);
    useDemoFallback();
    if (!quiet) showToast('Upload the SQL setup first. Preview content is still available.');
    return;
  }
  state.connected = true;
  state.tournaments = tournaments.data.map(t => ({ id:t.id, game:t.game, title:t.title, mode:t.mode, entries:`${t.entry_count} / ${t.max_entries}`, reward:t.reward_text, status:t.status, time:t.starts_text, createdBy:t.created_by }));
  state.duels = duels.data.map(d => ({ id:d.id, challenger:d.challenger_name, opponent:d.opponent_name, game:d.game, mode:d.mode, stake:`${formatNumber(d.stake_ac)} AC`, rank:d.rank_requirement, live:d.live, createdBy:d.created_by }));
  state.clips = clips.data.map(c => ({ id:c.id, title:c.title, game:c.game, creator:`@${c.creator_name}`, views:formatNumber(c.views), duration:c.duration_text, type:c.category, videoUrl:c.video_url, createdBy:c.created_by }));
  state.forums = forums.data.map(f => ({ id:f.id, tag:f.tag, title:f.title, author:f.author_name, replies:f.reply_count, ago:ago(f.created_at), createdBy:f.created_by }));
  state.chat = chat.data.map(m => ({ id:m.id, user:m.author_name, text:m.body, time:clock(m.created_at) }));
  setConnection(true, 'Connected to Supabase community database');
  render();
}

async function refreshAccount() {
  if (!supabaseClient) return;
  const { data } = await supabaseClient.auth.getSession();
  state.user = data.session?.user || null;
  try { await loadProfile(); } catch (error) { console.warn('Profile load failed:', error); state.profile = null; }
  render();
}

function subscribeRealtime() {
  if (!supabaseClient || state.realtimeChannel) return;
  state.realtimeChannel = supabaseClient.channel('gamersarchives-live')
    .on('postgres_changes', { event:'INSERT', schema:'public', table:'chat_messages' }, () => loadCommunityData({ quiet:true }))
    .subscribe();
}

function openModal(id) {
  const protectedModals = new Set(['duelModal', 'tournamentModal', 'clipModal', 'forumModal', 'editProfileModal']);
  if (protectedModals.has(id) && !state.user) { id = 'authModal'; showToast('Sign in or create an account to use that feature.'); }
  const modal = document.getElementById(id);
  if (!modal) return;
  $('#modalBackdrop').classList.add('open');
  $('#modalBackdrop').setAttribute('aria-hidden', 'false');
  modal.showModal();
}
function closeModals() { $$('dialog[open]').forEach(modal => modal.close()); $('#modalBackdrop').classList.remove('open'); $('#modalBackdrop').setAttribute('aria-hidden', 'true'); }
function filterCards(gridSelector, query, mode = 'all', status = 'all') {
  const grid = $(gridSelector); const cards = [...grid.querySelectorAll('.searchable')]; let visible = 0;
  cards.forEach(card => { const match = card.dataset.search.includes(query.toLowerCase()) && (mode === 'all' || card.dataset.search.includes(mode.toLowerCase())) && (status === 'all' || card.dataset.search.includes(status.toLowerCase())); card.style.display = match ? '' : 'none'; if (match) visible++; });
  let empty = grid.querySelector('.empty-state'); if (!visible && !empty) { empty = document.createElement('div'); empty.className = 'empty-state'; empty.textContent = 'No matching results found.'; grid.appendChild(empty); } if (visible && empty) empty.remove();
}
function requireAccount() { if (state.user) return true; openModal('authModal'); showToast('Sign in or create an account first.'); return false; }
function formValue(data, name) { return String(data.get(name) || '').trim(); }

$$('[data-view-link]').forEach(button => button.addEventListener('click', event => { event.preventDefault(); setView(button.dataset.viewLink); }));
$$('[data-open-modal]').forEach(button => button.addEventListener('click', () => openModal(button.dataset.openModal)));
$$('[data-close-modal]').forEach(button => button.addEventListener('click', closeModals));
$('#modalBackdrop').addEventListener('click', closeModals);
document.addEventListener('click', event => {
  const action = event.target.closest('[data-demo-action]'); if (action) showToast(action.dataset.demoAction);
  const clip = event.target.closest('[data-clip-url]'); if (clip) window.open(clip.dataset.clipUrl, '_blank', 'noopener,noreferrer');
});

$('#authProfileButton').addEventListener('click', () => state.user ? setView('profile') : openModal('authModal'));
$('#profileAuthButton').addEventListener('click', () => openModal('authModal'));
$('#editProfileButton').addEventListener('click', () => { if (!requireAccount()) return; $('#editProfileForm').elements.display_name.value = state.profile?.display_name || ''; $('#editProfileForm').elements.username.value = state.profile?.username || ''; openModal('editProfileModal'); });
$('#signOutButton').addEventListener('click', async () => { if (!supabaseClient) return showToast('Connection client is unavailable.'); try { await supabaseClient.auth.signOut(); setAuthStatus('Signed out.', 'success'); showToast('Signed out.'); setView('home'); } catch (error) { setAuthStatus(`Sign-out failed: ${error.message}`, 'error'); showToast(`Sign-out failed: ${error.message}`); } });

$('#tournamentSearch').addEventListener('input', e => filterCards('#tournamentGrid', e.target.value, $('#tournamentMode').value, $('#tournamentStatus').value));
$('#tournamentMode').addEventListener('change', e => filterCards('#tournamentGrid', $('#tournamentSearch').value, e.target.value, $('#tournamentStatus').value));
$('#tournamentStatus').addEventListener('change', e => filterCards('#tournamentGrid', $('#tournamentSearch').value, $('#tournamentMode').value, e.target.value));
$('#duelSearch').addEventListener('input', e => filterCards('#duelGrid', e.target.value, $('#duelMode').value));
$('#duelMode').addEventListener('change', e => filterCards('#duelGrid', $('#duelSearch').value, e.target.value));
$('#clipSearch').addEventListener('input', e => filterCards('#clipGrid', e.target.value, $('#clipType').value));
$('#clipType').addEventListener('change', e => filterCards('#clipGrid', $('#clipSearch').value, e.target.value));
$('#globalSearch').addEventListener('keydown', e => { if (e.key === 'Enter') { setView('archives'); $('#clipSearch').value = e.target.value; filterCards('#clipGrid', e.target.value, $('#clipType').value); } });

$('#signUpForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (!supabaseClient) { setAuthStatus('Connection client did not load. Upload supabase-lite.js with the updated files.', 'error'); return showToast('Connection client did not load.'); }
  const button = event.submitter; if (button) button.disabled = true;
  setAuthStatus('Creating your account...');
  try {
    const data = new FormData(event.target);
    const username = formValue(data, 'username');
    const { data:result, error } = await supabaseClient.auth.signUp({ email:formValue(data,'email'), password:formValue(data,'password'), options:{ emailRedirectTo:config.siteUrl, data:{ username, display_name:username } } });
    if (error) { setAuthStatus(`Account creation failed: ${error.message}`, 'error'); return showToast(`Account creation failed: ${error.message}`); }
    event.target.reset();
    if (result?.access_token || result?.session) {
      setAuthStatus('Account created and signed in successfully.', 'success'); closeModals(); showToast('Account created. You are signed in.');
    } else {
      setAuthStatus('Account created. Check your email confirmation link, then return here to sign in.', 'success');
      showToast('Account created. Check your email confirmation link.');
    }
  } catch (error) { setAuthStatus(`Account creation failed: ${error.message}`, 'error'); showToast(`Account creation failed: ${error.message}`); }
  finally { if (button) button.disabled = false; }
});
$('#signInForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (!supabaseClient) { setAuthStatus('Connection client did not load. Upload supabase-lite.js with the updated files.', 'error'); return showToast('Connection client did not load.'); }
  const button = event.submitter; if (button) button.disabled = true;
  setAuthStatus('Signing you in...');
  try {
    const data = new FormData(event.target);
    const { error } = await supabaseClient.auth.signInWithPassword({ email:formValue(data,'email'), password:formValue(data,'password') });
    if (error) { setAuthStatus(`Sign-in failed: ${error.message}`, 'error'); return showToast(`Sign-in failed: ${error.message}`); }
    event.target.reset(); setAuthStatus('Signed in successfully.', 'success'); closeModals(); showToast('Signed in successfully.');
  } catch (error) { setAuthStatus(`Sign-in failed: ${error.message}`, 'error'); showToast(`Sign-in failed: ${error.message}`); }
  finally { if (button) button.disabled = false; }
});
$('#editProfileForm').addEventListener('submit', async event => {
  event.preventDefault(); if (!requireAccount()) return;
  const data = new FormData(event.target);
  const { error } = await supabaseClient.from('profiles').update({ display_name:formValue(data,'display_name'), username:formValue(data,'username').toLowerCase() }).eq('id', state.user.id);
  if (error) return showToast(`Profile update failed: ${error.message}`);
  await loadProfile(); render(); closeModals(); showToast('Profile saved.');
});
$('#duelForm').addEventListener('submit', async event => {
  event.preventDefault(); if (!requireAccount()) return; const data = new FormData(event.target);
  const stake = Number(formValue(data,'stake').replace(/[^0-9]/g,'')) || 0;
  const { error } = await supabaseClient.from('duels').insert({ created_by:state.user.id, game:formValue(data,'game'), mode:formValue(data,'mode'), stake_ac:stake, rank_requirement:formValue(data,'rank') || 'Any Rank' });
  if (error) return showToast(`Duel post failed: ${error.message}`);
  await loadCommunityData({ quiet:true }); closeModals(); event.target.reset(); setView('duels'); showToast('Your duel challenge is live for the community.');
});
$('#tournamentForm').addEventListener('submit', async event => {
  event.preventDefault(); if (!requireAccount()) return; const data = new FormData(event.target);
  const { error } = await supabaseClient.from('tournaments').insert({ created_by:state.user.id, title:formValue(data,'title'), game:formValue(data,'game'), mode:formValue(data,'mode'), max_entries:Number(data.get('max')) || 16, starts_text:formValue(data,'time') || 'Schedule pending' });
  if (error) return showToast(`Tournament creation failed: ${error.message}`);
  await loadCommunityData({ quiet:true }); closeModals(); event.target.reset(); setView('tournaments'); showToast('Your tournament was published.');
});
$('#clipForm').addEventListener('submit', async event => {
  event.preventDefault(); if (!requireAccount()) return; const data = new FormData(event.target); const videoUrl = cleanUrl(formValue(data,'video_url'));
  if (formValue(data,'video_url') && !videoUrl) return showToast('Please use a valid http or https video link.');
  const { error } = await supabaseClient.from('clips').insert({ created_by:state.user.id, title:formValue(data,'title'), game:formValue(data,'game'), category:formValue(data,'type'), video_url:videoUrl || null });
  if (error) return showToast(`Archive post failed: ${error.message}`);
  await loadCommunityData({ quiet:true }); closeModals(); event.target.reset(); setView('archives'); showToast('Your highlight link was added to the community archive.');
});
$('#forumForm').addEventListener('submit', async event => {
  event.preventDefault(); if (!requireAccount()) return; const data = new FormData(event.target);
  const { error } = await supabaseClient.from('forum_threads').insert({ created_by:state.user.id, title:formValue(data,'title'), tag:formValue(data,'tag'), body:formValue(data,'message') });
  if (error) return showToast(`Discussion post failed: ${error.message}`);
  await loadCommunityData({ quiet:true }); closeModals(); event.target.reset(); setView('forums'); showToast('Your discussion was published.');
});
$('#chatForm').addEventListener('submit', async event => {
  event.preventDefault(); if (!requireAccount()) return; const input = $('#chatMessage'); const message = input.value.trim(); if (!message) return;
  const { error } = await supabaseClient.from('chat_messages').insert({ user_id:state.user.id, body:message });
  if (error) return showToast(`Chat message failed: ${error.message}`);
  input.value = ''; await loadCommunityData({ quiet:true });
});

$('#spinButton').addEventListener('click', async () => {
  if (!requireAccount()) return;
  const icons = ['🎮','🏆','⚡','👾','💎','🕹️']; const reels = [...document.querySelectorAll('#slotReels div')]; reels.forEach(reel => reel.textContent = icons[Math.floor(Math.random()*icons.length)]);
  const { data:reward, error } = await supabaseClient.rpc('claim_daily_spin');
  if (error) return showToast(`Spin failed: ${error.message}`);
  if (!reward) { $('#slotMessage').textContent = 'You already claimed today’s free spin.'; return showToast('Daily spin already claimed. Come back tomorrow.'); }
  await loadProfile(); render(); $('#slotMessage').textContent = `Daily member reward: +${reward} virtual AC`; showToast(`Vault Spin complete: +${reward} virtual Archive Credits.`);
});
$('#triviaButton').addEventListener('click', () => showToast('Trivia questions and server-checked rewards are planned for the next arcade upgrade.'));
$('#predictionButton').addEventListener('click', () => showToast('Free prediction pools are planned for a later build.'));

async function init() {
  render();
  if (!supabaseClient) { useDemoFallback(); setAuthStatus('Connection client is unavailable. Upload supabase-lite.js with the updated site files.', 'error'); showToast('Connection client is unavailable.'); return; }
  setAuthStatus('Account system loaded. Create an account or sign in.');
  supabaseClient.auth.onAuthStateChange(async (_event, session) => { state.user = session?.user || null; try { await loadProfile(); } catch (error) { console.warn('Profile load failed:', error); state.profile = null; } render(); });
  try { await refreshAccount(); await loadCommunityData(); subscribeRealtime(); }
  catch (error) { console.warn('Startup failed:', error); useDemoFallback(); setAuthStatus(`Database connection warning: ${error.message}`, 'error'); showToast(`Database connection warning: ${error.message}`); }
}


init();
