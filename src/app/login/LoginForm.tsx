"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { login } from "@/actions/auth";
import styles from "./Login.module.css";

export default function LoginForm() {
  const next = useSearchParams().get("next") ?? "/";
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className={styles.formInner}>
      <input type='hidden' name='next' value={next} />
      <label className='field'>
        <span className='label'>Email</span>
        <input
          className='input'
          name='email'
          type='email'
          autoComplete='username'
          defaultValue={state?.email ?? ""}
          key={state?.email ?? ""}
          required
          disabled={pending}
        />
      </label>
      <label className='field'>
        <span className='label'>Password</span>
        <input
          className='input'
          name='password'
          type='password'
          autoComplete='current-password'
          required
          disabled={pending}
        />
      </label>

      {state?.error ? (
        <p className={styles.error} role='alert'>
          {state.error}
        </p>
      ) : null}

      <button type='submit' className={styles.submit} disabled={pending}>
        {pending ? "Logging in…" : "Log in"}
        <span className={styles.box} aria-hidden='true'>
          <svg
            viewBox='0 0 24 24'
            width='16'
            height='16'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.4'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M5 12h14M13 6l6 6-6 6' />
          </svg>
        </span>
      </button>
    </form>
  );
}
