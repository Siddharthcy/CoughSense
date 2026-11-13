"use client"

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
]

const SMOKING = [
  { value: "smoker", label: "Smoker" },
  { value: "non-smoker", label: "Non-smoker" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
]

function Field({ label, hint, children, htmlFor }) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
      >
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground/80">{hint}</p> : null}
    </div>
  )
}

function ChipGroup({ name, options, value, onChange, disabled, columns = 3 }) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`rounded-xl border px-3 py-2.5 text-xs font-medium transition sm:text-sm ${
              active
                ? "border-primary/60 bg-primary/12 text-primary"
                : "border-border bg-background/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
            } disabled:opacity-50`}
            style={active ? { boxShadow: "0 0 24px -10px rgba(94,234,246,0.6)" } : undefined}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export default function UserMetadataForm({ values, onChange, disabled }) {
  const set = (key, val) => onChange({ ...values, [key]: val })

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Field label="Age" htmlFor="age" hint="Between 1 and 120 years.">
        <input
          id="age"
          type="number"
          inputMode="numeric"
          min={1}
          max={120}
          placeholder="e.g. 34"
          disabled={disabled}
          value={values.age}
          onChange={(e) => set("age", e.target.value)}
          className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
      </Field>

      <Field label="Gender">
        <ChipGroup
          name="Gender"
          options={GENDERS}
          value={values.gender}
          onChange={(v) => set("gender", v)}
          disabled={disabled}
        />
      </Field>

      <div className="md:col-span-2">
        <Field label="Smoking Status">
          <ChipGroup
            name="Smoking status"
            options={SMOKING}
            value={values.smoker}
            onChange={(v) => set("smoker", v)}
            disabled={disabled}
            columns={3}
          />
        </Field>
      </div>
    </div>
  )
}
