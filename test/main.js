// ===== 1) VALUES & VARIABLES =====
const tableBody = document.querySelector("#table tbody"); // constant reference
const totalEl = document.querySelector("#total");
const descInput = document.querySelector("#desc");
const amountInput = document.querySelector("#amount");
const categorySelect = document.querySelector("#category");
const addBtn = document.querySelector("#add");
const searchInput = document.querySelector("#search");
const filterSelect = document.querySelector("#filter");
const clearBtn = document.querySelector("#clear");

// Use 'let' when value changes; 'const' when it shouldn't be reassigned.
let items = []; // our state: an array of expense objects

// ===== 2) LOAD/SAVE (objects, JSON, localStorage) =====
const STORAGE_KEY = "expenses_v1";

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  items = raw ? JSON.parse(raw) : [];
}
load(); // load once on startup

// ===== 3) ADDING ITEMS (functions, objects) =====
function addItem(desc, amount, category) {
  // Guard clauses (conditionals)
  if (!desc || !amount || amount <= 0) {
    alert("Please enter a description and a positive amount.");
    return;
  }
  // An "object" groups data
  const item = {
    id: crypto.randomUUID(), // unique id (string)
    desc: desc.trim(),
    amount: Number(amount),
    category
  };
  items.push(item); // Arrays grow with push()
  save();
  render();
}

// ===== 4) REMOVING ITEMS (array methods) =====
function removeItem(id) {
  // filter() returns a new array with items that pass the test
  items = items.filter(it => it.id !== id);
  save();
  render();
}

// ===== 5) RENDER (DOM, loops, template literals) =====
function format(n) {
  return n.toFixed(2);
}

function render() {
  // Derived view: search & filter without mutating original data
  const q = searchInput.value.toLowerCase();
  const cat = filterSelect.value;

  const visible = items.filter(it => {
    const matchText = it.desc.toLowerCase().includes(q);
    const matchCat = !cat || it.category === cat;
    return matchText && matchCat;
  });

  // Build table rows (map each object -> HTML string)
  tableBody.innerHTML = visible.map(it => `
    <tr>
      <td>${it.desc}</td>
      <td>${it.category}</td>
      <td class="right">${format(it.amount)}</td>
      <td class="right"><button data-id="${it.id}">✕</button></td>
    </tr>
  `).join("");

  // Calculate total (reduce accumulates values)
  const total = visible.reduce((sum, it) => sum + it.amount, 0);
  totalEl.textContent = format(total);
}

// ===== 6) EVENTS (DOM events, callbacks) =====
addBtn.addEventListener("click", () => {
  addItem(descInput.value, amountInput.value, categorySelect.value);
  // reset inputs
  descInput.value = "";
  amountInput.value = "";
  descInput.focus();
});

// Submit on Enter in amount/desc fields
[descInput, amountInput].forEach(el => {
  el.addEventListener("keydown", e => {
    if (e.key === "Enter") addBtn.click();
  });
});

// Event delegation for delete buttons (single listener)
tableBody.addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") {
    removeItem(e.target.dataset.id);
  }
});

// Live search & filter
searchInput.addEventListener("input", render);
filterSelect.addEventListener("change", render);

// Clear all (confirm first)
clearBtn.addEventListener("click", () => {
  if (confirm("Clear ALL expenses?")) {
    items = [];
    save();
    render();
  }
});

// ===== 7) INITIAL RENDER =====
render();

/*
LEARNINGS YOU JUST USED:
- Values: numbers, strings, booleans
- Variables: let vs const
- Objects & Arrays: item objects in an items[] array
- Functions: small named helpers (addItem, removeItem, render, save)
- Conditionals: guard clauses, if checks
- Array methods: push, filter, map, reduce
- DOM: querySelector, innerHTML, event listeners
- Events: click, input, keydown (Enter)
- State & Persistence: in-memory array + localStorage (JSON)
*/
