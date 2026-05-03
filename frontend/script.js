// API manzili – local testda backend manzili, deployda o‘zgaradi
const API_BASE = 'https://event-booking-api2026.onrender.com';
let token = localStorage.getItem('token');
let currentUser = null;

const dynamicContent = document.getElementById('dynamicContent');
const loader = document.getElementById('loader');

async function apiRequest(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API_BASE}${endpoint}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Xatolik');
    return data;
}

function showLoader(show) {
    loader.style.display = show ? 'flex' : 'none';
}

function updateUIBasedOnAuth() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminBtns = document.querySelectorAll('.admin-only');
    if (token && currentUser) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        adminBtns.forEach(btn => btn.style.display = (currentUser.role === 'admin' || currentUser.role === 'organizer') ? 'inline-block' : 'none');
    } else {
        loginBtn.style.display = 'inline-block';
        registerBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        adminBtns.forEach(btn => btn.style.display = 'none');
    }
}

// Sahifalar yuklovchi funksiyalar
async function loadEvents() {
    showLoader(true);
    const search = document.getElementById('searchInput')?.value || '';
    const category = document.getElementById('categoryFilter')?.value || '';
    const location = document.getElementById('locationFilter')?.value || '';
    const startDate = document.getElementById('startDate')?.value || '';
    const endDate = document.getElementById('endDate')?.value || '';

    let url = `/api/events?search=${encodeURIComponent(search)}&category=${category}&location=${location}`;
    if (startDate) url += `&minDate=${startDate}`;
    if (endDate) url += `&maxDate=${endDate}`;

    try {
        const data = await apiRequest(url);
        const events = data.data;
        let html = `<h2>📅 Barcha tadbirlar</h2><div class="events-grid">`;
        if (events.length === 0) html += `<p>Hech qanday tadbir topilmadi.</p>`;
        events.forEach(ev => {
            html += `
                <div class="event-card">
                    <h3>${ev.title}</h3>
                    <p><i class="fas fa-calendar"></i> ${new Date(ev.date).toLocaleDateString('uz')}</p>
                    <p><i class="fas fa-clock"></i> ${ev.startTime} — ${ev.endTime}</p>
                    <p><i class="fas fa-location-dot"></i> ${ev.location} ${ev.address ? ', ' + ev.address : ''}</p>
                    <p><i class="fas fa-chair"></i> Bo‘sh joy: ${ev.availableSeats}/${ev.totalSeats}</p>
                    <p><i class="fas fa-microphone"></i> ${ev.speaker}</p>
                    <p><strong><i class="fas fa-tag"></i> ${ev.price.toLocaleString()} so‘m</strong></p>
                    ${token ? `<button class="book-btn" data-id="${ev._id}">🎟️ Band qilish</button>` : `<p>Band qilish uchun <button id="loginInline" class="btn-outline">kiring</button></p>`}
                </div>
            `;
        });
        html += `</div>`;
        dynamicContent.innerHTML = html;

        document.querySelectorAll('.book-btn').forEach(btn => {
            btn.addEventListener('click', () => bookEvent(btn.dataset.id));
        });
        const loginInline = document.getElementById('loginInline');
        if (loginInline) loginInline.addEventListener('click', () => openAuthModal('login'));
    } catch (err) {
        dynamicContent.innerHTML = `<div style="color:#f87171">Xatolik: ${err.message}</div>`;
    } finally {
        showLoader(false);
    }
}

async function loadMyBookings() {
    if (!token) {
        dynamicContent.innerHTML = `<p>Iltimos, avval <button id="loginFirst">kiring</button></p>`;
        document.getElementById('loginFirst')?.addEventListener('click', () => openAuthModal('login'));
        return;
    }
    showLoader(true);
    try {
        const data = await apiRequest('/api/bookings/my-bookings');
        const bookings = data.data;
        let html = `<h2>📌 Mening bandlovlarim</h2><div class="booking-list">`;
        if (bookings.length === 0) html += `<p>Siz hali hech narsa band qilmagansiz.</p>`;
        bookings.forEach(b => {
            html += `
                <div class="booking-item">
                    <div>
                        <strong>${b.event.title}</strong><br>
                        Sana: ${new Date(b.event.date).toLocaleDateString('uz')}<br>
                        Joylar: ${b.seats} | Narx: ${b.totalPrice.toLocaleString()} so‘m<br>
                        Holat: <span class="status ${b.status}">${b.status === 'confirmed' ? 'Tasdiqlangan' : 'Bekor qilingan'}</span>
                    </div>
                    <div class="booking-actions">
                        ${b.status === 'confirmed' ? `<button class="edit-booking" data-id="${b._id}">✏️ Tahrirlash</button>
                        <button class="cancel-btn" data-id="${b._id}">Bekor qilish</button>` : ''}
                    </div>
                </div>
            `;
        });
        html += `</div>`;
        dynamicContent.innerHTML = html;

        // Bekor qilish tugmalari
        document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Bandlovni bekor qilmoqchimisiz?')) {
                    try {
                        await apiRequest(`/api/bookings/${btn.dataset.id}`, 'DELETE');
                        alert('Bekor qilindi');
                        loadMyBookings();
                    } catch (err) { alert(err.message); }
                }
            });
        });

        // Tahrirlash tugmalari
        document.querySelectorAll('.edit-booking').forEach(btn => {
            btn.addEventListener('click', () => editBooking(btn.dataset.id));
        });
    } catch (err) {
        dynamicContent.innerHTML = `<div class="error">${err.message}</div>`;
    } finally { 
        showLoader(false);
    }
}


async function editBooking(bookingId) {
    const newName = prompt('Ismingizni yangilang (hozirgi nomi qoldirish uchun bo‘sh qoldiring)');
    const newEmail = prompt('Emailni yangilang (bo‘sh qoldirish mumkin)');
    const newPhone = prompt('Telefon raqam (+998xxxxxxxxx) (bo‘sh qoldirish mumkin)');
    
    const updateData = {};
    if (newName && newName.trim()) updateData.attendeeName = newName.trim();
    if (newEmail && newEmail.trim()) updateData.attendeeEmail = newEmail.trim();
    if (newPhone && newPhone.trim()) updateData.attendeePhone = newPhone.trim();
    
    if (Object.keys(updateData).length === 0) {
        alert("Hech qanday o‘zgarish kiritilmadi.");
        return;
    }
    
    try {
        await apiRequest(`/api/bookings/${bookingId}`, 'PUT', updateData);
        alert('Bandlov muvaffaqiyatli yangilandi!');
        loadMyBookings();  // ro‘yxatni yangilash
    } catch (err) {
        alert(`Xatolik: ${err.message}`);
    }
}

async function bookEvent(eventId) {
    const seats = prompt('Necha joy band qilmoqchisiz? (1-10)', '1');
    if (!seats) return;
    const name = prompt('Ismingiz');
    const email = prompt('Email');
    const phone = prompt('Telefon (+998...)');
    if (!name || !email) return;
    try {
        await apiRequest('/api/bookings', 'POST', {
            eventId, seats: parseInt(seats),
            attendeeName: name, attendeeEmail: email, attendeePhone: phone
        });
        alert('Band qilindi!');
        loadEvents();
    } catch (err) { alert(err.message); }
}


async function showCreateEventForm() {
    const formHtml = `
        <div class="modal" id="createEventModal" style="display:flex">
            <div class="modal-card">
                <span class="close" onclick="closeModal('createEventModal')">&times;</span>
                <h3>➕ Yangi tadbir</h3>
                <form id="createEventForm">
                    <div class="form-group"><input name="title" placeholder="Nomi" required></div>
                    <div class="form-group"><textarea name="description" placeholder="Tavsif"></textarea></div>
                    <div class="form-group"><input type="date" name="date" required></div>
                    <div class="form-group"><input type="time" name="startTime" required></div>
                    <div class="form-group"><input type="time" name="endTime" required></div>
                    <div class="form-group">
                        <select name="location">
                            <option value="Online">Online</option><option value="Tashkent">Tashkent</option>
                            <option value="Samarqand">Samarqand</option><option value="Bukhara">Bukhara</option>
                            <option value="Andijan">Andijan</option><option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group"><input name="address" placeholder="Manzil (Online bo‘lmasa)"></div>
                    <div class="form-group"><input type="number" name="totalSeats" placeholder="Umumiy o‘rinlar" required></div>
                    <div class="form-group"><input type="number" name="price" placeholder="Narx" required></div>
                    <div class="form-group">
                        <select name="category">
                            <option value="Technology">Technology</option><option value="Business">Business</option>
                            <option value="Marketing">Marketing</option><option value="Design">Design</option>
                            <option value="Health">Health</option><option value="Education">Education</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group"><input name="speaker" placeholder="Spiker" required></div>
                    <button type="submit" class="btn-primary">Yaratish</button>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', formHtml);
    document.getElementById('createEventForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const body = Object.fromEntries(formData.entries());
        await apiRequest('/api/events', 'POST', body);
        alert('Tadbir yaratildi!');
        closeModal('createEventModal');
        loadAdminEvents();
        loadEvents();
    });
}

async function showEditEventForm(eventId) {
    const event = (await apiRequest(`/api/events/${eventId}`)).data;
    const formHtml = `
        <div class="modal" id="editEventModal" style="display:flex">
            <div class="modal-card">
                <span class="close" onclick="closeModal('editEventModal')">&times;</span>
                <h3>✏️ Tadbirni tahrirlash</h3>
                <form id="editEventForm">
                    <div class="form-group"><input name="title" value="${event.title}" required></div>
                    <div class="form-group"><textarea name="description">${event.description}</textarea></div>
                    <div class="form-group"><input type="date" name="date" value="${event.date.slice(0,10)}" required></div>
                    <div class="form-group"><input type="time" name="startTime" value="${event.startTime}" required></div>
                    <div class="form-group"><input type="time" name="endTime" value="${event.endTime}" required></div>
                    <div class="form-group">
                        <select name="location">
                            ${['Online','Tashkent','Samarqand','Bukhara','Andijan','Other'].map(l => `<option ${event.location===l?'selected':''}>${l}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group"><input name="address" value="${event.address || ''}"></div>
                    <div class="form-group"><input type="number" name="totalSeats" value="${event.totalSeats}" required></div>
                    <div class="form-group"><input type="number" name="price" value="${event.price}" required></div>
                    <div class="form-group">
                        <select name="category">
                            ${['Technology','Business','Marketing','Design','Health','Education','Other'].map(c => `<option ${event.category===c?'selected':''}>${c}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group"><input name="speaker" value="${event.speaker}" required></div>
                    <button type="submit" class="btn-primary">Saqlash</button>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', formHtml);
    document.getElementById('editEventForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const body = Object.fromEntries(formData.entries());
        await apiRequest(`/api/events/${eventId}`, 'PUT', body);
        alert('Tadbir yangilandi');
        closeModal('editEventModal');
        loadAdminEvents();
        loadEvents();
    });
}


async function showAttendeesList(eventId) {
    try {
        const data = await apiRequest(`/api/bookings/event/${eventId}/attendees`);
        const attendees = data.data;
        let html = `<div class="modal" id="attendeesModal" style="display:flex"><div class="modal-card"><span class="close" onclick="closeModal('attendeesModal')">&times;</span><h3>👥 Ishtirokchilar (${attendees.length})</h3><ul>`;
        attendees.forEach(a => {
            html += `<li><strong>${a.attendeeName}</strong> (${a.attendeeEmail}) - ${a.seats} joy</li>`;
        });
        html += `</ul></div></div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    } catch (err) { alert(err.message); }
}


// Auth modallari
function openAuthModal(type) {
    const modal = document.getElementById('authModal');
    const formDiv = document.getElementById('authForm');
    if (type === 'login') {
        formDiv.innerHTML = `
            <h2>🔐 Kirish</h2>
            <form id="loginForm">
                <div class="form-group"><input type="email" name="email" placeholder="Email" required></div>
                <div class="form-group"><input type="password" name="password" placeholder="Parol" required></div>
                <button type="submit" class="btn-primary">Kirish</button>
            </form>
            <p style="margin-top:1rem">Hisobingiz yo‘q? <a href="#" id="switchRegister">Ro‘yxatdan o‘tish</a></p>
        `;
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const body = Object.fromEntries(formData.entries());
            try {
                const data = await apiRequest('/api/auth/login', 'POST', body);
                token = data.data.token;
                localStorage.setItem('token', token);
                currentUser = data.data;
                updateUIBasedOnAuth();
                modal.style.display = 'none';
                loadEvents();
            } catch (err) { alert(err.message); }
        });
        document.getElementById('switchRegister')?.addEventListener('click', () => openAuthModal('register'));
    } else {
        formDiv.innerHTML = `
            <h2>📝 Ro‘yxatdan o‘tish</h2>
            <form id="registerForm">
                <div class="form-group"><input type="text" name="name" placeholder="To‘liq ism" required></div>
                <div class="form-group"><input type="email" name="email" placeholder="Email" required></div>
                <div class="form-group"><input type="password" name="password" placeholder="Parol (min 6)" required></div>
                <button type="submit" class="btn-primary">Ro‘yxatdan o‘tish</button>
            </form>
            <p style="margin-top:1rem">Hisobingiz bormi? <a href="#" id="switchLogin">Kirish</a></p>
        `;
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const body = Object.fromEntries(formData.entries());
            try {
                await apiRequest('/api/auth/register', 'POST', body);
                alert("Muvaffaqiyatli ro‘yxatdan o‘tdingiz! Endi kiring.");
                openAuthModal('login');
            } catch (err) { alert(err.message); }
        });
        document.getElementById('switchLogin')?.addEventListener('click', () => openAuthModal('login'));
    }
    modal.style.display = 'flex';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.remove();
}

// Navigatsiya
function initNavigation() {
    const btns = document.querySelectorAll('.nav-link');
    btns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const page = btn.dataset.page;
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (page === 'events') await loadEvents();
            else if (page === 'my-bookings') await loadMyBookings();
            else if (page === 'admin-events') await loadAdminEvents();
        });
    });
    document.getElementById('loginBtn')?.addEventListener('click', () => openAuthModal('login'));
    document.getElementById('registerBtn')?.addEventListener('click', () => openAuthModal('register'));
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('token');
        token = null;
        currentUser = null;
        updateUIBasedOnAuth();
        loadEvents();
    });
    document.querySelector('.close')?.addEventListener('click', () => document.getElementById('authModal').style.display = 'none');
    window.onclick = (e) => { if (e.target === document.getElementById('authModal')) document.getElementById('authModal').style.display = 'none'; };
    document.getElementById('menuIcon')?.addEventListener('click', () => document.getElementById('navMenu').classList.toggle('show'));
}

// Admin panel (soddalashtirilgan)
async function loadAdminEvents() {
    if (!token || !['admin', 'organizer'].includes(currentUser?.role)) {
        dynamicContent.innerHTML = '<p>❌ Ruxsat yo‘q</p>';
        return;
    }
    showLoader(true);
    try {
        const eventsData = await apiRequest('/api/events');
        const events = eventsData.data;
        let html = `
            <h2>⚙️ Tadbirlarni boshqarish</h2>
            <button id="createEventBtn" class="btn-primary" style="margin-bottom:1rem">➕ Yangi tadbir</button>
            <div class="events-grid" id="adminEventsGrid"></div>
        `;
        dynamicContent.innerHTML = html;

        const grid = document.getElementById('adminEventsGrid');
        if (events.length === 0) grid.innerHTML = '<p>Hech qanday tadbir yo‘q.</p>';
        events.forEach(ev => {
            const card = document.createElement('div');
            card.className = 'event-card';
            card.innerHTML = `
                <h3>${ev.title}</h3>
                <p>Bo‘sh joy: ${ev.availableSeats}/${ev.totalSeats}</p>
                <p>Sana: ${new Date(ev.date).toLocaleDateString('uz')}</p>
                <div style="display:flex; gap:0.5rem; margin-top:0.5rem">
                    <button class="edit-event btn-outline" data-id="${ev._id}">✏️ Tahrirlash</button>
                    <button class="delete-event btn-outline" data-id="${ev._id}">🗑️ O‘chirish</button>
                    <button class="attendees-btn btn-outline" data-id="${ev._id}">👥 Ishtirokchilar</button>
                </div>
            `;
            grid.appendChild(card);
        });

        // Event listenerlar
        document.querySelectorAll('.edit-event').forEach(btn => {
            btn.addEventListener('click', () => showEditEventForm(btn.dataset.id));
        });
        document.querySelectorAll('.delete-event').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Haqiqatan ham tadbirni o‘chirmoqchimisiz?')) {
                    await apiRequest(`/api/events/${btn.dataset.id}`, 'DELETE');
                    loadAdminEvents();
                    loadEvents();
                }
            });
        });
        document.querySelectorAll('.attendees-btn').forEach(btn => {
            btn.addEventListener('click', () => showAttendeesList(btn.dataset.id));
        });
        document.getElementById('createEventBtn').addEventListener('click', showCreateEventForm);
    } catch (err) {
        dynamicContent.innerHTML = `<div class="error">${err.message}</div>`;
    } finally {
        showLoader(false);
    }
}

// Boshlash
(async () => {
    if (token) {
        try {
            const data = await apiRequest('/api/auth/me');
            currentUser = data.data;
        } catch(e) { localStorage.removeItem('token'); token = null; }
    }
    updateUIBasedOnAuth();
    initNavigation();
    await loadEvents();
    document.getElementById('applyFilterBtn')?.addEventListener('click', loadEvents);
})();