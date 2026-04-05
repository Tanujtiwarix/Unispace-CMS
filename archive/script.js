// 1. DYNAMIC GREETING & CLOCK LOGIC
function updateClock() {
    const now = new Date();
    
    // Update Clock
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    document.getElementById('live-clock').innerText = timeStr;
    
    // Update Date
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('live-date').innerText = dateStr;

    // UPDATE GREETING BASED ON REAL TIME
    const hour = now.getHours();
    const greetingEl = document.getElementById('dynamic-greeting');
    
    if (hour < 12) greetingEl.innerText = "Good Morning, Student!";
    else if (hour < 17) greetingEl.innerText = "Good Afternoon, Student!";
    else if (hour < 21) greetingEl.innerText = "Good Evening, Student!";
    else greetingEl.innerText = "Good Night, Student!";
}

setInterval(updateClock, 1000);
updateClock();

// 2. PAGE NAVIGATION DATA
const pageData = {
    dashboard: `
        <div class="dashboard-grid">
            <div class="card">
                <div class="card-header"><i class="ri-calendar-todo-line"></i> Today's Schedule</div>
                <div style="height:180px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#94a3b8; border:2px dashed #e2e8f0; border-radius:15px;">
                    <i class="ri-book-open-line" style="font-size:40px; margin-bottom:10px"></i>
                    <p>No classes scheduled for today.</p>
                </div>
            </div>
            <div class="card">
                <div class="card-header"><i class="ri-line-chart-line"></i> Attendance Summary</div>
                <div class="att-box">
                    <div class="att-val">79%</div>
                    <p style="font-size:12px; color:#64748b">Overall Attendance</p>
                </div>
                <div class="prog-row">
                    <div class="prog-labels"><span>Computational Mathematics</span> <span style="color:#ef4444">64%</span></div>
                    <div class="prog-bg"><div class="prog-fill" style="width:64%; background:#ef4444"></div></div>
                </div>
                <div class="prog-row">
                    <div class="prog-labels"><span>Python Programming</span> <span>89%</span></div>
                    <div class="prog-bg"><div class="prog-fill" style="width:89%"></div></div>
                </div>
            </div>
            <div class="card">
                <div class="card-header"><i class="ri-megaphone-line"></i> Announcements</div>
                <div style="padding-bottom:10px; border-bottom:1px solid #f1f5f9; margin-bottom:10px">
                    <strong style="font-size:14px">Semester End Exam Dates</strong>
                    <p style="font-size:12px; color:gray">Schedule released for B.Tech CSE 1st Year.</p>
                </div>
                <div>
                    <strong style="font-size:14px">Industrial Visit</strong>
                    <p style="font-size:12px; color:gray">TCS Visit confirmed for next Friday.</p>
                </div>
            </div>
            <div class="card">
                <div class="card-header"><i class="ri-notification-3-line"></i> Notifications</div>
                <div style="background:#fee2e2; color:#b91c1c; padding:10px; border-radius:8px; font-size:13px; margin-bottom:10px">
                    ⚠️ Low Attendance Alert in Mathematics!
                </div>
                <div style="background:#e0e7ff; color:#4338ca; padding:10px; border-radius:8px; font-size:13px">
                    ℹ️ New study material uploaded for Python.
                </div>
            </div>
        </div>
    `,
    classrooms: `
        <div class="room-grid">
            ${[101, 102, 103, 104, 105, 106].map(n => `
                <div class="room-card">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px">
                        <strong style="font-size:20px">D${n}</strong>
                        <span style="color:var(--green); font-weight:bold; font-size:12px">● Free</span>
                    </div>
                    <p style="font-size:12px; color:gray; margin-bottom:15px">Science Block • Floor 1</p>
                    <div style="font-size:12px; color:#475569">👤 60 seats • 📽️ Projector • ❄️ AC</div>
                    <button class="btn-book" onclick="alert('Booking Request Sent for D${n}')">+ Register Room</button>
                </div>
            `).join('')}
        </div>
    `,
    map: `
        <div class="card">
            <div class="card-header"><i class="ri-map-pin-2-line"></i> Campus Map - D Block</div>
            <div style="height:350px; background:#f1f5f9; border-radius:15px; border:2px dashed #cbd5e1; display:flex; align-items:center; justify-content:center">
                 <p style="color:#64748b">Interactive Map Interface (F1 - F4)</p>
            </div>
        </div>
    `
};

// 3. NAVIGATION FUNCTION
function navigate(view, btn) {
    // Update Content
    const content = document.getElementById('page-content');
    content.innerHTML = pageData[view] || `<div class="card"><h2>${view} coming soon...</h2></div>`;
    
    // Update Sidebar Active UI
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    btn.classList.add('active');

    // Update Header Title if not Dashboard
    const title = document.getElementById('dynamic-greeting');
    if(view !== 'dashboard') {
        title.innerText = view.charAt(0).toUpperCase() + view.slice(1);
    } else {
        updateClock(); // Resets to Greeting
    }
}

// Initial Load
window.onload = () => {
    document.getElementById('page-content').innerHTML = pageData.dashboard;
};

// Sample Data
const attendanceData = [
    { id: 1, name: "Computational Mathematics", code: "MATH101", attended: 18, total: 28 },
    { id: 2, name: "Object Oriented Programming", code: "CSE201", attended: 25, total: 30 },
    { id: 3, name: "Data Structures", code: "CSE202", attended: 22, total: 24 }
];

function updateDashboard() {
    const container = document.getElementById('subject-container');
    let grandAttended = 0;
    let grandTotal = 0;

    container.innerHTML = ""; // Clear list

    attendanceData.forEach(sub => {
        const perc = Math.round((sub.attended / sub.total) * 100);
        grandAttended += sub.attended;
        grandTotal += sub.total;

        container.innerHTML += `
            <div class="subject-card">
                <div>
                    <strong>${sub.name}</strong> <small>${sub.code}</small>
                    <div style="font-size: 0.8em; color: gray;">${sub.attended}/${sub.total} classes</div>
                </div>
                <div style="text-align: right">
                    <span style="color: ${perc < 75 ? 'red' : 'green'}">${perc}%</span>
                    <button onclick="logClass(${sub.id})">+</button>
                </div>
            </div>
        `;
    });

    // Update Top Summary
    document.getElementById('total-attended').innerText = grandAttended;
    document.getElementById('total-classes').innerText = grandTotal;
    document.getElementById('total-missed').innerText = grandTotal - grandAttended;
    document.getElementById('overall-perc').innerText = Math.round((grandAttended / grandTotal) * 100) + "%";
}

// Function to simulate marking a class as attended
function logClass(id) {
    const subject = attendanceData.find(s => s.id === id);
    subject.attended++;
    subject.total++;
    updateDashboard();
}

// Initialize
updateDashboard();