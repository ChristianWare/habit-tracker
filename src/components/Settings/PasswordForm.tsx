"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { changePassword } from "@/actions/settings";
import styles from "./Settings.module.css";

export default function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== again)
      return void toast.error("The new passwords don't match.");
    start(async () => {
      const res = await changePassword({ current, next });
      if (!res.ok) return void toast.error(res.error);
      toast.success("Password changed");
      setCurrent("");
      setNext("");
      setAgain("");
    });
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      <label className={`field ${styles.full}`}>
        <span className='label'>Current password</span>
        <input
          className='input'
          type='password'
          autoComplete='current-password'
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </label>
      <label className='field'>
        <span className='label'>New password (12+ characters)</span>
        <input
          className='input'
          type='password'
          autoComplete='new-password'
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
      </label>
      <label className='field'>
        <span className='label'>New password again</span>
        <input
          className='input'
          type='password'
          autoComplete='new-password'
          value={again}
          onChange={(e) => setAgain(e.target.value)}
        />
      </label>
      <div className={styles.full}>
        <button
          type='submit'
          className='primaryBtn'
          disabled={pending || !current || !next}
        >
          {pending ? "Saving…" : "Change password"}
        </button>
      </div>
    </form>
  );
}
