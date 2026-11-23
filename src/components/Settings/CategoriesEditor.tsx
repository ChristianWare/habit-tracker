"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { deleteCategory, moveCategory, saveCategory } from "@/actions/settings";
import { ChevronLeft, ChevronRight, TrashIcon } from "@/components/icons";
import type { CategoryRef } from "@/components/ui/CategoryPill";
import styles from "./Settings.module.css";

const SWATCHES = [
  "#3a4560",
  "#0b7547",
  "#b86e00",
  "#6b2633",
  "#2563eb",
  "#7c3aed",
  "#0e7490",
  "#be185d",
  "#ff9f00",
  "#0b0f1a",
];

function Row({
  c,
  first,
  last,
}: {
  c: CategoryRef;
  first: boolean;
  last: boolean;
}) {
  const [name, setName] = useState(c.name);
  const [color, setColor] = useState(c.color);
  const [pending, start] = useTransition();
  const dirty = name !== c.name || color !== c.color;

  const run = (
    fn: () => Promise<{ ok: boolean; error?: string }>,
    msg?: string,
  ) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) toast.error(res.error ?? "Something went wrong.");
      else if (msg) toast.success(msg);
    });

  return (
    <li className={styles.catRow}>
      <input
        type='color'
        className={styles.color}
        value={color}
        onChange={(e) => setColor(e.target.value)}
        aria-label={`${c.name} colour`}
      />
      <input
        className='input'
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={30}
        aria-label='Category name'
      />
      <div className={styles.catBtns}>
        {dirty ? (
          <button
            type='button'
            className='primaryBtn'
            disabled={pending}
            onClick={() =>
              run(() => saveCategory({ id: c.id, name, color }), "Saved")
            }
          >
            Save
          </button>
        ) : null}
        <button
          type='button'
          className='ghostBtn'
          disabled={pending || first}
          aria-label='Move up'
          onClick={() => run(() => moveCategory(c.id, "up"))}
        >
          <ChevronLeft
            style={{ transform: "rotate(90deg)" }}
            width={18}
            height={18}
          />
        </button>
        <button
          type='button'
          className='ghostBtn'
          disabled={pending || last}
          aria-label='Move down'
          onClick={() => run(() => moveCategory(c.id, "down"))}
        >
          <ChevronRight
            style={{ transform: "rotate(90deg)" }}
            width={18}
            height={18}
          />
        </button>
        <button
          type='button'
          className='ghostBtn'
          disabled={pending}
          aria-label={`Delete ${c.name}`}
          onClick={() => {
            if (window.confirm(`Delete "${c.name}"?`))
              run(() => deleteCategory(c.id), "Deleted");
          }}
        >
          <TrashIcon width={18} height={18} />
        </button>
      </div>
    </li>
  );
}

export default function CategoriesEditor({
  categories,
}: {
  categories: CategoryRef[];
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(
    SWATCHES[categories.length % SWATCHES.length],
  );
  const [pending, start] = useTransition();

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await saveCategory({ name, color });
      if (!res.ok) return void toast.error(res.error);
      toast.success("Category added");
      setName("");
    });
  };

  return (
    <div className={styles.cats}>
      <ul className={styles.catList}>
        {categories.map((c, i) => (
          <Row
            key={`${c.id}-${c.name}-${c.color}`}
            c={c}
            first={i === 0}
            last={i === categories.length - 1}
          />
        ))}
      </ul>
      <form className={styles.catRow} onSubmit={add}>
        <input
          type='color'
          className={styles.color}
          value={color}
          onChange={(e) => setColor(e.target.value)}
          aria-label='New category colour'
        />
        <input
          className='input'
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='New category'
          maxLength={30}
        />
        <div className={styles.catBtns}>
          <button
            type='submit'
            className='secondaryBtn'
            disabled={pending || !name.trim()}
          >
            Add
          </button>
        </div>
      </form>
      <p className='miniNote'>
        The order here is the order on Today and the calendar filters (1, 2,
        3…).
      </p>
    </div>
  );
}
