let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

let currentFilter = "all";
let searchText = "";
let currentSort = "newest";

// ================= THEME =================

const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");

// Restore saved theme
const savedTheme = localStorage.getItem("taskManagerTheme") || "light";
root.setAttribute("data-theme", savedTheme);

// Theme toggle
themeToggle?.addEventListener("click", () => {
    const currentTheme = root.getAttribute("data-theme") || "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    root.setAttribute("data-theme", newTheme);
    localStorage.setItem("taskManagerTheme", newTheme);
});

// ================= ELEMENTS =================

const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");

// ================= SMART VOICE TASK CREATION =================

const voiceBtn = document.getElementById("voiceBtn");

const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

const taskDueDateInput = document.getElementById("taskDueDate");
const taskDueTimeInput = document.getElementById("taskDueTime");
const taskPriorityInput = document.getElementById("taskPriority");

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function parseVoiceDate(text) {
    const today = new Date();

    if (/\btomorrow\b/i.test(text)) {
        const date = new Date(today);
        date.setDate(date.getDate() + 1);
        return formatDateForInput(date);
    }

    if (/\btoday\b/i.test(text)) {
        return formatDateForInput(today);
    }

    // DD/MM/YYYY or DD-MM-YYYY
    const numericDate = text.match(
        /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/
    );

    if (numericDate) {
        const day = numericDate[1].padStart(2, "0");
        const month = numericDate[2].padStart(2, "0");
        const year = numericDate[3];

        return `${year}-${month}-${day}`;
    }

    return "";
}

function parseVoiceTime(text) {
    const match = text.match(
        /\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i
    );

    if (!match) return "";

    let hour = parseInt(match[1], 10);
    const minute = match[2] || "00";
    const period = match[3].toLowerCase();

    if (period === "pm" && hour !== 12) {
        hour += 12;
    }

    if (period === "am" && hour === 12) {
        hour = 0;
    }

    return `${String(hour).padStart(2, "0")}:${minute}`;
}

function parseVoicePriority(text) {
    const lower = text.toLowerCase();

    if (
        lower.includes("high priority") ||
        lower.includes("priority high") ||
        lower.includes("urgent")
    ) {
        return "high";
    }

    if (
        lower.includes("low priority") ||
        lower.includes("priority low")
    ) {
        return "low";
    }

    if (
        lower.includes("medium priority") ||
        lower.includes("priority medium")
    ) {
        return "medium";
    }

    return "";
}

function cleanVoiceTitle(text) {
    return text
        .replace(/\b(high|medium|low)\s+priority\b/gi, "")
        .replace(/\bpriority\s+(high|medium|low)\b/gi, "")
        .replace(/\burgent\b/gi, "")
        .replace(/\btoday\b/gi, "")
        .replace(/\btomorrow\b/gi, "")
        .replace(/\b(?:at\s*)?\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi, "")
        .replace(/\bon\s+\d{1,2}[\/-]\d{1,2}[\/-]\d{4}\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();
}

if (SpeechRecognition) {

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    voiceBtn?.addEventListener("click", () => {

        try {
            recognition.start();

            voiceBtn.classList.add("is-listening");
            voiceBtn.textContent = "🎙️ Listening...";
        } catch (error) {
            console.log("Voice recognition already running.");
        }
    });

    recognition.addEventListener("result", event => {

        const transcript =
            event.results[0][0].transcript.trim();

        console.log("Voice command:", transcript);

        // Parse priority
        const priority = parseVoicePriority(transcript);

        if (priority) {
            taskPriorityInput.value = priority;
        }

        // Parse date
        const date = parseVoiceDate(transcript);

        if (date) {
            taskDueDateInput.value = date;
        }

        // Parse time
        const time = parseVoiceTime(transcript);

        if (time) {
            taskDueTimeInput.value = time;
        }

        // Clean command and keep only task title
        const title = cleanVoiceTitle(transcript);

        taskTitle.value = title;

        voiceBtn.textContent = "✓ Voice added";

        setTimeout(() => {
            voiceBtn.textContent = "🎙️ Voice";
        }, 1500);
    });

    recognition.addEventListener("end", () => {
        voiceBtn.classList.remove("is-listening");

        if (voiceBtn.textContent.includes("Listening")) {
            voiceBtn.textContent = "🎙️ Voice";
        }
    });

    recognition.addEventListener("error", event => {

        console.log("Voice error:", event.error);

        voiceBtn.classList.remove("is-listening");
        voiceBtn.textContent = "🎙️ Voice";

        alert(
            "Voice recognition could not understand the command. Please try again."
        );
    });

} else {

    if (voiceBtn) {
        voiceBtn.disabled = true;
        voiceBtn.textContent = "🎙️ Not supported";
    }
}
const taskDueDate = document.getElementById("taskDueDate");
const taskDueTime = document.getElementById("taskDueTime");
const taskPriority = document.getElementById("taskPriority");
const taskList = document.getElementById("taskList");
const searchInput = document.getElementById("searchInput");

// ================= STORAGE =================

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// ================= STATS =================
function updateStats() {
    const total = tasks.length;

    const completed = tasks.filter(
        task => task.completed
    ).length;

    const active = total - completed;

    const now = new Date();

    const overdue = tasks.filter(task => {

        if (task.completed || !task.dueDate) {
            return false;
        }

        const dueDateTime = task.dueTime
            ? new Date(`${task.dueDate}T${task.dueTime}`)
            : new Date(`${task.dueDate}T23:59:59`);

        return dueDateTime < now;

    }).length;

    const percentage =
        total === 0
            ? 0
            : Math.round((completed / total) * 100);


    document.getElementById("statTotal").textContent =
        total;

    document.getElementById("statActive").textContent =
        active;

    document.getElementById("statCompleted").textContent =
        completed;

    document.getElementById("statOverdue").textContent =
        overdue;


    const percentageElement =
        document.getElementById("completionPercentage");

    const progressBar =
        document.getElementById("completionProgressBar");


    if (percentageElement) {
        percentageElement.textContent =
            `${percentage}%`;
    }

    if (progressBar) {
        progressBar.style.width =
            `${percentage}%`;
    }
}
// ================= RENDER TASKS =================

function renderTasks() {
    taskList.innerHTML = "";

    const taskListCount = document.getElementById("taskListCount");
    const emptyState = document.getElementById("emptyState");

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title
            .toLowerCase()
            .includes(searchText.toLowerCase());

        const matchesFilter =
            currentFilter === "all" ||
            (currentFilter === "active" && !task.completed) ||
            (currentFilter === "completed" && task.completed);

        return matchesSearch && matchesFilter;
    });

    const priorityOrder = {
        high: 3,
        medium: 2,
        low: 1
    };

    filteredTasks.sort((a, b) => {
        if (currentSort === "newest") {
            return b.id - a.id;
        }

        if (currentSort === "oldest") {
            return a.id - b.id;
        }

        if (currentSort === "priorityHigh") {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        }

        if (currentSort === "priorityLow") {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }

        if (currentSort === "dateSoon") {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        }

        if (currentSort === "dateLate") {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(b.dueDate) - new Date(a.dueDate);
        }

        return 0;
    });

    if (taskListCount) {
        taskListCount.textContent =
            `Showing ${filteredTasks.length} of ${tasks.length} tasks`;
    }

    if (emptyState) {
        emptyState.hidden = filteredTasks.length !== 0;
    }

    filteredTasks.forEach((task, index) => {

        // ---------- OVERDUE CHECK ----------
        let isOverdue = false;

        if (task.dueDate && !task.completed) {
            const now = new Date();

            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const day = String(now.getDate()).padStart(2, "0");

            const currentDate = `${year}-${month}-${day}`;

            const currentTime =
                String(now.getHours()).padStart(2, "0") +
                ":" +
                String(now.getMinutes()).padStart(2, "0");

            if (task.dueDate < currentDate) {
                isOverdue = true;
            } else if (
                task.dueDate === currentDate &&
                task.dueTime &&
                task.dueTime < currentTime
            ) {
                isOverdue = true;
            }
        }

        // ---------- TASK CARD ----------
        const li = document.createElement("li");

        li.className =
            `task-item
            ${task.completed ? "is-complete" : ""}
            ${isOverdue ? "task-item--overdue" : ""}
            priority-${task.priority || "medium"}`;

        li.style.animationDelay = `${index * 0.05}s`;

        // ---------- DUE DATE ----------
        let dueHTML = "";

        if (task.dueDate) {
            const dateObject = new Date(task.dueDate + "T00:00:00");

            const formattedDate = dateObject.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
            });

            dueHTML = `
                <span class="due-date ${isOverdue ? "due-date--overdue" : ""}">
                    <svg class="icon" aria-hidden="true"
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round">
                        <rect x="3" y="5" width="18" height="16" rx="2" />
                        <path d="M16 3v4M8 3v4M3 10h18" />
                    </svg>

                    ${isOverdue ? "Overdue" : "Due"} ${formattedDate}
                    ${task.dueTime ? ` • ${task.dueTime}` : ""}
                </span>
            `;
        }

        // ---------- PRIORITY ----------
        const priorityLabel =
            task.priority === "high"
                ? "High priority"
                : task.priority === "low"
                    ? "Low priority"
                    : "Medium priority";

        // ---------- CARD HTML ----------
        li.innerHTML = `
            <input
                type="checkbox"
                class="task-item__checkbox"
                ${task.completed ? "checked" : ""}
                aria-label="Complete task: ${task.title}"
            >

            <div class="task-item__body">

                <strong class="task-item__title">
                    ${task.title}
                </strong>

                <div class="task-item__meta">

                    <span class="badge badge--${task.priority || "medium"}">
                        <svg
                            class="badge__dot"
                            aria-hidden="true"
                            viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="4" />
                        </svg>

                        ${priorityLabel}
                    </span>

                    ${dueHTML}

                </div>

            </div>

            <div class="task-item__actions">

                <button
                    type="button"
                    class="icon-btn"
                    data-action="edit"
                    aria-label="Edit task: ${task.title}"
                    title="Edit task">

                    <svg class="icon"
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        width="17"
                        height="17"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>

                </button>

                <button
                    type="button"
                    class="icon-btn icon-btn--danger"
                    data-action="delete"
                    aria-label="Delete task: ${task.title}"
                    title="Delete task">

                    <svg class="icon"
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        width="17"
                        height="17"
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round">
                        <path d="M3 6h18" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>

                </button>

            </div>
        `;

        const checkbox = li.querySelector(".task-item__checkbox");
        const editBtn = li.querySelector('[data-action="edit"]');
        const deleteActionBtn = li.querySelector('[data-action="delete"]');

        // ---------- EDIT ----------
        editBtn.addEventListener("click", () => {

            const newTitle = prompt("Edit task:", task.title);

            if (newTitle === null) return;

            const updatedTitle = newTitle.trim();

            if (!updatedTitle) {
                alert("Task title cannot be empty.");
                return;
            }

            task.title = updatedTitle;

            saveTasks();
            renderTasks();
        });

        // ---------- COMPLETE ----------
        checkbox.addEventListener("change", () => {

            task.completed = checkbox.checked;

            saveTasks();
            renderTasks();
        });

        // ---------- DELETE ----------
        deleteActionBtn.addEventListener("click", () => {

            li.classList.add("task-removing");

            setTimeout(() => {

                tasks = tasks.filter(t => t.id !== task.id);

                saveTasks();
                renderTasks();

            }, 220);
        });

        taskList.appendChild(li);
    });

    updateStats();
}

// ================= ADD TASK =================

taskForm.addEventListener("submit", event => {

    event.preventDefault();

const title = taskTitle.value.trim();
const dueDate = taskDueDate.value;
const dueTime = taskDueTime.value;

if (dueDate) {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const today = `${year}-${month}-${day}`;

    const currentTime =
        String(now.getHours()).padStart(2, "0") +
        ":" +
        String(now.getMinutes()).padStart(2, "0");

    if (dueDate < today) {
        alert("Due date cannot be in the past.");
        return;
    }

    if (dueDate === today && dueTime && dueTime < currentTime) {
        alert("Due time cannot be in the past.");
        return;
    }
}

    if (!title) {
        alert("Please enter a task.");
        return;
    }

    const newTask = {
        id: Date.now(),
        title: title,
        dueDate: taskDueDate.value,
        dueTime: taskDueTime.value,
        priority: taskPriority.value,
        completed: false
    };

    tasks.unshift(newTask);

    saveTasks();
    renderTasks();

    taskForm.reset();
});

// ================= SEARCH =================

searchInput?.addEventListener("input", () => {

    searchText = searchInput.value;

    renderTasks();
});

// ================= FILTERS =================

document.getElementById("filterAll")?.addEventListener("click", () => {

    currentFilter = "all";

    renderTasks();
});

document.getElementById("filterActive")?.addEventListener("click", () => {

    currentFilter = "active";

    renderTasks();
});

document.getElementById("filterCompleted")?.addEventListener("click", () => {

    currentFilter = "completed";

    renderTasks();
});

// ================= START APP =================

renderTasks();
const clearCompletedBtn = document.getElementById("clearCompletedBtn");

clearCompletedBtn?.addEventListener("click", () => {

    tasks = tasks.filter(task => !task.completed);

    saveTasks();
    renderTasks();
});
// ================= EXPORT =================

const exportBtn = document.getElementById("exportBtn");

exportBtn?.addEventListener("click", () => {

    const data = JSON.stringify(tasks, null, 2);

    const blob = new Blob([data], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "task-manager-backup.json";

    a.click();

    URL.revokeObjectURL(url);
});


// ================= IMPORT =================

const importInput = document.getElementById("importInput");

importInput?.addEventListener("change", event => {

    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = e => {

        try {

            const importedTasks = JSON.parse(e.target.result);

            if (!Array.isArray(importedTasks)) {
                throw new Error("Invalid file");
            }

            tasks = importedTasks;

            saveTasks();
            renderTasks();

            alert("Tasks imported successfully!");

        } catch (error) {

            alert("Invalid backup file.");

        }

        importInput.value = "";
    };

    reader.readAsText(file);
});
const sortSelect = document.getElementById("sortSelect");

sortSelect?.addEventListener("change", () => {
    currentSort = sortSelect.value;
    renderTasks();
});

// ================= AUTO OVERDUE CHECK =================

setInterval(() => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const currentDate = `${year}-${month}-${day}`;

    const currentTime =
        String(now.getHours()).padStart(2, "0") +
        ":" +
        String(now.getMinutes()).padStart(2, "0");

    document.querySelectorAll(".task-item").forEach((item, index) => {

        const visibleTasks = tasks.filter(task => {

            const matchesSearch = task.title
                .toLowerCase()
                .includes(searchText.toLowerCase());

            const matchesFilter =
                currentFilter === "all" ||
                (currentFilter === "active" && !task.completed) ||
                (currentFilter === "completed" && task.completed);

            return matchesSearch && matchesFilter;
        });

        const task = visibleTasks[index];

        if (!task || task.completed || !task.dueDate) return;

        const overdue =
            task.dueDate < currentDate ||
            (
                task.dueDate === currentDate &&
                task.dueTime &&
                task.dueTime < currentTime
            );

        item.classList.toggle("task-item--overdue", overdue);
    });

}, 1000);

// ================= NOTIFICATIONS =================

let notifiedTasks = new Set();

function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
}

function checkReminders() {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const now = new Date();

    tasks.forEach(task => {

        if (task.completed || !task.dueDate || !task.dueTime) return;

        const dueDateTime = new Date(
            `${task.dueDate}T${task.dueTime}`
        );

        if (
            now >= dueDateTime &&
            !notifiedTasks.has(task.id)
        ) {

            new Notification("⏰ Task Reminder", {
                body: `"${task.title}" is due now!`,
                icon: "./favicon.ico"
            });

            notifiedTasks.add(task.id);
        }
    });
}

requestNotificationPermission();

setInterval(checkReminders, 1000);