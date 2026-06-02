const seed = {
  credits: 4250,
  tournaments: [
    { game: "Tekken 8", title: "King of the Archive", mode: "1v1", entries: "28 / 32", reward: "8,000 AC", status: "Registration", time: "Sat · 8:00 PM" },
    { game: "Rainbow Six Siege", title: "Vault Breakers", mode: "5v5", entries: "7 / 8 teams", reward: "18,000 AC", status: "Almost Full", time: "Sun · 7:00 PM" },
    { game: "Call of Duty", title: "Archive Warfare", mode: "4v4", entries: "12 / 16 teams", reward: "14,000 AC", status: "Registration", time: "Fri · 9:30 PM" },
    { game: "Street Fighter 6", title: "Friday Fight Vault", mode: "1v1", entries: "18 / 24", reward: "6,000 AC", status: "Upcoming", time: "Fri · 8:00 PM" },
    { game: "Rocket League", title: "Aerial Archives", mode: "3v3", entries: "10 / 12 teams", reward: "10,000 AC", status: "Registration", time: "Tue · 7:30 PM" },
    { game: "Minecraft", title: "Builders Battle", mode: "2v2", entries: "9 / 16 teams", reward: "5,000 AC", status: "Upcoming", time: "Wed · 6:00 PM" },
  ],
  duels: [
    { challenger: "ShadowKiing", opponent: "Open Challenge", game: "Street Fighter 6", mode: "1v1", stake: "500 AC", rank: "Gold+", live: true },
    { challenger: "NovaSquad", opponent: "Open Challenge", game: "Rocket League", mode: "3v3", stake: "900 AC", rank: "Any Rank", live: false },
    { challenger: "Vante", opponent: "RivalCrew", game: "Tekken 8", mode: "2v2", stake: "1,200 AC", rank: "Platinum", live: true },
  ],
  clips: [
    { title: "Final Round Comeback", game: "Tekken 8", creator: "@ShadowKiing", views: "2.4K", duration: "0:48", type: "Highlight" },
    { title: "1v4 Clutch in the Vault", game: "Rainbow Six Siege", creator: "@ArchiveGhost", views: "1.8K", duration: "1:12", type: "Moment" },
    { title: "Cleanest Drift Finish", game: "Motorfest", creator: "@RoadKing", views: "984", duration: "0:36", type: "Clip" },
  ],
  forums: [
    { tag: "Site Update", title: "GamersArchives beta roadmap", author: "ArchiveAdmin", replies: 34, ago: "2h ago" },
    { tag: "Tournament", title: "Tekken 8 bracket rules and check-in time", author: "BracketMaster", replies: 18, ago: "5h ago" },
    { tag: "Discussion", title: "What game should get the next community league?", author: "NovaSquad", replies: 67, ago: "Yesterday" },
  ],
  chat: [
    { user: "ArchiveAdmin", text: "Welcome to the GamersArchives beta lobby.", time: "Today, 8:01 PM" },
    { user: "Vante", text: "Who is joining the Tekken tournament?", time: "Today, 8:04 PM" },
    { user: "NovaSquad", text: "We need one more team for Siege.", time: "Today, 8:06 PM" },
  ],
};

const storageKey = "gamersArchivesBetaState";
const state = loadState();

function loadState() {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return structuredClone(seed);
    const parsed = JSON.parse(stored);
    return { ...structuredClone(seed), ...parsed };
  } catch {
    return structuredClone(seed);
  }
}
function saveState() { localStorage.setItem(storageKey, JSON.stringify(state)); }
function escapeHTML(value = "") { return String(value).replace(/[&<>'"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[c])); }
function $(selector) { return document.querySelector(selector); }
function $$(selector) { return [...document.querySelectorAll(selector)]; }
function showToast(message) { const toast = $("#toast"); toast.textContent = message; toast.classList.add("show"); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600); }

function setView(name) {
  $$(".view").forEach(view => view.classList.toggle("active", view.dataset.view === name));
  $$("[data-view-link]").forEach(button => button.classList.toggle("active", button.dataset.viewLink === name));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function tournamentCard(t) {
  const statusClass = t.status === "Almost Full" ? "gold" : "";
  return `<article class="panel tournament-card searchable" data-search="${escapeHTML(`${t.title} ${t.game} ${t.mode} ${t.status}`.toLowerCase())}">
    <div class="card-kicker"><span>${escapeHTML(t.game)}</span><span>♛</span></div>
    <h3>${escapeHTML(t.title)}</h3>
    <div class="card-meta-grid"><div><span>FORMAT</span><b>${escapeHTML(t.mode)}</b></div><div><span>ENTRIES</span><b>${escapeHTML(t.entries)}</b></div><div><span>REWARD POOL</span><b>${escapeHTML(t.reward)}</b></div><div><span>STARTS</span><b>${escapeHTML(t.time)}</b></div></div>
    <div class="card-footer"><span class="pill ${statusClass}">${escapeHTML(t.status)}</span><button class="mini-button" type="button" data-demo-action="Bracket opened for ${escapeHTML(t.title)}">View bracket</button></div>
  </article>`;
}
function duelCard(d) {
  return `<article class="panel duel-card searchable" data-search="${escapeHTML(`${d.challenger} ${d.opponent} ${d.game} ${d.mode}`.toLowerCase())}">
    <div class="card-kicker"><span class="pill purple">${escapeHTML(d.mode)}</span>${d.live ? '<span class="live">Live lobby</span>' : '<span>Open board</span>'}</div>
    <h3>${escapeHTML(d.game)}</h3><div class="duel-line"><span>${escapeHTML(d.challenger)}</span><i>⚔</i><span>${escapeHTML(d.opponent)}</span></div>
    <div class="duel-details"><span>${escapeHTML(d.rank)}</span><b>${escapeHTML(d.stake)}</b></div>
    <button class="secondary-button full" type="button" data-demo-action="Duel lobby opened for ${escapeHTML(d.game)}">Open duel</button>
  </article>`;
}
function clipCard(c) {
  return `<article class="panel clip-card searchable" data-search="${escapeHTML(`${c.title} ${c.game} ${c.creator} ${c.type}`.toLowerCase())}">
    <div class="clip-thumb"><button type="button" data-demo-action="Video preview opened for ${escapeHTML(c.title)}">▶</button><span class="clip-duration">${escapeHTML(c.duration)}</span></div>
    <div class="clip-body"><span class="pill">${escapeHTML(c.type)}</span><h3>${escapeHTML(c.title)}</h3><div class="clip-info"><span>${escapeHTML(c.game)} · ${escapeHTML(c.creator)}</span><span>${escapeHTML(c.views)} views</span></div></div>
  </article>`;
}
function forumTopic(f) {
  return `<button type="button" class="forum-topic" data-demo-action="Forum thread opened: ${escapeHTML(f.title)}"><span class="forum-icon">☷</span><span><span class="pill">${escapeHTML(f.tag)}</span><h3>${escapeHTML(f.title)}</h3><p>${escapeHTML(f.author)} · ${escapeHTML(f.ago)}</p></span><span>${escapeHTML(f.replies)}</span></button>`;
}
function chatMessage(m) {
  const initials = m.user.slice(0,2).toUpperCase();
  return `<article class="chat-message"><div class="chat-avatar">${escapeHTML(initials)}</div><div><b>${escapeHTML(m.user)}</b><time>${escapeHTML(m.time)}</time><p>${escapeHTML(m.text)}</p></div></article>`;
}

function render() {
  $("#featuredTournamentGrid").innerHTML = state.tournaments.slice(0,3).map(tournamentCard).join("");
  $("#tournamentGrid").innerHTML = state.tournaments.map(tournamentCard).join("");
  $("#homeDuelGrid").innerHTML = state.duels.slice(0,3).map(duelCard).join("");
  $("#duelGrid").innerHTML = state.duels.map(duelCard).join("");
  $("#homeClipGrid").innerHTML = state.clips.slice(0,3).map(clipCard).join("");
  $("#clipGrid").innerHTML = state.clips.map(clipCard).join("");
  $("#forumList").innerHTML = state.forums.map(forumTopic).join("");
  $("#chatFeed").innerHTML = state.chat.map(chatMessage).join("");
  $("#chatFeed").scrollTop = $("#chatFeed").scrollHeight;
  ["topCredits","railCredits","profileCredits"].forEach(id => $("#"+id).textContent = state.credits.toLocaleString());
  $("#homeDuelCount").textContent = state.duels.length;
  $("#homeClipCount").textContent = state.clips.length;
  $("#forumThreadCount").textContent = `${state.forums.length} thread${state.forums.length === 1 ? "" : "s"}`;
}

function openModal(id) { const modal = document.getElementById(id); if (!modal) return; $("#modalBackdrop").classList.add("open"); $("#modalBackdrop").setAttribute("aria-hidden","false"); modal.showModal(); }
function closeModals() { $$("dialog[open]").forEach(modal => modal.close()); $("#modalBackdrop").classList.remove("open"); $("#modalBackdrop").setAttribute("aria-hidden","true"); }
function filterCards(gridSelector, query, mode = "all", status = "all") {
  const grid = $(gridSelector); const cards = [...grid.querySelectorAll(".searchable")]; let visible = 0;
  cards.forEach(card => { const match = card.dataset.search.includes(query.toLowerCase()) && (mode === "all" || card.dataset.search.includes(mode.toLowerCase())) && (status === "all" || card.dataset.search.includes(status.toLowerCase())); card.style.display = match ? "" : "none"; if (match) visible++; });
  let empty = grid.querySelector(".empty-state"); if (!visible && !empty) { empty = document.createElement("div"); empty.className = "empty-state"; empty.textContent = "No matching results found."; grid.appendChild(empty); } if (visible && empty) empty.remove();
}

$$('[data-view-link]').forEach(button => button.addEventListener('click', event => { event.preventDefault(); setView(button.dataset.viewLink); }));
$$('[data-open-modal]').forEach(button => button.addEventListener('click', () => openModal(button.dataset.openModal)));
$$('[data-close-modal]').forEach(button => button.addEventListener('click', closeModals));
$('#modalBackdrop').addEventListener('click', closeModals);
document.addEventListener('click', event => { const target = event.target.closest('[data-demo-action]'); if (target) showToast(target.dataset.demoAction + ' — backend connection comes next.'); });

$('#tournamentSearch').addEventListener('input', e => filterCards('#tournamentGrid', e.target.value, $('#tournamentMode').value, $('#tournamentStatus').value));
$('#tournamentMode').addEventListener('change', e => filterCards('#tournamentGrid', $('#tournamentSearch').value, e.target.value, $('#tournamentStatus').value));
$('#tournamentStatus').addEventListener('change', e => filterCards('#tournamentGrid', $('#tournamentSearch').value, $('#tournamentMode').value, e.target.value));
$('#duelSearch').addEventListener('input', e => filterCards('#duelGrid', e.target.value, $('#duelMode').value));
$('#duelMode').addEventListener('change', e => filterCards('#duelGrid', $('#duelSearch').value, e.target.value));
$('#clipSearch').addEventListener('input', e => filterCards('#clipGrid', e.target.value, $('#clipType').value));
$('#clipType').addEventListener('change', e => filterCards('#clipGrid', $('#clipSearch').value, e.target.value));
$('#globalSearch').addEventListener('keydown', e => { if (e.key === 'Enter') { setView('archives'); $('#clipSearch').value = e.target.value; filterCards('#clipGrid', e.target.value, $('#clipType').value); } });

$('#duelForm').addEventListener('submit', event => { event.preventDefault(); const data = new FormData(event.target); state.duels.unshift({ challenger:'ShadowKiing', opponent:'Open Challenge', game:data.get('game'), mode:data.get('mode'), stake:data.get('stake'), rank:data.get('rank') || 'Any Rank', live:false }); saveState(); render(); closeModals(); event.target.reset(); setView('duels'); showToast('Your demo duel challenge was posted.'); });
$('#tournamentForm').addEventListener('submit', event => { event.preventDefault(); const data = new FormData(event.target); const max = data.get('max') || 16; state.tournaments.unshift({ title:data.get('title'), game:data.get('game'), mode:data.get('mode'), entries:`1 / ${max}`, reward:'Community AC', status:'Registration', time:data.get('time') || 'Schedule pending' }); saveState(); render(); closeModals(); event.target.reset(); setView('tournaments'); showToast('Your demo tournament was created.'); });
$('#clipForm').addEventListener('submit', event => { event.preventDefault(); const data = new FormData(event.target); state.clips.unshift({ title:data.get('title'), game:data.get('game'), creator:'@ShadowKiing', views:'0', duration:'0:30', type:data.get('type') }); state.credits += 75; saveState(); render(); closeModals(); event.target.reset(); setView('archives'); showToast('Highlight saved locally. +75 virtual AC participation bonus.'); });
$('#forumForm').addEventListener('submit', event => { event.preventDefault(); const data = new FormData(event.target); state.forums.unshift({ title:data.get('title'), tag:data.get('tag'), author:'ShadowKiing', replies:0, ago:'Just now' }); saveState(); render(); closeModals(); event.target.reset(); setView('forums'); showToast('Your demo discussion was published.'); });
$('#chatForm').addEventListener('submit', event => { event.preventDefault(); const input = $('#chatMessage'); if (!input.value.trim()) return; state.chat.push({ user:'ShadowKiing', text:input.value.trim(), time:new Date().toLocaleTimeString([], { hour:'numeric', minute:'2-digit' }) }); saveState(); render(); input.value=''; });

$('#spinButton').addEventListener('click', () => { const icons=['🎮','🏆','⚡','👾','💎','🕹️']; const reels=[...document.querySelectorAll('#slotReels div')]; const result=reels.map(() => icons[Math.floor(Math.random()*icons.length)]); reels.forEach((reel,index) => reel.textContent=result[index]); const jackpot=result.every(icon => icon===result[0]); const reward=jackpot?250:25; state.credits+=reward; saveState(); render(); $('#slotMessage').textContent=jackpot?`Archive jackpot: +${reward} virtual AC`:`Daily demo reward: +${reward} virtual AC`; showToast(`Vault Spin complete: +${reward} virtual Archive Credits.`); });
$('#triviaButton').addEventListener('click', () => { state.credits += 10; saveState(); render(); showToast('Trivia demo complete: +10 virtual Archive Credits.'); });
$('#predictionButton').addEventListener('click', () => showToast('Free prediction pools are planned for a later build.'));

render();
