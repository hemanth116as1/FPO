
"use client";

import { useState } from "react";
import styles from "./AddUser.module.css";

type FormData = {
  name: string;
  mobile: string;
  role: string;
  address: string;
};

type FieldName = keyof FormData;
type FieldErrors = Partial<Record<FieldName, string>>;

function isFieldName(name: string): name is FieldName {
  return name === "name" || name === "mobile" || name === "role" || name === "address";
}

function validateField(name: FieldName, value: string) {
  if (name === "mobile") {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return "Mobile number is required.";
    }

    if (!/^[+\d\s()-]+$/.test(trimmedValue)) {
      return "Enter a valid Indian mobile number.";
    }

    const digits = trimmedValue.replace(/\D/g, "");
    const nationalNumber =
      digits.length === 12 && digits.startsWith("91")
        ? digits.slice(2)
        : digits;

    return /^[6-9]\d{9}$/.test(nationalNumber)
      ? ""
      : "Enter a valid 10-digit Indian mobile number.";
  }

  if (name === "name" && !value.trim()) {
    return "Name is required.";
  }

  if (name === "address" && !value.trim()) {
    return "Address is required.";
  }

  return "";
}

export default function AddUser() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    mobile: "",
    role: "BASIC_USER",
    address: "",
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    if (!isFieldName(name)) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (hasSubmitted) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value),
      }));
    }
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setHasSubmitted(true);
    const errors: FieldErrors = {
      name: validateField("name", formData.name),
      mobile: validateField("mobile", formData.mobile),
      address: validateField("address", formData.address),
    };
    setFieldErrors(errors);

    if (Object.values(errors).some(Boolean)) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create user");
      }

      alert("User created successfully!");

      setFormData({
        name: "",
        mobile: "",
        role: "BASIC_USER",
        address: "",
      });
      setFieldErrors({});
      setHasSubmitted(false);
    } catch (error) {
      console.error(error);
      alert("Unable to create user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Add user</h1>
        <p className={styles.description}>Enter the details for the new user.</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="add-user-name">
              Name
            </label>
            <input
              className={`${styles.input} ${fieldErrors.name ? styles.invalid : ""}`}
              id="add-user-name"
              name="name"
              placeholder="Enter name"
              value={formData.name}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "add-user-name-error" : undefined}
              autoComplete="name"
            />
            {fieldErrors.name && (
              <p className={styles.error} id="add-user-name-error" role="alert">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="add-user-mobile">
              Mobile
            </label>
            <input
              className={`${styles.input} ${fieldErrors.mobile ? styles.invalid : ""}`}
              id="add-user-mobile"
              name="mobile"
              type="tel"
              placeholder="Enter mobile number"
              value={formData.mobile}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.mobile)}
              aria-describedby={fieldErrors.mobile ? "add-user-mobile-error" : undefined}
              autoComplete="tel"
            />
            {fieldErrors.mobile && (
              <p className={styles.error} id="add-user-mobile-error" role="alert">
                {fieldErrors.mobile}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="add-user-role">
              Role
            </label>
            <select
              className={styles.input}
              id="add-user-role"
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="BASIC_USER">Basic User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="add-user-address">
              Address
            </label>
            <input
              className={`${styles.input} ${fieldErrors.address ? styles.invalid : ""}`}
              id="add-user-address"
              name="address"
              placeholder="Enter address"
              value={formData.address}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.address)}
              aria-describedby={fieldErrors.address ? "add-user-address-error" : undefined}
              autoComplete="street-address"
            />
            {fieldErrors.address && (
              <p className={styles.error} id="add-user-address-error" role="alert">
                {fieldErrors.address}
              </p>
            )}
          </div>

          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </section>
  );
}
