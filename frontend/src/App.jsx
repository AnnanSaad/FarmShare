import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  CloudOff,
  History,
  Leaf,
  RefreshCw,
  ShieldCheck,
  Tractor,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import "./App.css";

const API =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const STATUS_LABELS = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  IN_USE: "In use",
  REPAIR: "Repair",
};

const STATUS_CLASS = {
  AVAILABLE: "available",
  RESERVED: "reserved",
  IN_USE: "in-use",
  REPAIR: "repair",
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getStatusClass = (status) =>
  STATUS_CLASS[status] || "available";

const getStatusLabel = (status) =>
  STATUS_LABELS[status] || status;

const toLocalInputValue = (date) => {
  const offset = date.getTimezoneOffset();

  const adjusted = new Date(
    date.getTime() - offset * 60 * 1000
  );

  return adjusted.toISOString().slice(0, 16);
};

function EquipmentCard({
  equipment,
  bookings,
  offline,
  adminMode,
  onReserve,
  onInspect,
  onReportDamage,
  onHistory,
  onReturnToService,
  onReturnBooking,
}) {
  const status = equipment.status;

  const booking = bookings.find(
    (item) =>
      item.equipment_id === equipment.id &&
      ["UPCOMING", "ACTIVE"].includes(item.status)
  );

  const upcomingBooking =
    booking?.status === "UPCOMING" ? booking : null;

  const activeBooking =
    booking?.status === "ACTIVE" ? booking : null;

  return (
    <article className="equipment-card">
      <div className="equipment-card-top">
        <div className="equipment-icon">
          <Tractor size={22} strokeWidth={1.8} />
        </div>

        <span
          className={`status-pill ${getStatusClass(status)}`}
        >
          <CircleDot size={10} strokeWidth={2.5} />
          {getStatusLabel(status)}
        </span>
      </div>

      <div className="equipment-category">
        {equipment.category}
      </div>

      <h3>{equipment.name}</h3>

      <p className="equipment-description">
        {equipment.description}
      </p>

      <div className="location">
        <CircleDot size={13} strokeWidth={2} />
        <span>{equipment.location}</span>
      </div>

      {upcomingBooking && status === "RESERVED" && (
        <div className="booking-preview">
          <div>
            <span className="booking-preview-label">
              Reserved for
            </span>

            <strong>
              {upcomingBooking.farmer_name}
            </strong>
          </div>

          <div>
            <span className="booking-preview-label">
              Starts
            </span>

            <strong>
              {formatDateTime(
                upcomingBooking.start_time
              )}
            </strong>
          </div>
        </div>
      )}

      {activeBooking && status === "IN_USE" && (
        <div className="booking-preview">
          <div>
            <span className="booking-preview-label">
              Checked out by
            </span>

            <strong>
              {activeBooking.farmer_name}
            </strong>
          </div>

          <div>
            <span className="booking-preview-label">
              Started
            </span>

            <strong>
              {formatDateTime(
                activeBooking.start_time
              )}
            </strong>
          </div>
        </div>
      )}

      {status === "REPAIR" && (
        <div className="attention-note">
          <AlertTriangle size={15} />
          <span>New bookings paused</span>
        </div>
      )}

      <div className="equipment-actions">
        {status === "AVAILABLE" && (
          <button
            type="button"
            className="primary-button small"
            disabled={offline}
            onClick={() => onReserve(equipment)}
          >
            <span>
              {offline
                ? "Reconnect to reserve"
                : "Reserve equipment"}
            </span>

            {!offline && <ChevronRight size={16} />}
          </button>
        )}

        {status === "RESERVED" &&
          upcomingBooking && (
            <button
              type="button"
              className="primary-button small"
              disabled={offline}
              onClick={() =>
                onInspect(equipment)
              }
            >
              <span>
                {offline
                  ? "Reconnect to check out"
                  : "Inspect & check out"}
              </span>

              {!offline && (
                <ChevronRight size={16} />
              )}
            </button>
          )}

        {status === "IN_USE" &&
          activeBooking && (
            <>
              <button
                type="button"
                className="primary-button small"
                disabled={offline}
                onClick={() =>
                  onReturnBooking(activeBooking)
                }
              >
                <span>Return equipment</span>
                <CheckCircle2 size={16} />
              </button>

              <button
                type="button"
                className="icon-button danger"
                title="Report damage"
                aria-label="Report damage"
                disabled={offline}
                onClick={() =>
                  onReportDamage(equipment)
                }
              >
                <AlertTriangle size={16} />
              </button>
            </>
          )}

        {status === "REPAIR" && (
          <button
            type="button"
            className="repair-button"
            disabled={!adminMode || offline}
            onClick={() =>
              onReturnToService(equipment)
            }
          >
            <ShieldCheck size={16} />

            <span>
              {adminMode
                ? "Return to service"
                : "Admin approval required"}
            </span>
          </button>
        )}

        <button
          type="button"
          className="secondary-button small"
          onClick={() => onHistory(equipment)}
        >
          <History size={16} />
          <span>History</span>
        </button>
      </div>
    </article>
  );
}

export default function App() {
  const [equipment, setEquipment] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [offline, setOffline] = useState(
    !navigator.onLine
  );

  const [adminMode, setAdminMode] = useState(false);
  const [modal, setModal] = useState(null);

  const [selectedEquipment, setSelectedEquipment] =
    useState(null);

  const [selectedBooking, setSelectedBooking] =
    useState(null);

  const [farmerName, setFarmerName] =
    useState("Ravi Kumar");

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [inspection, setInspection] = useState({
    engine_ok: true,
    tires_ok: true,
    leakage_ok: true,
    attachments_ok: true,
    safety_ok: true,
  });

  const [damageDescription, setDamageDescription] =
    useState("");

  const [damageSeverity, setDamageSeverity] =
    useState("MEDIUM");

  const [toast, setToast] = useState(null);

  const showToast = (
    message,
    type = "success"
  ) => {
    setToast({
      message,
      type,
    });

    window.setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        equipmentResponse,
        bookingsResponse,
      ] = await Promise.all([
        fetch(`${API}/api/equipment/`),
        fetch(`${API}/api/bookings/`),
      ]);

      if (
        !equipmentResponse.ok ||
        !bookingsResponse.ok
      ) {
        throw new Error(
          "Failed to load cooperative data."
        );
      }

      const equipmentData =
        await equipmentResponse.json();

      const bookingsData =
        await bookingsResponse.json();

      setEquipment(equipmentData);
      setBookings(bookingsData);
      setOffline(false);
    } catch (error) {
      console.error(error);

      setOffline(true);

      if (equipment.length === 0) {
        showToast(
          "Could not reach the cooperative server.",
          "error"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleOnline = () => {
      setOffline(false);
      loadData();
    };

    const handleOffline = () => {
      setOffline(true);
    };

    window.addEventListener(
      "online",
      handleOnline
    );

    window.addEventListener(
      "offline",
      handleOffline
    );

    return () => {
      window.removeEventListener(
        "online",
        handleOnline
      );

      window.removeEventListener(
        "offline",
        handleOffline
      );
    };
  }, []);

  const availableCount = useMemo(
    () =>
      equipment.filter(
        (item) => item.status === "AVAILABLE"
      ).length,
    [equipment]
  );

  const inUseCount = useMemo(
    () =>
      equipment.filter(
        (item) => item.status === "IN_USE"
      ).length,
    [equipment]
  );

  const attentionCount = useMemo(
    () =>
      equipment.filter(
        (item) => item.status === "REPAIR"
      ).length,
    [equipment]
  );

  const upcomingBookings = useMemo(
    () =>
      [...bookings]
        .filter(
          (booking) =>
            booking.status === "UPCOMING"
        )
        .sort(
          (a, b) =>
            new Date(a.start_time) -
            new Date(b.start_time)
        ),
    [bookings]
  );

  const completedDemoSteps = 3;

  const startBooking = (item) => {
    if (offline) {
      showToast(
        "Reconnect before creating a booking.",
        "error"
      );
      return;
    }

    setSelectedEquipment(item);

    const now = new Date();

    const later = new Date(
      now.getTime() + 3 * 60 * 60 * 1000
    );

    setStartTime(
      toLocalInputValue(now)
    );

    setEndTime(
      toLocalInputValue(later)
    );

    setModal("booking");
  };

  const createBooking = async () => {
    if (!selectedEquipment) {
      return;
    }

    if (offline) {
      showToast(
        "Reconnect before creating a booking.",
        "error"
      );
      return;
    }

    if (!farmerName.trim()) {
      showToast(
        "Enter a farmer name.",
        "error"
      );
      return;
    }

    if (!startTime || !endTime) {
      showToast(
        "Select both start and end time.",
        "error"
      );
      return;
    }

    if (
      new Date(endTime) <=
      new Date(startTime)
    ) {
      showToast(
        "End time must be after start time.",
        "error"
      );
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/bookings/`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            equipment_id:
              selectedEquipment.id,
            farmer_name:
              farmerName.trim(),
            start_time:
              new Date(
                startTime
              ).toISOString(),
            end_time:
              new Date(
                endTime
              ).toISOString(),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Booking could not be created."
        );
      }

      setModal(null);
      setSelectedEquipment(null);

      await loadData();

      showToast(
        "Equipment reserved successfully."
      );
    } catch (error) {
      console.error(error);

      showToast(
        error.message ||
          "Booking could not be created.",
        "error"
      );
    }
  };

  const startInspection = (
    equipmentItem
  ) => {
    if (offline) {
      showToast(
        "Reconnect before checking out equipment.",
        "error"
      );
      return;
    }

    const booking =
      bookings.find(
        (item) =>
          item.equipment_id ===
            equipmentItem.id &&
          item.status === "UPCOMING"
      );

    if (!booking) {
      showToast(
        "No upcoming booking found for this machine.",
        "error"
      );
      return;
    }

    setSelectedEquipment(
      equipmentItem
    );

    setSelectedBooking(
      booking
    );

    setInspection({
      engine_ok: true,
      tires_ok: true,
      leakage_ok: true,
      attachments_ok: true,
      safety_ok: true,
    });

    setModal("inspection");
  };

  const checkoutEquipment = async () => {
    if (
      !selectedBooking ||
      !selectedEquipment
    ) {
      showToast(
        "Booking information is missing.",
        "error"
      );
      return;
    }

    if (offline) {
      showToast(
        "Reconnect before checking out equipment.",
        "error"
      );
      return;
    }

    const passed =
      Object.values(
        inspection
      ).every(Boolean);

    if (!passed) {
      showToast(
        "All five safety checks must pass before checkout.",
        "error"
      );
      return;
    }

    try {
      const conditionResponse =
        await fetch(
          `${API}/api/bookings/${selectedBooking.id}/condition`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              equipment_id:
                selectedEquipment.id,
              booking_id:
                selectedBooking.id,
              reported_by:
                selectedBooking.farmer_name,
              engine_ok:
                inspection.engine_ok,
              tires_ok:
                inspection.tires_ok,
              leakage_ok:
                inspection.leakage_ok,
              attachments_ok:
                inspection.attachments_ok,
              safety_ok:
                inspection.safety_ok,
              report_type: "PASS",
              description:
                "Pre-use inspection completed. All required checks passed.",
              severity: "LOW",
            }),
          }
        );

      const conditionData =
        await conditionResponse.json();

      if (!conditionResponse.ok) {
        throw new Error(
          conditionData.detail ||
            "Could not save the pre-use inspection."
        );
      }

      const checkoutResponse =
        await fetch(
          `${API}/api/bookings/${selectedBooking.id}/checkout`,
          {
            method: "POST",
          }
        );

      const checkoutData =
        await checkoutResponse.json();

      if (!checkoutResponse.ok) {
        throw new Error(
          checkoutData.detail ||
            "Checkout failed."
        );
      }

      const equipmentName =
        selectedEquipment.name;

      setModal(null);
      setSelectedEquipment(null);
      setSelectedBooking(null);

      setInspection({
        engine_ok: true,
        tires_ok: true,
        leakage_ok: true,
        attachments_ok: true,
        safety_ok: true,
      });

      await loadData();

      showToast(
        `${equipmentName} checked out successfully.`
      );
    } catch (error) {
      console.error(error);

      showToast(
        error.message ||
          "Checkout failed.",
        "error"
      );
    }
  };

  const reportDamage = (
    equipmentItem
  ) => {
    if (offline) {
      showToast(
        "Reconnect before reporting damage.",
        "error"
      );
      return;
    }

    setSelectedEquipment(
      equipmentItem
    );

    setDamageDescription("");
    setDamageSeverity("MEDIUM");

    setModal("damage");
  };

  const submitDamage = async () => {
    if (!selectedEquipment) {
      return;
    }

    if (offline) {
      showToast(
        "Reconnect before reporting damage.",
        "error"
      );
      return;
    }

    if (!damageDescription.trim()) {
      showToast(
        "Describe the problem before submitting.",
        "error"
      );
      return;
    }

    const booking =
      bookings.find(
        (item) =>
          item.equipment_id ===
            selectedEquipment.id &&
          item.status === "ACTIVE"
      );

    if (!booking) {
      showToast(
        "There is no active checkout for this machine.",
        "error"
      );
      return;
    }

    try {
      const response =
        await fetch(
          `${API}/api/bookings/${booking.id}/condition`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              equipment_id:
                selectedEquipment.id,
              booking_id:
                booking.id,
              reported_by:
                booking.farmer_name,
              engine_ok: true,
              tires_ok: true,
              leakage_ok: true,
              attachments_ok: true,
              safety_ok: true,
              report_type: "DAMAGE",
              description:
                damageDescription.trim(),
              severity:
                damageSeverity,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Damage report failed."
        );
      }

      setModal(null);
      setSelectedEquipment(null);

      await loadData();

      showToast(
        "Damage reported. New bookings are paused."
      );
    } catch (error) {
      console.error(error);

      showToast(
        error.message ||
          "Damage report failed.",
        "error"
      );
    }
  };

  /*
   * ADMIN REPAIR APPROVAL
   *
   * Backend endpoint:
   * POST /api/admin/equipment/{equipment_id}/return-to-service
   */
  const returnToService = async (
    equipmentItem
  ) => {
    if (!adminMode) {
      showToast(
        "Admin mode is required to approve repairs.",
        "error"
      );
      return;
    }

    if (offline) {
      showToast(
        "Reconnect before approving repairs.",
        "error"
      );
      return;
    }

    try {
      const response =
        await fetch(
          `${API}/api/admin/equipment/${equipmentItem.id}/return-to-service`,
          {
            method: "POST",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Could not return equipment to service."
        );
      }

      await loadData();

      showToast(
        `${equipmentItem.name} is back in service.`
      );
    } catch (error) {
      console.error(error);

      showToast(
        error.message ||
          "Could not return equipment to service.",
        "error"
      );
    }
  };

  const returnBooking =
    async (booking) => {
      if (offline) {
        showToast(
          "Reconnect before returning equipment.",
          "error"
        );
        return;
      }

      try {
        const response =
          await fetch(
            `${API}/api/bookings/${booking.id}/return`,
            {
              method: "POST",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
              "Return failed."
          );
        }

        await loadData();

        showToast(
          "Equipment returned successfully."
        );
      } catch (error) {
        console.error(error);

        showToast(
          error.message ||
            "Return failed.",
          "error"
        );
      }
    };

  const openHistory =
    async (equipmentItem) => {
      setSelectedEquipment(
        equipmentItem
      );

      setHistory([]);
      setModal("history");

      try {
        const response =
          await fetch(
            `${API}/api/equipment/${equipmentItem.id}/history`
          );

        if (!response.ok) {
          throw new Error(
            "Could not load history."
          );
        }

        const data =
          await response.json();

        setHistory(data);
      } catch (error) {
        console.error(error);

        setHistory([]);

        showToast(
          "Could not load equipment history.",
          "error"
        );
      }
    };

  return (
    <div className="app-shell">
      {toast && (
        <div
          className={`toast ${toast.type}`}
        >
          {toast.type === "error" ? (
            <AlertTriangle size={17} />
          ) : (
            <CheckCircle2 size={17} />
          )}

          <span>
            {toast.message}
          </span>

          <button
            type="button"
            className="toast-close"
            onClick={() =>
              setToast(null)
            }
          >
            <X size={15} />
          </button>
        </div>
      )}

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Leaf size={22} />
          </div>

          <div>
            <div className="brand-name">
              FarmShare
            </div>

            <div className="brand-subtitle">
              Cooperative Equipment
            </div>
          </div>
        </div>

        <div className="topbar-right">
          <div className="sync-status">
            <span className="live-dot" />

            <strong>
              {offline
                ? "Offline"
                : "Live"}
            </strong>

            <span>
              {offline
                ? "Changes unavailable"
                : "Synced just now"}
            </span>
          </div>

          <button
            type="button"
            className={`admin-toggle ${
              adminMode ? "active" : ""
            }`}
            onClick={() =>
              setAdminMode(
                (value) => !value
              )
            }
          >
            <ShieldCheck size={16} />

            {adminMode
              ? "Admin on"
              : "Admin"}
          </button>
        </div>
      </header>

      {offline && (
        <div className="offline-banner">
          <CloudOff size={17} />

          <span>
            You're offline. Existing
            information remains visible;
            reconnect to make changes.
          </span>

          <button
            type="button"
            onClick={loadData}
          >
            <RefreshCw size={15} />
            Retry
          </button>
        </div>
      )}

      <main>
        <section className="hero">
          <div className="eyebrow">
            <Zap size={15} />
            COOPERATIVE OPERATIONS
          </div>

          <h1>
            Keep every machine moving.
          </h1>

          <p>
            See what's available, reserve
            equipment, and keep a clear
            record of every handoff.
          </p>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Tractor size={20} />
            </div>

            <div>
              <span>
                Total equipment
              </span>

              <strong>
                {equipment.length}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <CheckCircle2 size={20} />
            </div>

            <div>
              <span>
                Available now
              </span>

              <strong>
                {availableCount}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Clock3 size={20} />
            </div>

            <div>
              <span>
                Currently in use
              </span>

              <strong>
                {inUseCount}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon attention">
              <Wrench size={20} />
            </div>

            <div>
              <span>
                Needs attention
              </span>

              <strong>
                {attentionCount}
              </strong>
            </div>
          </div>
        </section>

        <section className="demo-section">
          <div className="section-kicker">
            QUICK DEMO
          </div>

          <div className="section-heading-row">
            <div>
              <h2>
                See the accountability loop
              </h2>
            </div>

            <div className="demo-progress">
              <strong>
                {completedDemoSteps}/3
              </strong>

              <span>
                flow ready
              </span>
            </div>
          </div>

          <div className="demo-steps">
            <div className="demo-step complete">
              <div className="demo-step-icon">
                <CheckCircle2 size={18} />
              </div>

              <div>
                <strong>
                  Reserve
                </strong>

                <span>
                  Choose an available
                  machine and time.
                </span>
              </div>
            </div>

            <div className="demo-step complete">
              <div className="demo-step-icon">
                <CheckCircle2 size={18} />
              </div>

              <div>
                <strong>
                  Inspect
                </strong>

                <span>
                  Complete the mandatory
                  pre-use checklist.
                </span>
              </div>
            </div>

            <div className="demo-step complete">
              <div className="demo-step-icon">
                <CheckCircle2 size={18} />
              </div>

              <div>
                <strong>
                  Use &amp; report
                </strong>

                <span>
                  Return it or pause it
                  when damage is found.
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="fleet-section">
          <div className="section-heading-row">
            <div>
              <div className="section-kicker">
                FLEET
              </div>

              <h2>
                Equipment
              </h2>
            </div>

            <button
              type="button"
              className="refresh-button"
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCw
                size={16}
                className={
                  loading
                    ? "spinning"
                    : ""
                }
              />

              Refresh
            </button>
          </div>

          {loading &&
          equipment.length === 0 ? (
            <div className="loading-state">
              <RefreshCw
                size={22}
                className="spinning"
              />

              <span>
                Loading cooperative
                equipment…
              </span>
            </div>
          ) : equipment.length === 0 ? (
            <div className="empty-state">
              <Tractor size={28} />

              <strong>
                No equipment found
              </strong>

              <span>
                Check that the
                cooperative server
                is running.
              </span>
            </div>
          ) : (
            <div className="equipment-grid">
              {equipment.map(
                (item) => (
                  <EquipmentCard
                    key={item.id}
                    equipment={item}
                    bookings={bookings}
                    offline={offline}
                    adminMode={adminMode}
                    onReserve={
                      startBooking
                    }
                    onInspect={
                      startInspection
                    }
                    onReportDamage={
                      reportDamage
                    }
                    onHistory={
                      openHistory
                    }
                    onReturnToService={
                      returnToService
                    }
                    onReturnBooking={
                      returnBooking
                    }
                  />
                )
              )}
            </div>
          )}
        </section>

        <section className="schedule-section">
          <div className="section-heading-row">
            <div>
              <div className="section-kicker">
                SCHEDULE
              </div>

              <h2>
                Upcoming bookings
              </h2>
            </div>

            <CalendarDays size={21} />
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="empty-schedule">
              <CalendarDays size={24} />

              <span>
                No upcoming bookings.
              </span>
            </div>
          ) : (
            <div className="booking-list">
              {upcomingBookings.map(
                (booking) => {
                  const item =
                    equipment.find(
                      (equipmentItem) =>
                        equipmentItem.id ===
                        booking.equipment_id
                    );

                  return (
                    <div
                      className="schedule-card"
                      key={booking.id}
                    >
                      <div className="schedule-icon">
                        <Tractor size={19} />
                      </div>

                      <div className="schedule-main">
                        <strong>
                          {item?.name ||
                            `Equipment #${booking.equipment_id}`}
                        </strong>

                        <span>
                          {booking.farmer_name}
                        </span>
                      </div>

                      <div className="schedule-time">
                        <strong>
                          {formatDateTime(
                            booking.start_time
                          )}
                        </strong>

                        <span>
                          <span className="arrow">
                            →
                          </span>{" "}
                          {formatTime(
                            booking.end_time
                          )}
                        </span>
                      </div>

                      <span className="booking-status">
                        Reserved
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        <section className="trust-section">
          <div className="trust-icon">
            <ShieldCheck size={23} />
          </div>

          <div>
            <strong>
              Every machine has a
              traceable history.
            </strong>

            <span>
              Reservations, inspections,
              damage reports, and repair
              decisions stay connected to
              the equipment.
            </span>
          </div>
        </section>
      </main>

      <footer>
        <strong>
          FarmShare Prototype
        </strong>

        <span>
          Built for cooperative operations
        </span>
      </footer>

      {modal === "booking" &&
        selectedEquipment && (
          <div
            className="modal-backdrop"
            onMouseDown={() =>
              setModal(null)
            }
          >
            <div
              className="modal"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              <div className="modal-header">
                <div>
                  <div className="section-kicker">
                    RESERVE EQUIPMENT
                  </div>

                  <h2>
                    {selectedEquipment.name}
                  </h2>
                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={() =>
                    setModal(null)
                  }
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <label>
                  Farmer name

                  <input
                    value={farmerName}
                    onChange={(event) =>
                      setFarmerName(
                        event.target.value
                      )
                    }
                    placeholder="Enter farmer name"
                  />
                </label>

                <div className="form-grid">
                  <label>
                    Start

                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(event) =>
                        setStartTime(
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    End

                    <input
                      type="datetime-local"
                      value={endTime}
                      onChange={(event) =>
                        setEndTime(
                          event.target.value
                        )
                      }
                    />
                  </label>
                </div>

                <div className="info-box">
                  <CalendarDays size={18} />

                  <span>
                    Bookings are checked
                    server-side for
                    conflicts before
                    they are confirmed.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setModal(null)
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="primary-button"
                  disabled={offline}
                  onClick={createBooking}
                >
                  <span>
                    Reserve equipment
                  </span>

                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </div>
        )}

      {modal === "inspection" &&
        selectedEquipment &&
        selectedBooking && (
          <div
            className="modal-backdrop"
            onMouseDown={() =>
              setModal(null)
            }
          >
            <div
              className="modal"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              <div className="modal-header">
                <div>
                  <div className="section-kicker">
                    PRE-USE CHECK
                  </div>

                  <h2>
                    Inspect{" "}
                    {selectedEquipment.name}
                  </h2>
                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={() =>
                    setModal(null)
                  }
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div className="inspection-intro">
                  <ShieldCheck size={21} />

                  <div>
                    <strong>
                      Mandatory before
                      checkout
                    </strong>

                    <span>
                      Confirm the machine
                      is safe to use.
                      Any failed item
                      must be resolved
                      before checkout.
                    </span>
                  </div>
                </div>

                <div className="checklist">
                  {[
                    [
                      "engine_ok",
                      "Engine starts and runs normally",
                    ],
                    [
                      "tires_ok",
                      "Tyres / wheels look safe",
                    ],
                    [
                      "leakage_ok",
                      "No visible fluid leakage",
                    ],
                    [
                      "attachments_ok",
                      "Attachments are secure",
                    ],
                    [
                      "safety_ok",
                      "Safety guards and controls work",
                    ],
                  ].map(
                    ([key, label]) => (
                      <label
                        className={`check-row ${
                          inspection[key]
                            ? "checked"
                            : "failed"
                        }`}
                        key={key}
                      >
                        <input
                          type="checkbox"
                          checked={
                            inspection[key]
                          }
                          onChange={(event) =>
                            setInspection(
                              (current) => ({
                                ...current,
                                [key]:
                                  event.target
                                    .checked,
                              })
                            )
                          }
                        />

                        <span className="custom-checkbox">
                          {inspection[key] && (
                            <CheckCircle2
                              size={16}
                            />
                          )}
                        </span>

                        <span>
                          {label}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setModal(null)
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="primary-button"
                  disabled={
                    offline ||
                    !Object.values(
                      inspection
                    ).every(Boolean)
                  }
                  onClick={
                    checkoutEquipment
                  }
                >
                  <span>
                    Confirm &amp; check out
                  </span>

                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </div>
        )}

      {modal === "damage" &&
        selectedEquipment && (
          <div
            className="modal-backdrop"
            onMouseDown={() =>
              setModal(null)
            }
          >
            <div
              className="modal"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              <div className="modal-header">
                <div>
                  <div className="section-kicker">
                    REPORT DAMAGE
                  </div>

                  <h2>
                    {selectedEquipment.name}
                  </h2>
                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={() =>
                    setModal(null)
                  }
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div className="warning-box">
                  <AlertTriangle size={20} />

                  <div>
                    <strong>
                      This will pause new
                      bookings.
                    </strong>

                    <span>
                      The cooperative
                      administrator must
                      approve the repair
                      before the machine
                      returns to service.
                    </span>
                  </div>
                </div>

                <label>
                  What happened?

                  <textarea
                    rows="4"
                    value={
                      damageDescription
                    }
                    onChange={(event) =>
                      setDamageDescription(
                        event.target.value
                      )
                    }
                    placeholder="Describe the problem..."
                  />
                </label>

                <label>
                  Severity

                  <select
                    value={
                      damageSeverity
                    }
                    onChange={(event) =>
                      setDamageSeverity(
                        event.target.value
                      )
                    }
                  >
                    <option value="LOW">
                      Low
                    </option>

                    <option value="MEDIUM">
                      Medium
                    </option>

                    <option value="HIGH">
                      High
                    </option>

                    <option value="CRITICAL">
                      Critical
                    </option>
                  </select>
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setModal(null)
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="danger-button"
                  disabled={offline}
                  onClick={submitDamage}
                >
                  <AlertTriangle size={17} />

                  <span>
                    Pause &amp; report damage
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

      {modal === "history" &&
        selectedEquipment && (
          <div
            className="modal-backdrop"
            onMouseDown={() =>
              setModal(null)
            }
          >
            <div
              className="modal history-modal"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              <div className="modal-header">
                <div>
                  <div className="section-kicker">
                    EQUIPMENT HISTORY
                  </div>

                  <h2>
                    {selectedEquipment.name}
                  </h2>
                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={() =>
                    setModal(null)
                  }
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                {history.length === 0 ? (
                  <div className="empty-history">
                    <History size={25} />

                    <strong>
                      No history yet
                    </strong>

                    <span>
                      Activity for this
                      machine will
                      appear here as
                      farmers use it.
                    </span>
                  </div>
                ) : (
                  <div className="timeline">
                    {history.map(
                      (event, index) => (
                        <div
                          className="timeline-item"
                          key={
                            event.id ||
                            `${event.created_at}-${index}`
                          }
                        >
                          <div className="timeline-dot">
                            <CircleDot size={10} />
                          </div>

                          <div className="timeline-content">
                            <div className="timeline-top">
                              <strong>
                                {
                                  event.event_type ||
                                  event.type ||
                                  "Activity"
                                }
                              </strong>

                              <span>
                                {formatDateTime(
                                  event.created_at
                                )}
                              </span>
                            </div>

                            <p>
                              {
                                event.description ||
                                event.message ||
                                "Equipment activity recorded."
                              }
                            </p>

                            {event.actor && (
                              <span className="timeline-actor">
                                By{" "}
                                {event.actor}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setModal(null)
                  }
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      {adminMode && (
        <div className="admin-panel">
          <div className="admin-panel-inner">
            <div className="admin-panel-heading">
              <div className="admin-panel-icon">
                <ShieldCheck size={18} />
              </div>

              <div>
                <strong>
                  Administrator mode
                </strong>

                <span>
                  Repair approvals are enabled.
                </span>
              </div>
            </div>

            <div className="admin-repair-list">
              {equipment
                .filter(
                  (item) =>
                    item.status === "REPAIR"
                )
                .map((item) => (
                  <div
                    className="admin-repair-item"
                    key={item.id}
                  >
                    <div>
                      <strong>
                        {item.name}
                      </strong>

                      <span>
                        {item.location}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="repair-button"
                      disabled={offline}
                      onClick={() =>
                        returnToService(
                          item
                        )
                      }
                    >
                      <ShieldCheck size={15} />

                      <span>
                        Approve repair
                      </span>
                    </button>
                  </div>
                ))}

              {equipment.filter(
                (item) =>
                  item.status === "REPAIR"
              ).length === 0 && (
                <div className="admin-clear">
                  <CheckCircle2 size={17} />

                  <span>
                    No equipment is
                    currently awaiting
                    repair approval.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}