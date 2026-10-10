"use client";

import { useEffect, useState } from "react";
import styles from "../../home/Home.module.css";

type MilkRecord = {
  id: string;
  date: string;
  quantity: number;
  TimeType: "Morning" | "Evening";
  SNF:number,
  fat:number
};

type RecordDraft = {
  date: string;
  quantity: string;
  TimeType: "Morning" | "Evening";
  SNF:number,
  fat:number
};

type Notification = {
  id: number;
  message: string;
  type: "success" | "error";
};

const RECORDS_PER_PAGE = 10;

function isMilkRecord(value: unknown): value is MilkRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.date === "string" &&
    typeof record.quantity === "number" &&
    (record.TimeType === "Morning" || record.TimeType === "Evening")
  );
}

function localDateValue(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayDateValue() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

export default function MilkRecordsPage() {
  const [records, setRecords] = useState<MilkRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [draft, setDraft] = useState<RecordDraft | null>(null);
  const [originalRecord, setOriginalRecord] = useState<MilkRecord | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [notification, setNotification] = useState<Notification | null>(null);
  const totalPages = Math.max(1, Math.ceil(records.length / RECORDS_PER_PAGE));
  const displayedPage = Math.min(currentPage, totalPages);
  const visibleRecords = records.slice(
    (displayedPage - 1) * RECORDS_PER_PAGE,
    displayedPage * RECORDS_PER_PAGE,
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadRecords() {
      try {
        const response = await fetch("/api/milkrecords/milkrecords", {
          signal: controller.signal,
          cache: "no-store",
        });
        const result: unknown = await response.json();

        if (!response.ok) {
          const message =
            result && typeof result === "object" && "error" in result &&
            typeof result.error === "string"
              ? result.error
              : "Unable to load milk records.";
          throw new Error(message);
        }

        if (!Array.isArray(result) || !result.every(isMilkRecord)) {
          throw new Error("The milk records response was invalid.");
        }
        setRecords(result);
      } catch (cause) {
        if (cause instanceof Error && cause.name === "AbortError") return;
        console.error("Error loading milk records:", cause);
        setError(cause instanceof Error ? cause.message : "Unable to load milk records.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadRecords();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!notification) return;
    const timer = window.setTimeout(() => setNotification(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notification]);

  function notify(message: string, type: Notification["type"]) {
    setNotification({ id: Date.now(), message, type });
  }

  function beginEdit(record: MilkRecord) {
    setEditingRecordId(record.id);
    setDraft({
      date: localDateValue(record.date),
      quantity: String(record.quantity),
      TimeType: record.TimeType,
      SNF:record.SNF,
      fat:record.fat
    });
    setOriginalRecord(record);
    setIsCreating(false);
    setValidationError("");
  }

  function addRecord() {
    const id = crypto.randomUUID();
    const currentDate = new Date();
    setCurrentPage(Math.ceil((records.length + 1) / RECORDS_PER_PAGE));
    const newRecord: MilkRecord = {
      id,
      date: currentDate.toISOString(),
      quantity: 0,
      TimeType: "Morning",
      SNF:0,
      fat:0
    };
    setRecords((currentRecords) => [...currentRecords, newRecord]);
    setEditingRecordId(id);
    setDraft({ date: todayDateValue(), quantity: "", TimeType: "Morning" ,SNF:0,fat:0});
    setOriginalRecord(null);
    setIsCreating(true);
    setValidationError("");
  }

  function cancelEdit() {
    if (isCreating && editingRecordId) {
      setRecords((currentRecords) =>
        currentRecords.filter((record) => record.id !== editingRecordId),
      );
    } else if (originalRecord) {
      setRecords((currentRecords) =>
        currentRecords.map((record) =>
          record.id === originalRecord.id ? originalRecord : record,
        ),
      );
    }
    setEditingRecordId(null);
    setDraft(null);
    setOriginalRecord(null);
    setIsCreating(false);
    setValidationError("");
  }

  async function saveRecord() {
    if (!editingRecordId || !draft) return;

    const quantity = Number(draft.quantity);
    if (!draft.date) {
      setValidationError("Choose a date for this record.");
      return;
    }
    if (!Number.isFinite(new Date(draft.date).getTime())) {
      setValidationError("Enter a valid date.");
      return;
    }
    if (!draft.quantity || !Number.isFinite(quantity) || quantity <= 0) {
      setValidationError("Quantity must be a positive number.");
      return;
    }
    if (Math.abs(quantity * 100 - Math.round(quantity * 100)) >= 1e-8) {
      setValidationError("Quantity can have no more than two decimal places.");
      return;
    }

    setIsSaving(true);
    setValidationError("");
    try {
      const response = await fetch("/api/milkrecords/milkrecords", {
        method: isCreating ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isCreating ? {} : { id: editingRecordId }),
          date: new Date(`${draft.date}T12:00:00`).toISOString(),
          quantity,
          TimeType: draft.TimeType,
        }),
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        const message =
          result && typeof result === "object" && "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Unable to save this milk record.";
        throw new Error(message);
      }
      if (!isMilkRecord(result)) {
        throw new Error("The saved milk record response was invalid.");
      }

      if (isCreating) {
        setRecords((currentRecords) =>
          currentRecords.map((record) =>
            record.id === editingRecordId ? result : record,
          ),
        );
      } else {
        setRecords((currentRecords) =>
          currentRecords.map((record) =>
            record.id === result.id ? result : record,
          ),
        );
      }
      notify(isCreating ? "Record added successfully." : "Record edited successfully.", "success");
      setEditingRecordId(null);
      setDraft(null);
      setOriginalRecord(null);
      setIsCreating(false);
    } catch (cause) {
      console.error("Error saving milk record:", cause);
      notify(cause instanceof Error ? cause.message : "Unable to save this milk record.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteRecord(record: MilkRecord) {
    if (!window.confirm("Delete this milk record? This action cannot be undone.")) return;

    try {
      const response = await fetch("/api/milkrecords/milkrecords", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: record.id }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message =
          result && typeof result === "object" && "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Unable to delete this milk record.";
        throw new Error(message);
      }
      setRecords((currentRecords) =>
        currentRecords.filter((currentRecord) => currentRecord.id !== record.id),
      );
      notify("Record deleted successfully.", "success");
    } catch (cause) {
      console.error("Error deleting milk record:", cause);
      notify(cause instanceof Error ? cause.message : "Unable to delete this milk record.", "error");
    }
  }

  function updateDraft(field: keyof RecordDraft, value: string) {
    setDraft((currentDraft) =>
      currentDraft ? { ...currentDraft, [field]: value } : currentDraft,
    );
    setValidationError("");
  }

  return (
    <section className={styles.records} aria-labelledby="records-title">
      {notification && (
        <div
          key={notification.id}
          className={`${styles.toast} ${notification.type === "success" ? styles.toastSuccess : styles.toastError}`}
          role={notification.type === "error" ? "alert" : "status"}
          aria-live={notification.type === "error" ? "assertive" : "polite"}
        >
          {notification.message}
        </div>
      )}
      <p className={styles.eyebrow}><span aria-hidden="true" /> Dairy workspace</p>
      <div className={styles.recordsHeading}>
        <div>
          <h1 id="records-title">Milk records</h1>
          <p className={styles.description}>Your recent milk collection entries.</p>
        </div>
        <span className={styles.recordCount}>
          {isLoading ? "Loading..." : `${records.length} ${records.length === 1 ? "record" : "records"}`}
        </span>
      </div>

      {isLoading ? (
        <div className={styles.recordsMessage} role="status" aria-live="polite">
          <span className={styles.loadingMark} aria-hidden="true" />
          <span>Loading milk records</span>
        </div>
      ) : error ? (
        <p className={styles.recordsError} role="alert">{error}</p>
      ) : records.length === 0 ? (
        <p className={styles.recordsMessage}>No milk records yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.recordsTable}>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col" className={styles.measurementCell}>Fat</th>
                <th scope="col" className={styles.measurementCell}>SNF</th>
                <th scope="col">Milking</th>
                <th scope="col">Quantity</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRecords.map((record) => {
                const isEditing = editingRecordId === record.id && draft !== null;
                return (
                  <tr key={record.id}>
                    <td>
                      {isEditing ? (
                        <input
                          aria-label="Record date"
                          className={styles.recordInput}
                          type="date"
                          required
                          value={draft.date}
                          onChange={(event) => updateDraft("date", event.target.value)}
                        />
                      ) : (
                        new Date(record.date).toLocaleDateString()
                      )}
                    </td>
                    <td className={styles.measurementCell}>
                      {isEditing ? (
                        <input
                          aria-label="Fat"
                          className={`${styles.recordInput} ${styles.measurementInput}`}
                          type="text"
                          required
                          value={draft.fat}
                          onChange={(event) => updateDraft("fat", event.target.value)}
                        />
                      ) : (
                        record.fat
                      )}
                    </td>
                    <td className={styles.measurementCell}>
                      {isEditing ? (
                        <input
                          aria-label="SNF"
                          className={`${styles.recordInput} ${styles.measurementInput}`}
                          type="text"
                          required
                          value={draft.SNF}
                          onChange={(event) => updateDraft("SNF", event.target.value)}
                        />
                      ) : (
                        record.SNF
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select
                          aria-label="Milking time"
                          className={styles.recordInput}
                          required
                          value={draft.TimeType}
                          onChange={(event) =>
                            updateDraft("TimeType", event.target.value as RecordDraft["TimeType"])
                          }
                        >
                          <option value="Morning">Morning</option>
                          <option value="Evening">Evening</option>
                        </select>
                      ) : (
                        record.TimeType
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <div className={styles.quantityInputWrap}>
                          <input
                            aria-label="Quantity in liters"
                            className={styles.recordInput}
                            type="number"
                            min="0.01"
                            step="0.01"
                            required
                            value={draft.quantity}
                            onChange={(event) => updateDraft("quantity", event.target.value)}
                          />
                          <span>L</span>
                        </div>
                      ) : (
                        `${record.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })} L`
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.saveButton}
                            onClick={() => void saveRecord()}
                            disabled={isSaving}
                          >
                            {isSaving ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={cancelEdit}
                            disabled={isSaving}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={() => beginEdit(record)}
                            disabled={editingRecordId !== null}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className={styles.deleteButton}
                            onClick={() => void deleteRecord(record)}
                            disabled={editingRecordId !== null}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {!isLoading && !error && records.length > 0 && (
        <nav className={styles.pagination} aria-label="Milk records pages">
          <button
            type="button"
            className={styles.paginationButton}
            aria-label="Previous page"
            onClick={() => setCurrentPage(displayedPage - 1)}
            disabled={records.length <= RECORDS_PER_PAGE || displayedPage === 1}
          >
            &lt;
          </button>
          <span className={styles.paginationStatus} aria-live="polite">
            Page {displayedPage} of {totalPages}
          </span>
          <button
            type="button"
            className={styles.paginationButton}
            aria-label="Next page"
            onClick={() => setCurrentPage(displayedPage + 1)}
            disabled={records.length <= RECORDS_PER_PAGE || displayedPage === totalPages}
          >
            &gt;
          </button>
        </nav>
      )}
      {validationError && <p className={styles.validationError} role="alert">{validationError}</p>}
      <button
        type="button"
        className={styles.primaryButton}
        onClick={addRecord}
        disabled={isLoading || Boolean(error) || editingRecordId !== null}
      >
        <span aria-hidden="true">+</span>
        Add Milk Record
      </button>
    </section>
  );
}
