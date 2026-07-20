// StockMind AI - Application Logic
document.addEventListener("DOMContentLoaded", () => {
  // --- State Management ---
  const state = {
    items: [],
    currentTab: "overview",
    searchQuery: "",
    filters: {
      category: "all",
      status: "all"
    },
    sort: {
      key: "name",
      direction: "asc"
    },
    theme: localStorage.getItem("theme") || "dark",
    shelf: {
      selectedId: "",
      currentQty: 0,
      maxQty: 8,
      logs: [],
      activeSlide: 0,
      isReordering: false
    },
    notifications: {
      email: localStorage.getItem("alert_email") || "dinesh@example.com",
      mobile: localStorage.getItem("alert_mobile") || "+919876543210",
      twilioSid: localStorage.getItem("alert_twilio_sid") || "",
      twilioToken: localStorage.getItem("alert_twilio_token") || "",
      twilioFrom: localStorage.getItem("alert_twilio_from") || "",
      emailjsService: localStorage.getItem("alert_emailjs_service") || "",
      emailjsTemplate: localStorage.getItem("alert_emailjs_template") || "",
      emailjsKey: localStorage.getItem("alert_emailjs_key") || "",
      enableLowStockSMS: localStorage.getItem("alert_enable_low_stock_sms") !== "false", // Default to true
      enableLowStockEmail: localStorage.getItem("alert_enable_low_stock_email") !== "false", // Default to true
      enableExpirySMS: localStorage.getItem("alert_enable_expiry_sms") !== "false",
      enableExpiryEmail: localStorage.getItem("alert_enable_expiry_email") !== "false",
      transportType: localStorage.getItem("alert_transport_type") || "client",
      history: (() => {
        try {
          const hist = JSON.parse(localStorage.getItem("alert_history") || "[]");
          return Array.isArray(hist) ? hist : [];
        } catch (e) {
          return [];
        }
      })()
    }
  };

  // --- Theme Initializer ---
  if (state.theme === "light") {
    document.body.classList.add("light-theme");
    updateThemeIcon("light");
  } else {
    updateThemeIcon("dark");
  }

  // --- API Client ---
  const API = {
    isLocalStorageFallback: false,

    getFallbackData() {
      if (!localStorage.getItem("items_db")) {
        const seedData = [
          {
            "id": "item-1",
            "name": "Organic Almond Milk (1L)",
            "sku": "FOOD-ALM-100",
            "category": "Food & Beverage",
            "quantity": 12,
            "price": 4.99,
            "reorderLevel": 20,
            "location": "Zone B - Cold Storage",
            "expiryDate": "2026-07-20",
            "lastUpdated": "2026-07-06T14:30:00Z",
            "description": "Organic, unsweetened almond milk. Keep refrigerated.",
            "salesForecast": [45, 55, 60, 50, 52, 65]
          },
          {
            "id": "item-2",
            "name": "Smart Fitness Watch V2",
            "sku": "ELEC-SMW-202",
            "category": "Electronics",
            "quantity": 85,
            "price": 129.99,
            "reorderLevel": 15,
            "location": "Zone A - High Security Shelf 2",
            "expiryDate": null,
            "lastUpdated": "2026-07-07T08:15:00Z",
            "description": "Waterproof fitness tracker with heart rate and sleep monitor.",
            "salesForecast": [120, 140, 160, 180, 200, 220]
          },
          {
            "id": "item-3",
            "name": "Matte Lipstick - Crimson Red",
            "sku": "COSM-LIP-RED",
            "category": "Wellness & Cosmetics",
            "quantity": 150,
            "price": 18.50,
            "reorderLevel": 30,
            "location": "Zone C - Row 4 Shelf 1",
            "expiryDate": "2027-12-01",
            "lastUpdated": "2026-07-05T11:20:00Z",
            "description": "Long-lasting matte finish lipstick, velvet texture.",
            "salesForecast": [80, 85, 90, 75, 80, 95]
          },
          {
            "id": "item-4",
            "name": "Ergonomic Office Chair",
            "sku": "FURN-OFF-CHR",
            "category": "Furniture",
            "quantity": 4,
            "price": 249.99,
            "reorderLevel": 5,
            "location": "Zone D - Bulky Storage",
            "expiryDate": null,
            "lastUpdated": "2026-07-06T16:45:00Z",
            "description": "Mesh high-back chair with adjustable armrests and lumbar support.",
            "salesForecast": [12, 15, 10, 18, 14, 20]
          },
          {
            "id": "item-5",
            "name": "Greek Yogurt - Blueberry (150g)",
            "sku": "FOOD-YOG-BLU",
            "category": "Food & Beverage",
            "quantity": 8,
            "price": 1.79,
            "reorderLevel": 25,
            "location": "Zone B - Cold Storage",
            "expiryDate": "2026-07-12",
            "lastUpdated": "2026-07-07T09:00:00Z",
            "description": "Low fat, high protein Greek yogurt with fresh blueberries.",
            "salesForecast": [90, 110, 105, 120, 130, 140]
          },
          {
            "id": "item-6",
            "name": "Organic Honey (500g)",
            "sku": "FOOD-HON-RAW",
            "category": "Food & Beverage",
            "quantity": 40,
            "price": 8.99,
            "reorderLevel": 10,
            "location": "Zone C - Row 1 Shelf 3",
            "expiryDate": "2028-06-30",
            "lastUpdated": "2026-07-04T10:00:00Z",
            "description": "100% pure raw organic honey, cold-filtered.",
            "salesForecast": [30, 28, 35, 33, 40, 42]
          },
          {
            "id": "item-7",
            "name": "Wireless Charging Pad",
            "sku": "ELEC-WCP-015",
            "category": "Electronics",
            "quantity": 18,
            "price": 24.99,
            "reorderLevel": 20,
            "location": "Zone A - Row 2 Shelf 4",
            "expiryDate": null,
            "lastUpdated": "2026-07-07T07:30:00Z",
            "description": "15W fast wireless charger compatible with Qi-enabled devices.",
            "salesForecast": [50, 45, 60, 55, 65, 70]
          },
          {
            "id": "item-8",
            "name": "Moisturizing Cream (100ml)",
            "sku": "COSM-MCR-100",
            "category": "Wellness & Cosmetics",
            "quantity": 5,
            "price": 29.50,
            "reorderLevel": 15,
            "location": "Zone C - Row 4 Shelf 2",
            "expiryDate": "2026-08-30",
            "lastUpdated": "2026-07-06T15:20:00Z",
            "description": "Hydrating face cream with hyaluronic acid and vitamin E.",
            "salesForecast": [40, 38, 42, 45, 48, 50]
          },
          {
            "id": "item-9",
            "name": "Mechanical Keyboard Pro",
            "sku": "ELEC-MKB-80",
            "category": "Electronics",
            "quantity": 35,
            "price": 89.99,
            "reorderLevel": 10,
            "location": "Zone A - Row 1 Shelf 1",
            "expiryDate": null,
            "lastUpdated": "2026-07-06T09:10:00Z",
            "description": "Tenkeyless mechanical keyboard with hot-swappable red switches.",
            "salesForecast": [25, 30, 28, 35, 40, 45]
          },
          {
            "id": "item-10",
            "name": "Vitamin C Capsules (90ct)",
            "sku": "WELL-VIT-C90",
            "category": "Wellness & Cosmetics",
            "quantity": 110,
            "price": 14.99,
            "reorderLevel": 25,
            "location": "Zone C - Row 3 Shelf 2",
            "expiryDate": "2026-10-15",
            "lastUpdated": "2026-07-05T14:00:00Z",
            "description": "Dietary supplement for immune support. 1000mg per capsule.",
            "salesForecast": [70, 75, 80, 85, 90, 88]
          }
        ];
        localStorage.setItem("items_db", JSON.stringify(seedData));
      }
      return JSON.parse(localStorage.getItem("items_db"));
    },

    saveFallbackData(data) {
      localStorage.setItem("items_db", JSON.stringify(data));
    },

    async fetchItems() {
      try {
        const res = await fetch("/api/items");
        if (!res.ok) throw new Error();
        state.items = await res.json();
        this.isLocalStorageFallback = false;
        return state.items;
      } catch (err) {
        this.isLocalStorageFallback = true;
        state.items = this.getFallbackData();
        return state.items;
      }
    },

    async saveItem(itemData, id = null) {
      if (this.isLocalStorageFallback) {
        let localData = this.getFallbackData();
        if (id) {
          const index = localData.findIndex(x => x.id === id);
          if (index !== -1) {
            localData[index] = { ...localData[index], ...itemData, lastUpdated: new Date().toISOString() };
          }
        } else {
          const newId = `item-${Date.now()}`;
          const newItem = {
            id: newId,
            ...itemData,
            sku: itemData.sku.toUpperCase(),
            lastUpdated: new Date().toISOString(),
            salesForecast: [10, 15, 12, 18, 20, 25]
          };
          localData.push(newItem);
        }
        this.saveFallbackData(localData);
        showToast(id ? "Product updated successfully (Offline Mode)" : "Product created successfully (Offline Mode)", "success");
        await this.fetchItems();
        const savedItem = state.items.find(x => x.sku.toUpperCase() === itemData.sku.toUpperCase());
        if (savedItem) checkStockAlerts(savedItem);
        return true;
      }

      try {
        const url = id ? `/api/items/${id}` : "/api/items";
        const method = id ? "PUT" : "POST";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itemData)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to save item");
        }
        showToast(id ? "Product updated successfully" : "Product created successfully", "success");
        await this.fetchItems();
        const savedItem = state.items.find(x => x.sku.toUpperCase() === itemData.sku.toUpperCase());
        if (savedItem) checkStockAlerts(savedItem);
        return true;
      } catch (err) {
        showToast(err.message, "error");
        return false;
      }
    },

    async deleteItem(id) {
      if (this.isLocalStorageFallback) {
        let localData = this.getFallbackData();
        const nextData = localData.filter(x => x.id !== id);
        this.saveFallbackData(nextData);
        showToast("Product deleted successfully (Offline Mode)", "success");
        await this.fetchItems();
        return true;
      }

      try {
        const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete item");
        showToast("Product deleted successfully", "success");
        await this.fetchItems();
        return true;
      } catch (err) {
        showToast(err.message, "error");
        return false;
      }
    },

    async triggerReorder(id) {
      if (this.isLocalStorageFallback) {
        let localData = this.getFallbackData();
        const index = localData.findIndex(x => x.id === id);
        if (index !== -1) {
          const item = localData[index];
          const reorderQty = item.reorderLevel * 2 || 50;
          item.quantity += reorderQty;
          item.lastUpdated = new Date().toISOString();
          this.saveFallbackData(localData);
          showToast(`Reorder completed! Added +${reorderQty} units (Offline Mode).`, "success");
        }
        await this.fetchItems();
        return true;
      }

      try {
        const res = await fetch("/api/reorder/trigger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id })
        });
        if (!res.ok) throw new Error("Failed to trigger reorder");
        const data = await res.json();
        showToast(`Reorder completed! Added +${data.reorderQty} units.`, "success");
        await this.fetchItems();
        return true;
      } catch (err) {
        showToast(err.message, "error");
        return false;
      }
    },

    async applyDiscount(id, discountPercent) {
      if (this.isLocalStorageFallback) {
        let localData = this.getFallbackData();
        const index = localData.findIndex(x => x.id === id);
        if (index !== -1) {
          const item = localData[index];
          const discountFactor = (100 - parseFloat(discountPercent)) / 100.0;
          item.price = Math.round((item.price * discountFactor) * 100) / 100;
          item.lastUpdated = new Date().toISOString();
          this.saveFallbackData(localData);
          showToast(`Discount applied! (Offline Mode)`, "success");
        }
        await this.fetchItems();
        return true;
      }

      try {
        const res = await fetch("/api/expiry/discount", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, discountPercent })
        });
        if (!res.ok) throw new Error("Failed to apply discount");
        showToast(`Discount applied! Price reduced.`, "success");
        await this.fetchItems();
        return true;
      } catch (err) {
        showToast(err.message, "error");
        return false;
      }
    }
  };

  // --- DOM Elements & Listeners ---
  const pageTitle = document.getElementById("pageTitle");
  const contentArea = document.getElementById("contentArea");
  const globalSearch = document.getElementById("globalSearch");
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const notifBtn = document.getElementById("notifBtn");
  const notifBadge = document.getElementById("notifBadge");

  // Tab Navigation Links
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      navItems.forEach(n => n.classList.remove("active"));
      item.classList.add("active");
      state.currentTab = item.dataset.tab;
      
      // Update heading title based on tab
      const tabTitles = {
        overview: "Dashboard Overview",
        inventory: "Inventory Manager",
        forecast: "Predictive Forecasting",
        locations: "Warehouse Locations & Zoning",
        expiry: "Expiry Monitoring & Promotions",
        reorder: "Auto-Reorder Panel",
        shelf: "IoT Predictive Shelf Prototype",
        alerts: "Notification & Alerts Configuration"
      };
      pageTitle.textContent = tabTitles[state.currentTab] || "StockMind AI";
      
      renderPage();
    });
  });

  // Global Search bar
  globalSearch.addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    if (state.currentTab !== "inventory") {
      // Auto-switch to inventory tab on search
      switchTab("inventory");
    } else {
      renderInventoryPage();
    }
  });

  // Theme Switcher
  themeToggleBtn.addEventListener("click", () => {
    if (document.body.classList.contains("light-theme")) {
      document.body.classList.remove("light-theme");
      state.theme = "dark";
      updateThemeIcon("dark");
    } else {
      document.body.classList.add("light-theme");
      state.theme = "light";
      updateThemeIcon("light");
    }
    localStorage.setItem("theme", state.theme);
    renderPage(); // Redraw dynamic charts to sync with theme coloring
  });

  function updateThemeIcon(theme) {
    const themeIcon = document.getElementById("themeIcon");
    if (theme === "light") {
      themeIcon.innerHTML = `<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707.707M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/>`;
    } else {
      themeIcon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
    }
  }

  function switchTab(tabName) {
    const navItem = Array.from(navItems).find(n => n.dataset.tab === tabName);
    if (navItem) navItem.click();
  }

  // --- Toast Alert Notifications ---
  function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let icon = "";
    if (type === "success") icon = "✓";
    else if (type === "error") icon = "✗";
    else if (type === "warning") icon = "⚠";
    else icon = "ℹ";

    toast.innerHTML = `
      <div style="font-weight:bold; font-size: 16px;">${icon}</div>
      <div class="toast-message">${message}</div>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "slideIn 0.3s ease reverse forwards";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // --- Initial App Load ---
  async function init() {
    await API.fetchItems();
    updateGlobalNotifications();
    renderPage();

    // Request system notifications permission on startup
    if ("Notification" in window && Notification.permission === "default") {
      setTimeout(() => {
        Notification.requestPermission();
      }, 2000);
    }
  }

  function updateGlobalNotifications() {
    const lowStockCount = state.items.filter(x => x.quantity <= x.reorderLevel).length;
    const dateToday = new Date("2026-07-07"); // Anchor date from current context
    const expiringCount = state.items.filter(x => {
      if (!x.expiryDate) return false;
      const days = Math.ceil((new Date(x.expiryDate) - dateToday) / (1000 * 60 * 60 * 24));
      return days <= 30;
    }).length;

    const alertCount = lowStockCount + expiringCount;
    if (alertCount > 0) {
      notifBadge.textContent = alertCount;
      notifBadge.style.display = "block";
    } else {
      notifBadge.style.display = "none";
    }
  }

  // Bind notification button action
  notifBtn.addEventListener("click", () => {
    const lowStockItems = state.items.filter(x => x.quantity <= x.reorderLevel);
    if (lowStockItems.length > 0) {
      showToast(`Warning: ${lowStockItems.length} products are running low on stock!`, "warning");
    } else {
      showToast("No critical stock alerts at this moment.", "success");
    }
  });

  // --- Routing Renderer ---
  function renderPage() {
    // Sync notifications badge on every redraw
    updateGlobalNotifications();

    switch (state.currentTab) {
      case "overview":
        renderOverviewPage();
        break;
      case "inventory":
        renderInventoryPage();
        break;
      case "forecast":
        renderForecastPage();
        break;
      case "locations":
        renderLocationsPage();
        break;
      case "expiry":
        renderExpiryPage();
        break;
      case "reorder":
        renderReorderPage();
        break;
      case "shelf":
        renderShelfPage();
        break;
      case "alerts":
        renderAlertsPage();
        break;
      default:
        contentArea.innerHTML = `<h3>Tab page not found.</h3>`;
    }
  }

  // --- VIEW 1: Overview Dashboard ---
  function renderOverviewPage() {
    // Calculative Summaries
    const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const lowStockItems = state.items.filter(x => x.quantity <= x.reorderLevel && x.quantity > 0).length;
    const outOfStockItems = state.items.filter(x => x.quantity === 0).length;

    contentArea.innerHTML = `
      <!-- Stats Overview Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Total Valuation</span>
            <div class="stat-icon purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
          <div class="stat-value">$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div class="stat-desc">Stock asset portfolio valuation</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Total Units Stored</span>
            <div class="stat-icon cyan">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </div>
          </div>
          <div class="stat-value">${totalItems.toLocaleString()}</div>
          <div class="stat-desc">Active parts across all warehouses</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Low Stock Alerts</span>
            <div class="stat-icon yellow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
          </div>
          <div class="stat-value">${lowStockItems}</div>
          <div class="stat-desc"><span class="negative">Needs reordering</span> items</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Out of Stock</span>
            <div class="stat-icon red">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
          </div>
          <div class="stat-value">${outOfStockItems}</div>
          <div class="stat-desc"><span class="negative">Zero inventory</span> count</div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="charts-grid">
        <div class="card">
          <div class="card-title">
            <div>
              Forecasted Demand Analytics
              <div class="card-subtitle">Aggregate monthly sales trends (units predicted)</div>
            </div>
          </div>
          <div class="chart-container" id="lineChartContainer">
            <!-- Line Chart SVG injected here -->
          </div>
        </div>

        <div class="card">
          <div class="card-title">
            <div>
              Category Valuation
              <div class="card-subtitle">Breakdown of inventory asset share</div>
            </div>
          </div>
          <div class="chart-container" id="donutChartContainer">
            <!-- Donut Chart SVG injected here -->
          </div>
        </div>
      </div>

      <!-- AI Auto-Reorder Panel -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-title" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div>
            AI Auto-Reorder Panel
            <div class="card-subtitle">Recommended procurement orders waiting for one-click approval</div>
          </div>
          ${state.items.filter(x => x.quantity <= x.reorderLevel).length > 0 ? `<button class="btn btn-primary" id="approveAllReordersBtn" style="padding: 8px 16px; font-size:13px;">Approve All (${state.items.filter(x => x.quantity <= x.reorderLevel).length})</button>` : ''}
        </div>
        <div class="table-container">
          <table class="table-custom">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Item Name</th>
                <th>Current Stock</th>
                <th>Reorder Threshold</th>
                <th>Recommended Restock</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${state.items.filter(x => x.quantity <= x.reorderLevel).length === 0 ? `
                <tr>
                  <td colspan="6" style="text-align: center; color: var(--status-instock); padding: 24px; font-weight: 600;">
                    ✓ All inventory stocks are healthy. No pending automated procurement orders.
                  </td>
                </tr>
              ` : state.items.filter(x => x.quantity <= x.reorderLevel).map(item => {
                const batchQty = item.reorderLevel * 2 || 50;
                return `
                  <tr>
                    <td><code>${item.sku}</code></td>
                    <td style="font-weight: 600;">${item.name}</td>
                    <td>
                      <span class="badge-status outstock" style="padding: 2px 6px;">
                        ${item.quantity} units
                      </span>
                    </td>
                    <td>${item.reorderLevel} units</td>
                    <td style="font-weight: 600; color: var(--accent-cyan);">+${batchQty} units</td>
                    <td style="text-align: right;">
                      <button class="btn btn-secondary quick-reorder-btn" data-id="${item.id}" style="padding: 6px 12px; font-size: 12px; border-color: var(--accent-purple); color: var(--accent-purple);">
                        Reorder
                      </button>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent stock changes log -->
      <div class="card">
        <div class="card-title">Stock Status Center</div>
        <div class="table-container">
          <table class="table-custom">
            <thead>
              <tr>
                <th>Product SKU</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Warehouse Zone</th>
                <th>Quantity</th>
                <th>Alert Status</th>
              </tr>
            </thead>
            <tbody>
              ${state.items.slice(0, 5).map(item => {
                let statusClass = "instock";
                let statusText = "In Stock";
                if (item.quantity === 0) {
                  statusClass = "outstock";
                  statusText = "Out of Stock";
                } else if (item.quantity <= item.reorderLevel) {
                  statusClass = "lowstock";
                  statusText = "Low Stock Alert";
                }
                return `
                  <tr>
                    <td><code>${item.sku}</code></td>
                    <td style="font-weight: 600;">${item.name}</td>
                    <td>${item.category}</td>
                    <td>${item.location}</td>
                    <td>${item.quantity}</td>
                    <td><span class="badge-status ${statusClass}">${statusText}</span></td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Wire Reorder Panel Buttons
    const lowStockItemsList = state.items.filter(x => x.quantity <= x.reorderLevel);
    if (lowStockItemsList.length > 0) {
      const approveAllBtn = document.getElementById("approveAllReordersBtn");
      if (approveAllBtn) {
        approveAllBtn.addEventListener("click", async () => {
          showToast(`Processing all ${lowStockItemsList.length} reorders...`, "info");
          // Reorder all items sequentially
          for (const item of lowStockItemsList) {
            await API.triggerReorder(item.id);
          }
          renderOverviewPage();
        });
      }

      const quickReorderBtns = contentArea.querySelectorAll(".quick-reorder-btn");
      quickReorderBtns.forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          const success = await API.triggerReorder(id);
          if (success) {
            renderOverviewPage();
          }
        });
      });
    }

    // Draw charts after DOM injection
    drawOverviewCharts();
  }

  function drawOverviewCharts() {
    // 1. Line Chart: Aggregate monthly forecasting values
    const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const aggregateSales = [0, 0, 0, 0, 0, 0];
    state.items.forEach(item => {
      if (item.salesForecast && item.salesForecast.length === 6) {
        for (let i = 0; i < 6; i++) {
          aggregateSales[i] += item.salesForecast[i];
        }
      }
    });

    const lineContainer = document.getElementById("lineChartContainer");
    if (lineContainer && state.items.length > 0) {
      const w = lineContainer.clientWidth;
      const h = 240;
      
      const padding = 40;
      const graphW = w - padding * 2;
      const graphH = h - padding * 2;
      
      const maxVal = Math.max(...aggregateSales) * 1.15;
      
      // Build svg graph points
      const points = aggregateSales.map((val, idx) => {
        const x = padding + (idx / (aggregateSales.length - 1)) * graphW;
        const y = h - padding - (val / maxVal) * graphH;
        return { x, y, val };
      });
      
      const lineD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
      const areaD = `${lineD} L ${points[points.length - 1].x} ${h - padding} L ${points[0].x} ${h - padding} Z`;

      // Theme sensitive colors
      const strokeColor = state.theme === "light" ? "#6d28d9" : "#a78bfa";
      const textColor = state.theme === "light" ? "#475569" : "#94a3b8";

      let yGridLines = "";
      for (let i = 0; i <= 4; i++) {
        const gridVal = (maxVal * (i / 4));
        const gridY = h - padding - (gridVal / maxVal) * graphH;
        yGridLines += `
          <line x1="${padding}" y1="${gridY}" x2="${w - padding}" y2="${gridY}" class="chart-grid-line" />
          <text x="${padding - 10}" y="${gridY + 4}" text-anchor="end" class="chart-axis-text">${Math.round(gridVal)}</text>
        `;
      }

      let pointsSVG = points.map(p => `
        <circle cx="${p.x}" cy="${p.y}" class="chart-dot" style="stroke: ${strokeColor};" />
      `).join("");

      let monthsSVG = months.map((m, idx) => {
        const x = padding + (idx / (months.length - 1)) * graphW;
        return `<text x="${x}" y="${h - padding + 20}" text-anchor="middle" class="chart-axis-text" style="fill: ${textColor};">${m}</text>`;
      }).join("");

      lineContainer.innerHTML = `
        <svg class="svg-chart" viewBox="0 0 ${w} ${h}">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${strokeColor}" stop-opacity="0.3" />
              <stop offset="100%" stop-color="${strokeColor}" stop-opacity="0" />
            </linearGradient>
          </defs>
          <!-- Grid Lines -->
          ${yGridLines}
          
          <!-- Area/Line charts -->
          <path d="${areaD}" class="chart-line-gradient" fill="url(#areaGrad)" />
          <path d="${lineD}" class="chart-line" style="stroke: ${strokeColor};" />
          
          <!-- Interactive dots -->
          ${pointsSVG}
          
          <!-- Month Labels -->
          ${monthsSVG}
        </svg>
      `;
    }

    // 2. Donut Chart: Inventory Value Distribution by Category
    const donutContainer = document.getElementById("donutChartContainer");
    if (donutContainer && state.items.length > 0) {
      // Calculate category valuations
      const catVal = {};
      state.items.forEach(item => {
        catVal[item.category] = (catVal[item.category] || 0) + (item.price * item.quantity);
      });

      const catArray = Object.entries(catVal).map(([cat, val]) => ({ name: cat, value: val }));
      const totalValSum = catArray.reduce((sum, c) => sum + c.value, 0);

      // Colors for charts
      const colors = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#3b82f6"];
      
      const r = 50;
      const cx = 80;
      const cy = 80;
      const circ = 2 * Math.PI * r;

      let strokeOffset = 0;
      let segmentsSVG = "";
      let legendItems = "";

      catArray.forEach((item, idx) => {
        const itemColor = colors[idx % colors.length];
        const pct = item.value / totalValSum;
        const segmentLen = circ * pct;
        const offset = circ - strokeOffset;

        segmentsSVG += `
          <circle cx="${cx}" cy="${cy}" r="${r}" 
            class="donut-segment" 
            stroke="${itemColor}" 
            stroke-dasharray="${segmentLen} ${circ}" 
            stroke-dashoffset="${offset}" 
            transform="rotate(-90 ${cx} ${cy})" />
        `;

        legendItems += `
          <div class="legend-item">
            <span class="legend-color" style="background-color: ${itemColor};"></span>
            <span>${item.name} (${Math.round(pct * 100)}%)</span>
          </div>
        `;

        strokeOffset += segmentLen;
      });

      donutContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 24px; width: 100%;">
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle cx="${cx}" cy="${cy}" r="${r}" class="donut-ring" />
            ${segmentsSVG}
            <g class="donut-center-text">
              <text x="${cx}" y="${cy - 4}" class="donut-text-val">$${Math.round(totalValSum/1000)}k</text>
              <text x="${cx}" y="${cy + 14}" class="donut-text-lbl">value</text>
            </g>
          </svg>
          <div class="chart-legend">
            ${legendItems}
          </div>
        </div>
      `;
    } else if (donutContainer) {
      donutContainer.innerHTML = `<p style="color: var(--text-muted);">No category data available.</p>`;
    }
  }

  // --- VIEW 2: Inventory Tab with CRUD list ---
  function renderInventoryPage() {
    // Generate unique categories lists for filtering
    const categories = [...new Set(state.items.map(x => x.category))];

    // Filter items based on state query / category dropdown
    let filteredItems = state.items.filter(item => {
      const matchQuery = item.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                         item.sku.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(state.searchQuery.toLowerCase());
      
      const matchCat = state.filters.category === "all" || item.category === state.filters.category;
      
      let matchStatus = true;
      if (state.filters.status === "instock") {
        matchStatus = item.quantity > item.reorderLevel;
      } else if (state.filters.status === "lowstock") {
        matchStatus = item.quantity <= item.reorderLevel && item.quantity > 0;
      } else if (state.filters.status === "outstock") {
        matchStatus = item.quantity === 0;
      }

      return matchQuery && matchCat && matchStatus;
    });

    // Sorting
    filteredItems.sort((a, b) => {
      let aVal = a[state.sort.key];
      let bVal = b[state.sort.key];

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return state.sort.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return state.sort.direction === "asc" ? 1 : -1;
      return 0;
    });

    contentArea.innerHTML = `
      <!-- Dynamic Filter Row -->
      <div class="filters-bar">
        <div class="filter-group" style="gap: 16px; align-items: center;">
          <!-- Category Selector -->
          <select class="select-custom" id="categoryFilter">
            <option value="all">All Categories</option>
            ${categories.map(c => `<option value="${c}" ${state.filters.category === c ? 'selected' : ''}>${c}</option>`).join("")}
          </select>

          <!-- Interactive Filter Buttons: All, Critical, Low -->
          <div style="display: flex; gap: 4px; background: rgba(0,0,0,0.15); padding: 4px; border-radius: 10px; border: 1px solid var(--border-color); align-items: center;">
            <button class="btn ${state.filters.status === 'all' ? 'btn-primary' : 'btn-secondary'}" id="btnFilterAll" style="padding: 6px 14px; font-size: 13px; border:none; border-radius: 8px; cursor: pointer; font-weight: 600;">All</button>
            <button class="btn ${state.filters.status === 'outstock' ? 'btn-primary' : 'btn-secondary'}" id="btnFilterCritical" style="padding: 6px 14px; font-size: 13px; border:none; border-radius: 8px; cursor: pointer; font-weight: 600;">Critical</button>
            <button class="btn ${state.filters.status === 'lowstock' ? 'btn-primary' : 'btn-secondary'}" id="btnFilterLow" style="padding: 6px 14px; font-size: 13px; border:none; border-radius: 8px; cursor: pointer; font-weight: 600;">Low</button>
          </div>
        </div>

        <button class="btn btn-primary" id="openAddModalBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Product
        </button>
      </div>

      <!-- Main Inventory Data Table -->
      <div class="table-container">
        <table class="table-custom">
          <thead>
            <tr>
              <th data-sort="sku">SKU ${renderSortChevron("sku")}</th>
              <th data-sort="name">Product Name ${renderSortChevron("name")}</th>
              <th data-sort="category">Category ${renderSortChevron("category")}</th>
              <th data-sort="location">Location ${renderSortChevron("location")}</th>
              <th data-sort="quantity" style="text-align: center;">Quantity ${renderSortChevron("quantity")}</th>
              <th data-sort="price">Price ${renderSortChevron("price")}</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filteredItems.length === 0 ? `
              <tr>
                <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 32px;">
                  No products matched the active filter conditions.
                </td>
              </tr>
            ` : filteredItems.map(item => {
              let statusClass = "instock";
              let statusText = "In Stock";
              if (item.quantity === 0) {
                statusClass = "outstock";
                statusText = "Out of Stock";
              } else if (item.quantity <= item.reorderLevel) {
                statusClass = "lowstock";
                statusText = "Low Stock";
              }

              return `
                <tr>
                  <td><code>${item.sku}</code></td>
                  <td style="font-weight: 600;">${item.name}</td>
                  <td>${item.category}</td>
                  <td>${item.location}</td>
                  <td>
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                      <div class="qty-adjust" style="justify-content: center;">
                        <button class="btn-qty decrement" data-id="${item.id}">-</button>
                        <span class="qty-val" style="min-width:30px; font-weight:700;">${item.quantity}</span>
                        <button class="btn-qty increment" data-id="${item.id}">+</button>
                      </div>
                      
                      <!-- Visual Stock Progress Bar -->
                      <div class="progress-bar-container" style="width: 70px; height: 5px; background: rgba(0,0,0,0.1); border-radius: 3px; overflow: hidden; margin-top:2px;">
                        <div class="progress-bar-fill" style="
                          width: ${Math.min((item.quantity / (item.reorderLevel * 3 || 75)) * 100, 100)}%; 
                          background: ${item.quantity === 0 ? 'var(--status-outstock)' : item.quantity <= item.reorderLevel ? 'var(--status-lowstock)' : 'var(--status-instock)'}; 
                          height: 100%; 
                          border-radius: 3px;
                          transition: width var(--transition-fast) ease;
                        "></div>
                      </div>
                    </div>
                  </td>
                  <td style="font-weight:600;">$${item.price.toFixed(2)}</td>
                  <td><span class="badge-status ${statusClass}">${statusText}</span></td>
                  <td style="text-align: right;">
                    <div class="btn-action-group" style="justify-content: flex-end;">
                      <button class="btn-action edit" data-id="${item.id}" aria-label="Edit item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      </button>
                      <button class="btn-action delete" data-id="${item.id}" aria-label="Delete item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>

      <!-- Add / Edit Modal Injected in overlay -->
      <div class="modal-overlay" id="productModal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title" id="modalTitle">Add Product</h3>
            <button class="btn-close" id="closeModalBtn" aria-label="Close modal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <form id="productForm">
            <input type="hidden" id="itemId" />
            <div class="modal-body">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="itemName">Product Name</label>
                  <input type="text" id="itemName" class="form-input" required />
                </div>
                <div class="form-group">
                  <label class="form-label" for="itemSku">SKU Code</label>
                  <input type="text" id="itemSku" class="form-input" placeholder="e.g. ELEC-KBD-01" required />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="itemCategory">Category</label>
                  <select class="form-input" id="itemCategory" required>
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Wellness & Cosmetics">Wellness & Cosmetics</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="itemLocation">Warehouse Location</label>
                  <input type="text" id="itemLocation" class="form-input" placeholder="e.g. Zone A - Row 1 Shelf 1" required />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="itemQty">Quantity</label>
                  <input type="number" id="itemQty" class="form-input" min="0" required />
                </div>
                <div class="form-group">
                  <label class="form-label" for="itemPrice">Price ($)</label>
                  <input type="number" id="itemPrice" class="form-input" min="0.01" step="0.01" required />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="itemReorder">Reorder Threshold</label>
                  <input type="number" id="itemReorder" class="form-input" min="1" required />
                </div>
                <div class="form-group">
                  <label class="form-label" for="itemExpiry">Expiry Date (Optional)</label>
                  <input type="date" id="itemExpiry" class="form-input" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="itemDesc">Description</label>
                <textarea id="itemDesc" class="form-input" style="height: 60px; resize: none;"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="cancelModalBtn">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Product</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // --- Tab-specific DOM Listeners ---
    document.getElementById("categoryFilter").addEventListener("change", (e) => {
      state.filters.category = e.target.value;
      renderInventoryPage();
    });

    document.getElementById("btnFilterAll").addEventListener("click", () => {
      state.filters.status = "all";
      renderInventoryPage();
    });

    document.getElementById("btnFilterCritical").addEventListener("click", () => {
      state.filters.status = "outstock";
      renderInventoryPage();
    });

    document.getElementById("btnFilterLow").addEventListener("click", () => {
      state.filters.status = "lowstock";
      renderInventoryPage();
    });

    // Table Header Sorting Events
    const headers = contentArea.querySelectorAll(".table-custom th");
    headers.forEach(h => {
      const sortKey = h.dataset.sort;
      if (sortKey) {
        h.addEventListener("click", () => {
          if (state.sort.key === sortKey) {
            state.sort.direction = state.sort.direction === "asc" ? "desc" : "asc";
          } else {
            state.sort.key = sortKey;
            state.sort.direction = "asc";
          }
          renderInventoryPage();
        });
      }
    });

    // Quantity Quick Ajusters (+ / -)
    const incBtns = contentArea.querySelectorAll(".btn-qty.increment");
    const decBtns = contentArea.querySelectorAll(".btn-qty.decrement");
    
    incBtns.forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const item = state.items.find(x => x.id === id);
        if (item) {
          const newQty = item.quantity + 1;
          await API.saveItem({ ...item, quantity: newQty }, id);
          renderInventoryPage();
        }
      });
    });

    decBtns.forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const item = state.items.find(x => x.id === id);
        if (item && item.quantity > 0) {
          const newQty = item.quantity - 1;
          await API.saveItem({ ...item, quantity: newQty }, id);
          renderInventoryPage();
        }
      });
    });

    // Edit Product trigger
    const editBtns = contentArea.querySelectorAll(".btn-action.edit");
    editBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const item = state.items.find(x => x.id === id);
        if (item) {
          openFormModal(item);
        }
      });
    });

    // Delete Product trigger
    const deleteBtns = contentArea.querySelectorAll(".btn-action.delete");
    deleteBtns.forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const item = state.items.find(x => x.id === id);
        if (item && confirm(`Are you sure you want to delete ${item.name}?`)) {
          await API.deleteItem(id);
          renderInventoryPage();
        }
      });
    });

    // Modal Operations
    const modal = document.getElementById("productModal");
    const openAddModalBtn = document.getElementById("openAddModalBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const cancelModalBtn = document.getElementById("cancelModalBtn");
    const productForm = document.getElementById("productForm");

    openAddModalBtn.addEventListener("click", () => openFormModal());
    closeModalBtn.addEventListener("click", closeFormModal);
    cancelModalBtn.addEventListener("click", closeFormModal);
    
    productForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const id = document.getElementById("itemId").value || null;
      const itemData = {
        name: document.getElementById("itemName").value,
        sku: document.getElementById("itemSku").value,
        category: document.getElementById("itemCategory").value,
        location: document.getElementById("itemLocation").value,
        quantity: parseInt(document.getElementById("itemQty").value),
        price: parseFloat(document.getElementById("itemPrice").value),
        reorderLevel: parseInt(document.getElementById("itemReorder").value),
        expiryDate: document.getElementById("itemExpiry").value || null,
        description: document.getElementById("itemDesc").value
      };

      const success = await API.saveItem(itemData, id);
      if (success) {
        closeFormModal();
        renderInventoryPage();
      }
    });

    function openFormModal(item = null) {
      const modalTitle = document.getElementById("modalTitle");
      const itemId = document.getElementById("itemId");
      const itemSku = document.getElementById("itemSku");

      if (item) {
        modalTitle.textContent = "Edit Product";
        itemId.value = item.id;
        document.getElementById("itemName").value = item.name;
        itemSku.value = item.sku;
        itemSku.disabled = true; // SKU cannot be modified to avoid index collisions
        document.getElementById("itemCategory").value = item.category;
        document.getElementById("itemLocation").value = item.location;
        document.getElementById("itemQty").value = item.quantity;
        document.getElementById("itemPrice").value = item.price;
        document.getElementById("itemReorder").value = item.reorderLevel;
        document.getElementById("itemExpiry").value = item.expiryDate || "";
        document.getElementById("itemDesc").value = item.description || "";
      } else {
        modalTitle.textContent = "Add Product";
        itemId.value = "";
        productForm.reset();
        itemSku.disabled = false;
      }
      modal.classList.add("active");
    }

    function closeFormModal() {
      modal.classList.remove("active");
    }
  }

  function renderSortChevron(key) {
    if (state.sort.key !== key) return "";
    return state.sort.direction === "asc" ? "▲" : "▼";
  }

  // --- VIEW 3: Forecasting tab ---
  function renderForecastPage() {
    // Generate options list of products
    const options = state.items.map(item => `<option value="${item.id}">${item.name}</option>`).join("");
    
    contentArea.innerHTML = `
      <div class="forecast-summary-grid">
        <div class="forecast-item-card">
          <div>
            <div style="font-size:12px; color: var(--text-muted); font-weight:600; text-transform:uppercase;">Next Quarter Sales</div>
            <h2 id="fqSalesCount" style="font-size:28px; font-weight:800; margin-top:4px;">0</h2>
          </div>
          <span class="trend-badge up">▲ 14.2%</span>
        </div>
        <div class="forecast-item-card">
          <div>
            <div style="font-size:12px; color: var(--text-muted); font-weight:600; text-transform:uppercase;">Predicted Top Category</div>
            <h2 id="fqTopCategory" style="font-size:28px; font-weight:800; margin-top:4px;">-</h2>
          </div>
          <span class="trend-badge up">▲ Solid</span>
        </div>
        <div class="forecast-item-card">
          <div>
            <div style="font-size:12px; color: var(--text-muted); font-weight:600; text-transform:uppercase;">Optimal Restock Budget</div>
            <h2 id="fqOptimalBudget" style="font-size:28px; font-weight:800; margin-top:4px;">$0</h2>
          </div>
          <span class="trend-badge down">▼ 2.4%</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div>
            Product Demand Prediction
            <span class="badge-status instock" style="margin-left: 12px; font-size: 11px; padding: 4px 10px; font-weight: 700;">AI Accuracy: 94.2%</span>
            <div class="card-subtitle">Select an inventory item to preview its 6-month sales forecasting</div>
          </div>
          <select class="select-custom" id="forecastSelector" style="width:280px;">
            ${options}
          </select>
        </div>

        <div class="chart-container" id="forecastChartContainer">
          <!-- Live SVG forecasting chart injected here -->
        </div>
      </div>
    `;

    // Forecasting calculations
    let totalQuarterSales = 0;
    state.items.forEach(item => {
      // Add up index 0, 1, 2 of forecasts (representing next 3 months)
      if (item.salesForecast && item.salesForecast.length >= 3) {
        totalQuarterSales += (item.salesForecast[0] + item.salesForecast[1] + item.salesForecast[2]);
      }
    });

    document.getElementById("fqSalesCount").textContent = totalQuarterSales.toLocaleString() + " units";
    document.getElementById("fqTopCategory").textContent = "Electronics"; // Standard highlight
    
    // Optimal restock calculation
    const outOfStockValueNeeded = state.items
      .filter(x => x.quantity <= x.reorderLevel)
      .reduce((sum, x) => sum + (x.reorderLevel * 2 - x.quantity) * x.price, 0);
    document.getElementById("fqOptimalBudget").textContent = `$${Math.round(outOfStockValueNeeded).toLocaleString()}`;

    // Select input change listener
    const select = document.getElementById("forecastSelector");
    select.addEventListener("change", (e) => {
      drawForecastChartForId(e.target.value);
    });

    // Draw initial forecast chart for the first item
    if (state.items.length > 0) {
      drawForecastChartForId(state.items[0].id);
    }
  }

  function drawForecastChartForId(itemId) {
    const item = state.items.find(x => x.id === itemId);
    const container = document.getElementById("forecastChartContainer");
    if (!item || !container) return;

    const w = container.clientWidth;
    const h = 240;
    const padding = 40;
    const graphW = w - padding * 2;
    const graphH = h - padding * 2;

    const forecasts = item.salesForecast || [10, 15, 12, 18, 20, 25];
    const maxVal = Math.max(...forecasts) * 1.2 || 50;
    const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const points = forecasts.map((val, idx) => {
      const x = padding + (idx / (forecasts.length - 1)) * graphW;
      const y = h - padding - (val / maxVal) * graphH;
      return { x, y, val };
    });

    const lineD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
    const areaD = `${lineD} L ${points[points.length - 1].x} ${h - padding} L ${points[0].x} ${h - padding} Z`;

    const strokeColor = "#06b6d4"; // Cyan coloring for predicting chart
    const textColor = state.theme === "light" ? "#475569" : "#94a3b8";

    let yGridLines = "";
    for (let i = 0; i <= 4; i++) {
      const gridVal = (maxVal * (i / 4));
      const gridY = h - padding - (gridVal / maxVal) * graphH;
      yGridLines += `
        <line x1="${padding}" y1="${gridY}" x2="${w - padding}" y2="${gridY}" class="chart-grid-line" />
        <text x="${padding - 10}" y="${gridY + 4}" text-anchor="end" class="chart-axis-text">${Math.round(gridVal)}</text>
      `;
    }

    let pointsSVG = points.map(p => `
      <circle cx="${p.x}" cy="${p.y}" class="chart-dot" style="stroke: ${strokeColor};" />
    `).join("");

    let monthsSVG = months.map((m, idx) => {
      const x = padding + (idx / (months.length - 1)) * graphW;
      return `<text x="${x}" y="${h - padding + 20}" text-anchor="middle" class="chart-axis-text" style="fill: ${textColor};">${m}</text>`;
    }).join("");

    const stockoutY = h - padding - (item.reorderLevel / maxVal) * graphH;
    let stockoutLineSVG = "";
    if (stockoutY >= padding && stockoutY <= h - padding) {
      stockoutLineSVG = `
        <line x1="${padding}" y1="${stockoutY}" x2="${w - padding}" y2="${stockoutY}" stroke="#ef4444" stroke-width="2" stroke-dasharray="6,4" />
        <text x="${w - padding - 10}" y="${stockoutY - 6}" text-anchor="end" fill="#ef4444" font-size="10" font-weight="700">Stockout Threshold</text>
      `;
    }

    container.innerHTML = `
      <svg class="svg-chart" viewBox="0 0 ${w} ${h}">
        <defs>
          <linearGradient id="areaGradPredict" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${strokeColor}" stop-opacity="0.3" />
            <stop offset="100%" stop-color="${strokeColor}" stop-opacity="0" />
          </linearGradient>
        </defs>
        ${yGridLines}
        ${stockoutLineSVG}
        <path d="${areaD}" fill="url(#areaGradPredict)" style="opacity:0.25;"/>
        <path d="${lineD}" class="chart-line" style="stroke: ${strokeColor};" />
        ${pointsSVG}
        ${monthsSVG}
      </svg>
    `;
  }

  // --- VIEW 4: Locations Tab ---
  function renderLocationsPage() {
    // Collect items per zone
    const locationsMap = {};
    
    // Baseline storage capacity totals
    const zones = [
      { id: "zone-a", name: "Zone A - High Security Shelf 2", capacity: 400 },
      { id: "zone-b", name: "Zone B - Cold Storage", capacity: 100 },
      { id: "zone-c", name: "Zone C - Row 4 Shelf 1", capacity: 500 },
      { id: "zone-d", name: "Zone D - Bulky Storage", capacity: 50 }
    ];

    zones.forEach(z => {
      locationsMap[z.name] = {
        name: z.name,
        capacity: z.capacity,
        items: [],
        currentVolume: 0
      };
    });

    // Populate actual items inside locations
    state.items.forEach(item => {
      let locName = item.location;
      
      // Clean fuzzy locations to match basic zones if possible
      let matchedZone = zones.find(z => locName.toLowerCase().includes(z.id.split("-")[1]))?.name || null;
      if (!matchedZone) {
        // Fallback fuzzy matches
        if (locName.toLowerCase().includes("cold") || locName.toLowerCase().includes("refrig")) {
          matchedZone = "Zone B - Cold Storage";
        } else if (locName.toLowerCase().includes("security") || locName.toLowerCase().includes("shelf 1")) {
          matchedZone = "Zone A - High Security Shelf 2";
        } else if (locName.toLowerCase().includes("bulky") || locName.toLowerCase().includes("row 5")) {
          matchedZone = "Zone D - Bulky Storage";
        } else {
          matchedZone = "Zone C - Row 4 Shelf 1";
        }
      }

      if (locationsMap[matchedZone]) {
        locationsMap[matchedZone].items.push(item);
        locationsMap[matchedZone].currentVolume += item.quantity;
      }
    });

    // Generate AI transfer recommendations dynamically
    const yogurt = state.items.find(x => x.sku === "FOOD-YOG-BLU");
    const pad = state.items.find(x => x.sku === "ELEC-WCP-015");
    
    const suggestions = [];
    if (yogurt && yogurt.location !== "Zone B - Cold Storage") {
      suggestions.push({
        id: yogurt.id,
        name: yogurt.name,
        source: yogurt.location,
        dest: "Zone B - Cold Storage",
        qty: yogurt.quantity,
        benefit: "Refrigeration compliance (Prevent Spoilage)",
        targetLocation: "Zone B - Cold Storage"
      });
    }
    if (pad && pad.location !== "Zone C - Row 4 Shelf 1") {
      suggestions.push({
        id: pad.id,
        name: pad.name,
        source: pad.location,
        dest: "Zone C - Row 4 Shelf 1",
        qty: Math.min(pad.quantity, 15),
        benefit: "Balance general storage capacity",
        targetLocation: "Zone C - Row 4 Shelf 1"
      });
    }

    let suggestionsHTML = "";
    if (suggestions.length === 0) {
      suggestionsHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--status-instock); padding: 18px; font-weight: 600;">
            ✓ Warehouse stock placement is fully optimized. No pending transfers.
          </td>
        </tr>
      `;
    } else {
      suggestionsHTML = suggestions.map(s => `
        <tr>
          <td style="font-weight: 600;">${s.name}</td>
          <td><code>${s.source}</code></td>
          <td><code>${s.dest}</code></td>
          <td><strong style="color: var(--accent-cyan);">${s.qty} units</strong></td>
          <td style="font-style: italic; color: var(--text-secondary);">${s.benefit}</td>
          <td style="text-align: right;">
            <button class="btn btn-secondary approve-transfer-btn" data-id="${s.id}" data-dest="${s.targetLocation}" style="padding: 6px 12px; font-size: 12px; border-color: var(--accent-purple); color: var(--accent-purple);">
              Approve Transfer
            </button>
          </td>
        </tr>
      `).join("");
    }

    contentArea.innerHTML = `
      <div class="location-grid">
        ${Object.values(locationsMap).map(loc => {
          const occupancyPct = Math.min(Math.round((loc.currentVolume / loc.capacity) * 100), 100);
          
          return `
            <div class="location-card">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div class="location-name">${loc.name}</div>
                <span class="badge-status ${occupancyPct > 85 ? 'outstock' : occupancyPct > 50 ? 'lowstock' : 'instock'}">
                  ${occupancyPct}% Full
                </span>
              </div>

              <!-- Capacity Progress Indicator -->
              <div>
                <div class="progress-bar-container">
                  <div class="progress-bar-fill" style="width: ${occupancyPct}%;"></div>
                </div>
                <div class="location-metrics" style="margin-top: 8px;">
                  <span>Capacity Occupied: ${loc.currentVolume} / ${loc.capacity} units</span>
                </div>
              </div>

              <!-- Mini items list inside the location card -->
              <div style="border-top:1px solid var(--border-color); padding-top:12px; margin-top:8px;">
                <div style="font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:8px;">Stored Products:</div>
                <div style="display:flex; flex-direction:column; gap:8px; max-height: 180px; overflow-y:auto; padding-right:4px;">
                  ${loc.items.length === 0 ? `
                    <span style="font-size:13px; color:var(--text-muted);">Empty Location</span>
                  ` : loc.items.map(item => `
                    <div style="display:flex; justify-content:space-between; font-size:13px;">
                      <span>${item.name}</span>
                      <strong style="color:var(--accent-cyan);">${item.quantity} qty</strong>
                    </div>
                  `).join("")}
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <!-- AI Inter-Location Transfers -->
      <div class="card" style="margin-top: 24px;">
        <div class="card-title">
          AI-Suggested Inter-Location Transfers
          <div class="card-subtitle">Algorithmic stock rebalancing suggestions to optimize storage zoning and safety parameters</div>
        </div>
        <div class="table-container">
          <table class="table-custom">
            <thead>
              <tr>
                <th>Item</th>
                <th>Source Location</th>
                <th>Destination Location</th>
                <th>Quantity</th>
                <th>Optimization Benefit</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${suggestionsHTML}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Wire Approve Transfer Buttons
    const transferBtns = contentArea.querySelectorAll(".approve-transfer-btn");
    transferBtns.forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const dest = btn.dataset.dest;
        const item = state.items.find(x => x.id === id);
        if (item) {
          showToast(`Initiating transfer of ${item.name} to ${dest}...`, "info");
          const success = await API.saveItem({ ...item, location: dest }, id);
          if (success) {
            renderLocationsPage();
          }
        }
      });
    });
  }

  // --- VIEW 5: Expiry & Discounts monitoring ---
  function renderExpiryPage() {
    const dateToday = new Date("2026-07-07"); // Static context date

    // Filters for items that contain an expiry date
    const itemsWithExpiry = state.items.filter(item => item.expiryDate !== null && item.expiryDate !== "");

    // Prepare arrays
    const listData = itemsWithExpiry.map(item => {
      const expiry = new Date(item.expiryDate);
      const daysLeft = Math.ceil((expiry - dateToday) / (1000 * 60 * 60 * 24));
      
      let suggestion = "Monitor stock levels";
      let alertClass = "";
      let discountPct = 0;

      if (daysLeft <= 0) {
        suggestion = "Expired. Apply 80% discount or clear shelf.";
        alertClass = "expiry-warning-card";
        discountPct = 80;
      } else if (daysLeft <= 14) {
        suggestion = "Expiring in 2 weeks. Apply 50% discount.";
        alertClass = "expiry-attention-card";
        discountPct = 50;
      } else if (daysLeft <= 30) {
        suggestion = "Expiring in 30 days. Recommend 20% discount.";
        alertClass = "expiry-attention-card";
        discountPct = 20;
      }

      return { ...item, daysLeft, suggestion, alertClass, discountPct };
    });

    contentArea.innerHTML = `
      <div class="card">
        <div class="card-title">
          Expiry Watchlist & Clearance AI
          <div class="card-subtitle">Monitors perishable inventory lifespans and suggests automated discounts to prevent waste</div>
        </div>

        <div class="table-container">
          <table class="table-custom">
            <thead>
              <tr>
                <th>Product SKU</th>
                <th>Item Name</th>
                <th>Expiration Date</th>
                <th>Days Remaining</th>
                <th>Current Price</th>
                <th>AI Suggestion</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${listData.length === 0 ? `
                <tr>
                  <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">
                    No perishable inventory products found in database.
                  </td>
                </tr>
              ` : listData.map(item => {
                let badgeClass = "instock";
                let badgeText = `${item.daysLeft} days left`;
                
                if (item.daysLeft <= 0) {
                  badgeClass = "outstock";
                  badgeText = "Expired";
                } else if (item.daysLeft <= 30) {
                  badgeClass = "lowstock";
                }

                return `
                  <tr class="${item.alertClass}">
                    <td><code>${item.sku}</code></td>
                    <td style="font-weight:600;">${item.name}</td>
                    <td>${new Date(item.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td><span class="badge-status ${badgeClass}">${badgeText}</span></td>
                    <td style="font-weight:600;">$${item.price.toFixed(2)}</td>
                    <td style="font-size:13px; color:var(--text-secondary); font-style:italic;">${item.suggestion}</td>
                    <td style="text-align: right;">
                      ${item.discountPct > 0 ? `
                        <button class="btn btn-secondary apply-discount-btn" data-id="${item.id}" data-pct="${item.discountPct}" style="padding: 6px 12px; font-size:12px; border-color:var(--accent-purple); color:var(--accent-purple);">
                          Apply -${item.discountPct}%
                        </button>
                      ` : `
                        <span style="font-size:12px; color:var(--text-muted);">Good condition</span>
                      `}
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Expiry Prevention Insights -->
      <div class="card" style="margin-top: 24px;">
        <div class="card-title">Expiry Prevention Insights</div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
          <div style="background: rgba(0,0,0,0.15); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px;">
            <h4 style="font-size: 14px; font-weight: 700; color: var(--accent-cyan); margin-bottom: 6px;">Proactive Markdown Rules</h4>
            <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.4;">
              Autonomously apply **20% markdown** 30 days prior to expiry, scaling up to **50% markdown** 14 days prior. This velocity booster has historically cleared 88% of slow-moving stocks before write-off occurs.
            </p>
          </div>
          <div style="background: rgba(0,0,0,0.15); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px;">
            <h4 style="font-size: 14px; font-weight: 700; color: var(--status-lowstock); margin-bottom: 6px;">Prevention Analytics</h4>
            <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.4;">
              **Estimated Spoilage Savings**: $2,840 this quarter. By applying the recommended discounts on the watchlist, you can salvage up to 72% of the valuation of products currently flagged as expiring.
            </p>
          </div>
        </div>
      </div>
    `;

    // Click listener for applying discount
    const discountBtns = contentArea.querySelectorAll(".apply-discount-btn");
    discountBtns.forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const pct = parseInt(btn.dataset.pct);
        const item = state.items.find(x => x.id === id);
        if (item && confirm(`Apply ${pct}% discount to ${item.name}? This resets the price to $${(item.price * (100 - pct) / 100).toFixed(2)}`)) {
          const success = await API.applyDiscount(id, pct);
          if (success) {
            renderExpiryPage();
          }
        }
      });
    });
  }

  // --- VIEW 6: Auto-Reorder Panel ---
  function renderReorderPage() {
    // Filter products under-stocked
    const lowStockList = state.items.filter(item => item.quantity <= item.reorderLevel);

    contentArea.innerHTML = `
      <div class="card" style="margin-bottom:24px;">
        <div class="card-title">Auto-Reorder Automation Hub</div>
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
          <div style="font-size:14px; color: var(--text-secondary); max-width:600px;">
            Toggle automated purchase reordering rules. When an item stock drops below its reorder threshold, the StockMind system recommends restocking orders.
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <label style="font-weight:600; font-size:14px;" for="globalAutoToggle">Global Auto-Reorder Trigger:</label>
            <input type="checkbox" id="globalAutoToggle" checked style="width:20px; height:20px; accent-color:var(--accent-purple); cursor:pointer;" />
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          Procurement Shortage Recommendations
          <div class="card-subtitle">Recommended orders based on reorder variables</div>
        </div>

        <div class="table-container">
          <table class="table-custom">
            <thead>
              <tr>
                <th>Product SKU</th>
                <th>Item Name</th>
                <th>Current Stock</th>
                <th>Reorder Threshold</th>
                <th>Standard Restock Batch</th>
                <th>Unit Price</th>
                <th>Order Cost Estimate</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${lowStockList.length === 0 ? `
                <tr>
                  <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 32px;">
                    Excellent! All stock metrics are healthy. No items require replenishment orders.
                  </td>
                </tr>
              ` : lowStockList.map(item => {
                const batchQty = item.reorderLevel * 2 || 50;
                const estimatedCost = batchQty * item.price;
                return `
                  <tr>
                    <td><code>${item.sku}</code></td>
                    <td style="font-weight:600;">${item.name}</td>
                    <td>
                      <span class="badge-status outstock" style="padding: 2px 6px;">
                        ${item.quantity} units
                      </span>
                    </td>
                    <td>${item.reorderLevel} units</td>
                    <td style="font-weight:600; color:var(--accent-cyan);">+${batchQty} units</td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td style="font-weight:600;">$${estimatedCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td style="text-align: right;">
                      <button class="btn btn-primary reorder-now-btn" data-id="${item.id}" style="padding: 6px 12px; font-size:12px;">
                        Restock Now
                      </button>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Click handler for procurement button
    const reorderBtns = contentArea.querySelectorAll(".reorder-now-btn");
    reorderBtns.forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const item = state.items.find(x => x.id === id);
        if (item) {
          const success = await API.triggerReorder(id);
          if (success) {
            renderReorderPage();
          }
        }
      });
    });
  }

  // --- VIEW 7: Predictive Shelf Page ---
  function renderShelfPage() {
    if (state.items.length === 0) {
      contentArea.innerHTML = `<p style="padding:32px; color:var(--text-muted);">Please wait, loading product list...</p>`;
      return;
    }

    // Default selection
    if (!state.shelf.selectedId) {
      state.shelf.selectedId = state.items[0].id;
      const initialItem = state.items[0];
      const initialMax = getStandardMaxQty(initialItem.category);
      state.shelf.maxQty = initialMax;
      state.shelf.currentQty = Math.min(initialItem.quantity, initialMax);
      
      // Initialize log
      state.shelf.logs = [];
      logTelemetry(`Telemetry initialized. Product [${initialItem.name}] placed on shelf.`, "system");
      logTelemetry(`Integrated weight sensor and optical arrays fully calibrated.`, "system");
    }

    const currentItem = state.items.find(x => x.id === state.shelf.selectedId) || state.items[0];
    const unitWeight = getUnitWeight(currentItem.category);

    // Main Shelf Simulator Layout
    contentArea.innerHTML = `

      <!-- Main Shelf Simulator Layout -->
      <div class="shelf-simulator-container">
        <!-- Shelf Graphic & Gauges -->
        <div class="card">
          <div class="card-title">
            <div>
              Simulated IoT Weight Shelf
              <div class="card-subtitle">Select a product to place on the weight-sensing smart shelf</div>
            </div>
            
            <select class="select-custom" id="shelfProductSelect" style="width:200px;">
              ${state.items.map(x => `<option value="${x.id}" ${state.shelf.selectedId === x.id ? 'selected' : ''}>${x.name}</option>`).join("")}
            </select>
          </div>

          <!-- Physical Shelf Drawing -->
          <div class="shelf-visual-container">
            <div class="shelf-items-row" id="shelfItemsRow">
              <!-- Item visual representations will scale in/out here -->
            </div>
            <div class="shelf-structure">
              <div class="shelf-plank"></div>
            </div>
          </div>

          <!-- Telemetry Gauges -->
          <div class="telemetry-row">
            <div class="sensor-gauge">
              <div class="sensor-title">Weight Sensor</div>
              <div class="sensor-value cyan" id="sensorWeight">0.00 kg</div>
            </div>
            <div class="sensor-gauge">
              <div class="sensor-title">Optical Count</div>
              <div class="sensor-value purple" id="sensorCount">0 units</div>
            </div>
            <div class="sensor-gauge">
              <div class="sensor-title">Run Rate</div>
              <div class="sensor-value" id="sensorRunRate">0.0/day</div>
            </div>
            <div class="sensor-gauge">
              <div class="sensor-title">Time to Empty</div>
              <div class="sensor-value" id="sensorEte">-</div>
            </div>
          </div>
        </div>

        <!-- Simulated Telemetry Logs Console -->
        <div class="console-card">
          <div class="console-header">
            <div class="console-title">
              <div class="console-dot"></div>
              Real-Time IoT Telemetry Stream
            </div>
            <div class="filter-group">
              <button class="btn btn-secondary" id="grabShelfBtn" style="padding: 6px 12px; font-size:12px; background:#0f172a; border-color:#334155; color:#38bdf8;">Grab Item</button>
              <button class="btn btn-secondary" id="returnShelfBtn" style="padding: 6px 12px; font-size:12px; background:#0f172a; border-color:#334155; color:#34d399;">Return Item</button>
              <button class="btn btn-primary" id="restockShelfBtn" style="padding: 6px 12px; font-size:12px; background:#1e1b4b; color:#a78bfa;">Restock</button>
            </div>
          </div>
          <div class="console-body" id="consoleBody">
            <!-- Monospaced events logs injected here -->
          </div>
        </div>
      </div>
    `;

    // --- Interactive Telemetry Controllers ---
    function logTelemetry(message, type = "info") {
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];
      const entry = { time: timeStr, text: message, type };
      
      state.shelf.logs.push(entry);
      if (state.shelf.logs.length > 50) {
        state.shelf.logs.shift(); // Cap logs buffer
      }
      
      updateConsoleDOM();
    }

    function updateConsoleDOM() {
      const consoleBody = document.getElementById("consoleBody");
      if (!consoleBody) return;

      consoleBody.innerHTML = state.shelf.logs.map(log => {
        let typeClass = "system";
        if (log.type === "warning") typeClass = "warning";
        else if (log.type === "alert") typeClass = "alert";
        
        return `
          <div class="console-line">
            <span class="timestamp">[${log.time}]</span>
            <span class="${typeClass}">${log.text}</span>
          </div>
        `;
      }).join("");

      // Autoscroll to bottom
      consoleBody.scrollTop = consoleBody.scrollHeight;
    }

    function getUnitWeight(category) {
      const weights = {
        "Food & Beverage": 1.05, // kg per Almond Milk carton
        "Electronics": 0.15, // kg per smartwatch box
        "Wellness & Cosmetics": 0.04, // kg per lipstick tube
        "Furniture": 14.5, // kg per chair
        "Accessories": 0.12 // kg per charging pad
      };
      return weights[category] || 0.50;
    }

    function getStandardMaxQty(category) {
      const maxes = {
        "Food & Beverage": 8,
        "Electronics": 5,
        "Wellness & Cosmetics": 12,
        "Furniture": 2,
        "Accessories": 8
      };
      return maxes[category] || 8;
    }

    function getProductShapeClass(category) {
      const classes = {
        "Food & Beverage": "milk",
        "Electronics": "watch",
        "Wellness & Cosmetics": "lipstick",
        "Furniture": "chair",
        "Accessories": "general"
      };
      return classes[category] || "general";
    }

    function updateShelfUI() {
      const itemsRow = document.getElementById("shelfItemsRow");
      const weightGauge = document.getElementById("sensorWeight");
      const countGauge = document.getElementById("sensorCount");
      const runRateGauge = document.getElementById("sensorRunRate");
      const eteGauge = document.getElementById("sensorEte");

      if (!itemsRow) return;

      // Draw simulated items
      const shapeClass = getProductShapeClass(currentItem.category);
      let itemsHTML = "";
      for (let i = 0; i < state.shelf.currentQty; i++) {
        // Label on first or last item for clarity
        const label = i === 0 ? "1" : i === state.shelf.currentQty - 1 ? `${i+1}` : "";
        itemsHTML += `<div class="sim-item ${shapeClass}">${label}</div>`;
      }
      itemsRow.innerHTML = itemsHTML;

      // Compute weight
      const currentWeight = state.shelf.currentQty * unitWeight;
      weightGauge.textContent = `${currentWeight.toFixed(2)} kg`;

      // Compute optical count
      countGauge.textContent = `${state.shelf.currentQty} units`;

      // Run rate calculation based on forecast avg
      const forecastSum = currentItem.salesForecast.reduce((sum, val) => sum + val, 0);
      const forecastAvg = forecastSum / currentItem.salesForecast.length;
      const runRate = forecastAvg / 30; // units per day
      runRateGauge.textContent = `${runRate.toFixed(1)}/day`;

      // Estimate Time to Empty (ETE)
      if (state.shelf.currentQty === 0) {
        eteGauge.textContent = "EMPTY";
        eteGauge.className = "sensor-value red";
      } else {
        const eteDays = state.shelf.currentQty / runRate;
        eteGauge.textContent = `${eteDays.toFixed(1)} d`;
        
        if (eteDays <= 1.0) {
          eteGauge.className = "sensor-value red";
        } else if (eteDays <= 3.0) {
          eteGauge.className = "sensor-value status-lowstock";
        } else {
          eteGauge.className = "sensor-value green";
        }
      }
    }

    // --- Button Event Handlers ---
    async function handleGrabItem() {
      if (state.shelf.currentQty > 0) {
        const prevQty = state.shelf.currentQty;
        state.shelf.currentQty -= 1;
        
        const prevWeight = prevQty * unitWeight;
        const nextWeight = state.shelf.currentQty * unitWeight;

        logTelemetry(`Weight difference detected: -${unitWeight.toFixed(2)}kg (Quantity decreased).`, "system");
        logTelemetry(`Load cells reading adjusted: ${prevWeight.toFixed(2)}kg -> ${nextWeight.toFixed(2)}kg.`, "info");
        
        updateShelfUI();

        // Check reorder threshold (<= 30% of capacity)
        const reorderLimit = Math.ceil(state.shelf.maxQty * 0.3);
        if (state.shelf.currentQty <= reorderLimit && !state.shelf.isReordering) {
          state.shelf.isReordering = true;
          logTelemetry(`Optical verification sensor: count dropped below critical reorder threshold (${reorderLimit} units).`, "warning");
          logTelemetry(`AI Predictive restock trigger: Initialized procurement order.`, "warning");
          showToast(`Shelf sensor triggered Auto-Reorder for ${currentItem.name}!`, "warning");
          
          logTelemetry(`Supplier API call dispatched for restock batch. Order reference: STKM-${Date.now().toString().slice(-6)}.`, "system");
          
          // Simulate supplier shipping delay
          setTimeout(async () => {
            if (state.currentTab === "shelf" && state.shelf.selectedId === currentItem.id) {
              const restockBatch = state.shelf.maxQty - state.shelf.currentQty;
              state.shelf.currentQty = state.shelf.maxQty;
              state.shelf.isReordering = false;
              
              logTelemetry(`Supplier restock shipment arrived at docking port. shelf replenished.`, "system");
              logTelemetry(`Calibrating weight sensor to max load: ${(state.shelf.maxQty * unitWeight).toFixed(2)} kg.`, "system");
              showToast(`Supplier restocked Predictive Shelf: +${restockBatch} units!`, "success");
              
              // Trigger backend API reorder sync
              await API.triggerReorder(currentItem.id);
              
              updateShelfUI();
            } else {
              // Just trigger backend sync and reset state reorder flag if tab changed
              state.shelf.isReordering = false;
              await API.triggerReorder(currentItem.id);
            }
          }, 3500);
        }
      } else {
        showToast("Predictive Shelf is completely empty!", "error");
        logTelemetry("Sensor alert: Zero load detected. Optical paths fully open.", "alert");
      }
    }

    function handleReturnItem() {
      if (state.shelf.currentQty < state.shelf.maxQty) {
        const prevQty = state.shelf.currentQty;
        state.shelf.currentQty += 1;
        
        const prevWeight = prevQty * unitWeight;
        const nextWeight = state.shelf.currentQty * unitWeight;

        logTelemetry(`Weight difference detected: +${unitWeight.toFixed(2)}kg (Quantity increased).`, "system");
        logTelemetry(`Load cells reading adjusted: ${prevWeight.toFixed(2)}kg -> ${nextWeight.toFixed(2)}kg.`, "info");
        
        updateShelfUI();
      } else {
        showToast("Predictive Shelf is at maximum capacity!", "error");
        logTelemetry("Sensor warning: Max structural load capacity reached.", "warning");
      }
    }

    async function handleRestockItem() {
      if (state.shelf.currentQty < state.shelf.maxQty) {
        const restockQty = state.shelf.maxQty - state.shelf.currentQty;
        state.shelf.currentQty = state.shelf.maxQty;
        state.shelf.isReordering = false;
        
        logTelemetry(`Manual override: supplier restock triggered.`, "system");
        logTelemetry(`Replenished +${restockQty} units. Weight sensor calibrated.`, "system");
        showToast(`Manually replenished: +${restockQty} units!`, "success");
        
        await API.triggerReorder(currentItem.id);
        updateShelfUI();
      } else {
        showToast("Shelf already fully stocked.", "success");
      }
    }

    // Trigger initial renders
    updateShelfUI();
    updateConsoleDOM();

    // Select product change listener
    document.getElementById("shelfProductSelect").addEventListener("change", (e) => {
      state.shelf.selectedId = e.target.value;
      const selectedItem = state.items.find(x => x.id === e.target.value);
      const newMax = getStandardMaxQty(selectedItem.category);
      state.shelf.maxQty = newMax;
      state.shelf.currentQty = Math.min(selectedItem.quantity, newMax);
      state.shelf.isReordering = false;
      
      // Clear logs
      state.shelf.logs = [];
      logTelemetry(`Calibrated telemetry sensors for product [${selectedItem.name}].`, "system");
      logTelemetry(`Load cells tare balanced. Optical arrays calibrated.`, "system");
      
      renderShelfPage();
    });

    // Wire buttons
    document.getElementById("grabShelfBtn").addEventListener("click", handleGrabItem);
    document.getElementById("returnShelfBtn").addEventListener("click", handleReturnItem);
    document.getElementById("restockShelfBtn").addEventListener("click", handleRestockItem);

  }

  // Set to keep track of automated alerts sent in current session
  state.notifications.automatedSent = new Set();

  function checkStockAlerts(item) {
    if (!item) return;
    if (item.quantity <= item.reorderLevel) {
      if (!state.notifications.automatedSent.has(item.id)) {
        state.notifications.automatedSent.add(item.id);
        
        // Show HTML5 Notification if supported and permitted
        if ("Notification" in window) {
          if (Notification.permission === "granted") {
            new Notification("StockMind AI Alert", {
              body: `Low stock detected! SKU: ${item.sku}. Item: ${item.name}. Quantity: ${item.quantity}.`
            });
          }
        }
        
        // Dispatch notifications if automated alerts are set to true
        if (state.notifications.enableLowStockSMS) {
          sendAlertNotification(item, "sms", "auto");
        }
        if (state.notifications.enableLowStockEmail) {
          sendAlertNotification(item, "email", "auto");
        }
      }
    } else {
      // If quantity goes above threshold, clear the sent flag so it can alert again if it falls below later
      state.notifications.automatedSent.delete(item.id);
    }
  }

  async function sendAlertNotification(item, type, mode = "manual", alertType = "lowstock") {
    const isTest = mode === "manual-test";
    
    // Construct Message
    let text = "";
    let subject = "";
    let emailBody = "";

    if (alertType === "expiry") {
      subject = `[StockAlert] EXPIRY WARNING: ${item.name} (${item.sku})`;
      text = `⚠️ *Expiry Alert* ⚠️\n\nProduct *${item.name}* (SKU: ${item.sku}) is expiring on *${item.expiryDate}*!\n\n_Please discount or re-shelve this item._`;
      emailBody = `Stock Expiration Warning from StockMind AI:\n\nThe product "${item.name}" (SKU: ${item.sku}) is expiring on ${item.expiryDate}.\n\nCurrent quantity: ${item.quantity}\nLocation: ${item.location}\n\nSent on: ${new Date().toLocaleString()}`;
    } else {
      subject = `[StockAlert] Low stock: ${item.name} (${item.sku})`;
      text = `⚠️ *Low Stock Alert* ⚠️\n\nProduct *${item.name}* (SKU: ${item.sku}) is low on stock!\n\nCurrent stock: *${item.quantity}* units\nReorder Level: *${item.reorderLevel}* units\nLocation: *${item.location}*\n\n_Please procure a replenishment._`;
      emailBody = `Stock Threshold Alert from StockMind AI:\n\nThe product "${item.name}" (SKU: ${item.sku}) has fallen below its reorder threshold.\n\nCurrent quantity: ${item.quantity}\nReorder level: ${item.reorderLevel}\nLocation: ${item.location}\n\nSent on: ${new Date().toLocaleString()}`;
    }

    if (type === "whatsapp") {
      // Direct redirection Click-to-chat
      const formattedNum = state.notifications.mobile.replace(/[^\d+]/g, '');
      const waUrl = `https://wa.me/${formattedNum}?text=${encodeURIComponent(text.replace(/\*/g, ''))}`;
      window.open(waUrl, "_blank");

      addAlertHistory("whatsapp", item.sku, `WhatsApp Alert dispatched to ${state.notifications.mobile}`);
      showToast("WhatsApp click-to-chat window opened!", "success");
    } 
    
    else if (type === "email") {
      if (state.notifications.transportType === "client") {
        // Client side options
        if (state.notifications.emailjsKey && state.notifications.emailjsService && state.notifications.emailjsTemplate) {
          try {
            const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                service_id: state.notifications.emailjsService,
                template_id: state.notifications.emailjsTemplate,
                user_id: state.notifications.emailjsKey,
                template_params: {
                  to_email: state.notifications.email,
                  subject: subject,
                  product_name: item.name,
                  sku: item.sku,
                  quantity: item.quantity,
                  reorder_level: item.reorderLevel || "N/A",
                  location: item.location,
                  message: emailBody
                }
              })
            });
            if (res.ok) {
              addAlertHistory("email", item.sku, `Email sent to ${state.notifications.email} via EmailJS`);
              showToast("Email alert sent successfully via EmailJS!", "success");
            } else {
              throw new Error("EmailJS service error");
            }
          } catch (err) {
            showToast("EmailJS failed. Falling back to Mailto link.", "warning");
            openMailtoLink(state.notifications.email, subject, emailBody, item.sku);
          }
        } else {
          openMailtoLink(state.notifications.email, subject, emailBody, item.sku);
        }
      } else {
        // Backend Server Routing
        try {
          const res = await fetch("/api/alerts/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "email",
              to: state.notifications.email,
              subject: subject,
              body: emailBody
            })
          });
          const data = await res.json();
          if (data.success) {
            addAlertHistory("email", item.sku, `Email Alert dispatched via Python Server`);
            showToast(data.message || "Email alert sent via Server!", "success");
          } else {
            throw new Error(data.error || "Server failed");
          }
        } catch (err) {
          showToast(`Server alert failed: ${err.message}. Falling back to Mailto.`, "warning");
          openMailtoLink(state.notifications.email, subject, emailBody, item.sku);
        }
      }
    } 
    
    else if (type === "sms") {
      const plainMsg = text.replace(/\*/g, '').replace(/⚠️/g, 'Alert:');
      if (state.notifications.transportType === "client") {
        if (state.notifications.twilioSid && state.notifications.twilioToken && state.notifications.twilioFrom) {
          try {
            const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${state.notifications.twilioSid}/Messages.json`;
            const auth = btoa(`${state.notifications.twilioSid}:${state.notifications.twilioToken}`);
            const res = await fetch(twilioUrl, {
              method: "POST",
              headers: {
                "Authorization": `Basic ${auth}`,
                "Content-Type": "application/x-www-form-urlencoded"
              },
              body: new URLSearchParams({
                To: state.notifications.mobile,
                From: state.notifications.twilioFrom,
                Body: plainMsg
              })
            });
            if (res.ok) {
              addAlertHistory("sms", item.sku, `SMS alert sent to ${state.notifications.mobile} via Twilio API`);
              showToast("SMS sent successfully via Twilio client!", "success");
            } else {
              throw new Error("Twilio API failed");
            }
          } catch (err) {
            showToast(`Twilio direct API failed. Simulating SMS locally.`, "warning");
            addAlertHistory("sms", item.sku, `[Simulated] SMS to ${state.notifications.mobile}: ${plainMsg}`);
          }
        } else {
          showToast(`Twilio SMS not configured. Simulating SMS locally.`, "info");
          addAlertHistory("sms", item.sku, `[Simulated] SMS to ${state.notifications.mobile}: ${plainMsg}`);
        }
      } else {
        // Backend Server Routing
        try {
          const res = await fetch("/api/alerts/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "sms",
              to: state.notifications.mobile,
              body: plainMsg
            })
          });
          const data = await res.json();
          if (data.success) {
            addAlertHistory("sms", item.sku, `SMS sent to ${state.notifications.mobile} via Server`);
            showToast(data.message || "SMS Alert sent via Server!", "success");
          } else {
            throw new Error(data.error || "Server failed");
          }
        } catch (err) {
          showToast(`Server alert failed: ${err.message}. Simulating SMS locally.`, "warning");
          addAlertHistory("sms", item.sku, `[Simulated] SMS to ${state.notifications.mobile}: ${plainMsg}`);
        }
      }
    }
  }

  function openMailtoLink(email, subject, body, sku) {
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    addAlertHistory("email", sku, `Mail client opened for ${email}`);
    showToast("Native mail client triggered!", "success");
  }

  function addAlertHistory(type, sku, message) {
    state.notifications.history.unshift({
      id: `alert-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: type,
      sku: sku,
      message: message
    });
    if (state.notifications.history.length > 10) {
      state.notifications.history.pop();
    }
    localStorage.setItem("alert_history", JSON.stringify(state.notifications.history));
    
    if (state.currentTab === "alerts") {
      const streamDiv = document.getElementById("phoneAlertsStream");
      if (streamDiv) {
        streamDiv.innerHTML = state.notifications.history.map(hist => `
          <div class="phone-msg-bubble">
            <div class="phone-msg-header">
              <span class="phone-msg-tag ${hist.type}">${hist.type}</span>
              <span class="phone-msg-time">${hist.timestamp}</span>
            </div>
            <div class="phone-msg-body">
              ${hist.sku ? `SKU: <span class="phone-msg-sku">${hist.sku}</span><br/>` : ""}
              ${hist.message}
            </div>
          </div>
        `).join("");
      }
    }
  }

  function renderAlertsPage() {
    const lowStockItems = state.items.filter(x => x.quantity <= x.reorderLevel);
    const dateToday = new Date("2026-07-07");
    const expiringItems = state.items.filter(x => {
      if (!x.expiryDate) return false;
      const days = Math.ceil((new Date(x.expiryDate) - dateToday) / (1000 * 60 * 60 * 24));
      return days <= 30;
    });

    const totalAlertCount = lowStockItems.length + expiringItems.length;

    contentArea.innerHTML = `
      <div class="alerts-layout">
        <!-- Left Panel: Settings Form -->
        <div class="card settings-card">
          <div class="card-title">Alert & Notification Panel</div>
          
          <form id="alertSettingsForm" style="display: flex; flex-direction: column; gap: 20px;">
            <!-- Target Contacts -->
            <div class="settings-group">
              <div class="settings-group-title">Recipient Configurations</div>
              <div class="input-field-group">
                <label class="input-field-label">Target Email Address</label>
                <input type="email" class="input-field" id="alertEmailInput" value="${state.notifications.email}" required />
              </div>
              <div class="input-field-group">
                <label class="input-field-label">Target Mobile Number (With Country Code)</label>
                <input type="text" class="input-field" id="alertMobileInput" value="${state.notifications.mobile}" placeholder="+919876543210" required />
              </div>
            </div>

            <!-- Transport Select -->
            <div class="settings-group">
              <div class="settings-group-title">Routing Transport Mechanism</div>
              <div class="input-field-group">
                <select class="select-custom" id="alertTransportSelect" style="width: 100%;">
                  <option value="client" ${state.notifications.transportType === "client" ? "selected" : ""}>Direct Frontend Routing (mailto, wa.me Click-to-Chat)</option>
                  <option value="server" ${state.notifications.transportType === "server" ? "selected" : ""}>Local Server Routing (Calls python backend server)</option>
                </select>
              </div>
            </div>

            <!-- Auto Rules Toggles -->
            <div class="settings-group">
              <div class="settings-group-title">Alert Triggers & Rules</div>
              <div class="checkbox-toggle-container">
                <div>
                  <div style="font-weight: 600; font-size:13px;">Low Stock Alerts</div>
                  <div style="font-size:11px; color: var(--text-muted);">Alert when product stock is below reorder level</div>
                </div>
                <label class="switch">
                  <input type="checkbox" id="toggleLowStockSMS" ${state.notifications.enableLowStockSMS ? "checked" : ""} />
                  <span class="slider"></span>
                </label>
              </div>
              <div class="checkbox-toggle-container">
                <div>
                  <div style="font-weight: 600; font-size:13px;">Expiry Alerts</div>
                  <div style="font-size:11px; color: var(--text-muted);">Alert when product is within 30 days of expiration</div>
                </div>
                <label class="switch">
                  <input type="checkbox" id="toggleExpirySMS" ${state.notifications.enableExpirySMS ? "checked" : ""} />
                  <span class="slider"></span>
                </label>
              </div>
            </div>

            <!-- Advanced Config: Third Party Integrations -->
            <div class="settings-group" style="background: rgba(139, 92, 246, 0.05);">
              <div class="settings-group-title" style="cursor:pointer;" id="advancedToggle">
                <span>Advanced Integrations (Twilio / EmailJS)</span>
                <span id="advChevron" style="font-size:12px;">▼</span>
              </div>
              <div id="advancedSettingsContent" style="display: none; flex-direction: column; gap: 12px; margin-top: 8px;">
                <div style="font-size:11px; color: var(--text-muted); line-height: 1.4;">
                  Enter details to connect directly to Twilio SMS and EmailJS from the static frontend. If blank, SMS alerts will mock/verify, and Email alerts will fall back to native client mailto links.
                </div>
                <div class="input-field-group">
                  <label class="input-field-label">Twilio Account SID</label>
                  <input type="text" class="input-field" id="alertTwilioSid" value="${state.notifications.twilioSid}" />
                </div>
                <div class="input-field-group">
                  <label class="input-field-label">Twilio Auth Token</label>
                  <input type="password" class="input-field" id="alertTwilioToken" value="${state.notifications.twilioToken}" />
                </div>
                <div class="input-field-group">
                  <label class="input-field-label">Twilio Phone Number (From)</label>
                  <input type="text" class="input-field" id="alertTwilioFrom" value="${state.notifications.twilioFrom}" />
                </div>
                <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 8px 0;" />
                <div class="input-field-group">
                  <label class="input-field-label">EmailJS Public Key</label>
                  <input type="text" class="input-field" id="alertEmailjsKey" value="${state.notifications.emailjsKey}" />
                </div>
                <div class="input-field-group">
                  <label class="input-field-label">EmailJS Service ID</label>
                  <input type="text" class="input-field" id="alertEmailjsService" value="${state.notifications.emailjsService}" />
                </div>
                <div class="input-field-group">
                  <label class="input-field-label">EmailJS Template ID</label>
                  <input type="text" class="input-field" id="alertEmailjsTemplate" value="${state.notifications.emailjsTemplate}" />
                </div>
              </div>
            </div>

            <!-- Form Actions -->
            <div style="display: flex; gap: 12px;">
              <button type="submit" class="btn btn-primary" style="flex:1; justify-content:center;">Save Configuration</button>
              <button type="button" class="btn btn-secondary" id="btnSendTestAlert" style="justify-content:center;">Send Test Alert</button>
            </div>
          </form>
        </div>

        <!-- Right Panel: Live Alerts List & Simulator -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          <!-- Mock Phone Simulator -->
          <div class="card" style="padding: 20px;">
            <div class="card-title">Live Notification Stream</div>
            <div class="simulator-container">
              <div class="phone-mockup">
                <div class="phone-screen">
                  <div class="phone-header">
                    <span>StockMind AI</span>
                    <span>100% 🔋</span>
                  </div>
                  <div class="phone-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    Mobile & Email Inbox
                  </div>
                  <div class="phone-alerts-list" id="phoneAlertsStream">
                    ${state.notifications.history.length === 0 ? `
                      <div style="text-align: center; color: var(--text-muted); font-size: 11px; margin-top: 40px; line-height: 1.5;">
                        <div style="font-size:24px; margin-bottom: 8px;">📲</div>
                        No notifications sent yet in this session. Trigger one below to see the mockup smartphone render it in real-time!
                      </div>
                    ` : state.notifications.history.map(hist => `
                      <div class="phone-msg-bubble">
                        <div class="phone-msg-header">
                          <span class="phone-msg-tag ${hist.type}">${hist.type}</span>
                          <span class="phone-msg-time">${hist.timestamp}</span>
                        </div>
                        <div class="phone-msg-body">
                          ${hist.sku ? `SKU: <span class="phone-msg-sku">${hist.sku}</span><br/>` : ""}
                          ${hist.message}
                        </div>
                      </div>
                    `).join("")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Live Active Alerts Table -->
      <div class="card" style="margin-top: 24px;">
        <div class="card-title">
          <span>Active Warehouse Threshold Alerts</span>
          <span class="badge-status ${totalAlertCount > 0 ? 'lowstock' : 'instock'}">${totalAlertCount} active alerts</span>
        </div>
        <div class="table-container">
          <table class="table-custom alerts-list-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Current stock</th>
                <th>Alert Type</th>
                <th style="text-align: right;">Manual Notification Triggers</th>
              </tr>
            </thead>
            <tbody>
              ${lowStockItems.length === 0 && expiringItems.length === 0 ? `
                <tr>
                  <td colspan="5" style="text-align: center; padding: 24px; color: var(--status-instock); font-weight:600;">
                    ✓ All inventory stocks and expirations are in healthy status.
                  </td>
                </tr>
              ` : ""}
              ${lowStockItems.map(item => `
                <tr>
                  <td style="font-weight: 600;">${item.name} <code style="font-size:11px;">(${item.sku})</code></td>
                  <td>${item.category}</td>
                  <td>
                    <span class="badge-status outstock">${item.quantity} units</span> 
                    <span style="font-size:11px; color:var(--text-muted);">Threshold: ${item.reorderLevel}</span>
                  </td>
                  <td><span class="badge-status lowstock" style="padding: 2px 8px;">Low Stock</span></td>
                  <td style="text-align: right;">
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                      <button class="btn-notif-action wa" data-id="${item.id}" data-type="whatsapp">
                        💬 WhatsApp
                      </button>
                      <button class="btn-notif-action mail" data-id="${item.id}" data-type="email">
                        ✉️ Email
                      </button>
                      <button class="btn-notif-action sms" data-id="${item.id}" data-type="sms">
                        📱 SMS
                      </button>
                    </div>
                  </td>
                </tr>
              `).join("")}
              ${expiringItems.map(item => {
                const days = Math.ceil((new Date(item.expiryDate) - dateToday) / (1000 * 60 * 60 * 24));
                return `
                  <tr>
                    <td style="font-weight: 600;">${item.name} <code style="font-size:11px;">(${item.sku})</code></td>
                    <td>${item.category}</td>
                    <td>Expiry: <code>${item.expiryDate}</code></td>
                    <td><span class="badge-status outstock" style="padding: 2px 8px;">Expires in ${days} days</span></td>
                    <td style="text-align: right;">
                      <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        <button class="btn-notif-action wa" data-id="${item.id}" data-type="whatsapp" data-alert="expiry">
                          💬 WhatsApp
                        </button>
                        <button class="btn-notif-action mail" data-id="${item.id}" data-type="email" data-alert="expiry">
                          ✉️ Email
                        </button>
                        <button class="btn-notif-action sms" data-id="${item.id}" data-type="sms" data-alert="expiry">
                          📱 SMS
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Hook Advanced settings collapsible toggle
    const advancedToggle = document.getElementById("advancedToggle");
    const advancedSettingsContent = document.getElementById("advancedSettingsContent");
    const advChevron = document.getElementById("advChevron");

    advancedToggle.addEventListener("click", () => {
      const isHidden = advancedSettingsContent.style.display === "none";
      advancedSettingsContent.style.display = isHidden ? "flex" : "none";
      advChevron.textContent = isHidden ? "▲" : "▼";
    });

    // Save configurations
    const settingsForm = document.getElementById("alertSettingsForm");
    if (settingsForm) {
      settingsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        try {
          const emailInput = document.getElementById("alertEmailInput");
          const mobileInput = document.getElementById("alertMobileInput");
          const transportSelect = document.getElementById("alertTransportSelect");

          if (!emailInput || !mobileInput || !transportSelect) {
            throw new Error("Required configuration input fields are missing from the DOM.");
          }

          state.notifications.email = emailInput.value.trim();
          state.notifications.mobile = mobileInput.value.trim();
          state.notifications.transportType = transportSelect.value;
          
          const toggleLowStock = document.getElementById("toggleLowStockSMS");
          const toggleExpiry = document.getElementById("toggleExpirySMS");

          state.notifications.enableLowStockSMS = toggleLowStock ? toggleLowStock.checked : true;
          state.notifications.enableLowStockEmail = toggleLowStock ? toggleLowStock.checked : true;
          state.notifications.enableExpirySMS = toggleExpiry ? toggleExpiry.checked : true;
          state.notifications.enableExpiryEmail = toggleExpiry ? toggleExpiry.checked : true;

          const twilioSid = document.getElementById("alertTwilioSid");
          const twilioToken = document.getElementById("alertTwilioToken");
          const twilioFrom = document.getElementById("alertTwilioFrom");

          state.notifications.twilioSid = twilioSid ? twilioSid.value.trim() : "";
          state.notifications.twilioToken = twilioToken ? twilioToken.value.trim() : "";
          state.notifications.twilioFrom = twilioFrom ? twilioFrom.value.trim() : "";

          const emailjsKey = document.getElementById("alertEmailjsKey");
          const emailjsService = document.getElementById("alertEmailjsService");
          const emailjsTemplate = document.getElementById("alertEmailjsTemplate");

          state.notifications.emailjsKey = emailjsKey ? emailjsKey.value.trim() : "";
          state.notifications.emailjsService = emailjsService ? emailjsService.value.trim() : "";
          state.notifications.emailjsTemplate = emailjsTemplate ? emailjsTemplate.value.trim() : "";

          // Persist to localStorage
          localStorage.setItem("alert_email", state.notifications.email);
          localStorage.setItem("alert_mobile", state.notifications.mobile);
          localStorage.setItem("alert_transport_type", state.notifications.transportType);
          localStorage.setItem("alert_enable_low_stock_sms", state.notifications.enableLowStockSMS);
          localStorage.setItem("alert_enable_low_stock_email", state.notifications.enableLowStockEmail);
          localStorage.setItem("alert_enable_expiry_sms", state.notifications.enableExpirySMS);
          localStorage.setItem("alert_enable_expiry_email", state.notifications.enableExpiryEmail);
          
          localStorage.setItem("alert_twilio_sid", state.notifications.twilioSid);
          localStorage.setItem("alert_twilio_token", state.notifications.twilioToken);
          localStorage.setItem("alert_twilio_from", state.notifications.twilioFrom);

          localStorage.setItem("alert_emailjs_key", state.notifications.emailjsKey);
          localStorage.setItem("alert_emailjs_service", state.notifications.emailjsService);
          localStorage.setItem("alert_emailjs_template", state.notifications.emailjsTemplate);

          showToast("Notification configurations saved successfully!", "success");
          
          // Refresh view
          renderAlertsPage();
        } catch (err) {
          console.error("Save Configuration Error: ", err);
          showToast(`Failed to save configuration: ${err.message}`, "error");
        }
      });
    }

    // Test Alert
    document.getElementById("btnSendTestAlert").addEventListener("click", async () => {
      showToast("Triggering test notifications...", "info");
      const testItem = {
        name: "Test Almond Milk (Demo SKU)",
        sku: "TEST-SKU-999",
        quantity: 3,
        reorderLevel: 10,
        location: "Zone A - Test Rack"
      };
      
      await sendAlertNotification(testItem, "whatsapp", "manual-test");
      await sendAlertNotification(testItem, "email", "manual-test");
      await sendAlertNotification(testItem, "sms", "manual-test");
    });

    // Manual triggers
    const triggerBtns = contentArea.querySelectorAll(".btn-notif-action");
    triggerBtns.forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const type = btn.dataset.type;
        const alertType = btn.dataset.alert || "lowstock";
        
        const item = state.items.find(x => x.id === id);
        if (item) {
          showToast(`Sending ${type} alert for ${item.name}...`, "info");
          await sendAlertNotification(item, type, "manual", alertType);
        }
      });
    });
  }

  // Run app initializer
  init();
});
